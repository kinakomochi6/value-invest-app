import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);

const source = fs.readFileSync("lib/valueLogic.ts", "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;
const loadedModule = { exports: {} };
new Function("module", "exports", "require", compiled)(
  loadedModule,
  loadedModule.exports,
  require,
);

const {
  ANALYSIS_BS_FIELD,
  ASSET_MULTIPLIERS,
  calculatePyo,
  calculateTargetPrice,
  calculateValueScore,
} = loadedModule.exports;

function completeAnalysisMap(values = {}) {
  return {
    ...Object.fromEntries(Object.keys(ASSET_MULTIPLIERS).map((key) => [key, 0])),
    "純資_非支配株主持分": 0,
    ...values,
  };
}

function verifiedData(map, overrides = {}) {
  return {
    [ANALYSIS_BS_FIELD]: map,
    "B/S_分析分類バージョン": "1.0",
    "B/S_検証状態": "verified",
    "★資産合計": Object.entries(map)
      .filter(([key]) => key !== "純資_非支配株主持分")
      .reduce((total, [, value]) => total + value, 0),
    "★負債合計": 0,
    "株価": 1000,
    "時価総額_億": 100,
    ...overrides,
  };
}

test("verified and reconciled canonical data can contribute to the score", () => {
  const map = completeAnalysisMap({
    "流動_現金及び預金": 100,
    "流動_売掛金": 50,
    "純資_非支配株主持分": 5,
  });
  const result = calculatePyo(verifiedData(map, { "★負債合計": 10 }));

  assert.equal(result["倍率計算のみのBS"], 125);
  assert.equal(result["P_與"], 0.8);
  assert.equal(result["P_與_信頼区分"], "検証済み");
  assert.equal(result["P_與_スコア利用可"], true);
  assert.equal(result["B_S資産合計差額"], 0);
});

test("partial data remains visible but is excluded from score and target price", () => {
  const map = completeAnalysisMap({ "流動_現金及び預金": 100 });
  const data = verifiedData(map, { "B/S_検証状態": "partial" });
  const pyo = calculatePyo(data);
  const score = calculateValueScore(data, pyo);
  const target = calculateTargetPrice(data, score.score, pyo);

  assert.equal(pyo["P_與"], 1);
  assert.equal(pyo["P_與_スコア利用可"], false);
  assert.equal(score.score, 0);
  assert.equal(target.status, "⚠️B/S要確認");
});

test("a missing PBR represented by zero does not receive value points", () => {
  const map = completeAnalysisMap({ "流動_現金及び預金": 100 });
  const data = verifiedData(map, { "B/S_検証状態": "partial", PBR: 0 });
  const pyo = calculatePyo(data);

  assert.equal(calculateValueScore(data, pyo).score, 0);
});

test("a material canonical asset gap disables investment decisions", () => {
  const map = completeAnalysisMap({ "流動_現金及び預金": 80 });
  const result = calculatePyo(verifiedData(map, { "★資産合計": 100 }));

  assert.equal(result["B_S資産合計差額"], 20);
  assert.equal(result["P_與_信頼区分"], "要注意");
  assert.equal(result["P_與_スコア利用可"], false);
});

test("legacy or incomplete canonical data is never mixed with the new schema", () => {
  const data = {
    [ANALYSIS_BS_FIELD]: { "流動_現金及び預金": 999 },
    "流動_現金及び預金": 20,
    "流動_売掛金": 50,
    "★資産合計": 70,
    "★負債合計": 10,
    "時価総額_億": 100,
    "B/S_検証状態": "verified",
  };
  const result = calculatePyo(data);

  assert.equal(result["倍率計算のみのBS"], 50);
  assert.equal(result["P_與_計算方式"], "旧方式");
  assert.equal(result["P_與_スコア利用可"], false);
});

test("an unsupported canonical version is reference-only", () => {
  const map = completeAnalysisMap({ "流動_現金及び預金": 100 });
  const result = calculatePyo(verifiedData(map, {
    "B/S_分析分類バージョン": "2.0",
  }));

  assert.equal(result["P_與"], 1);
  assert.equal(result["P_與_スコア利用可"], false);
  assert.match(result["P_與_注意事項"].join(" "), /未対応/);
});

test("an unrealized real-estate loss does not create a tax benefit", () => {
  const map = completeAnalysisMap({ "投資_投資不動産": 100 });
  const result = calculatePyo(verifiedData(map, {
    "不動産_簿価_億": 100,
    "不動産_時価_億": 50,
  }));

  assert.equal(result["倍率計算のみのBS"], 15);
  assert.equal(result["調整済み不動産額"], 35);
  assert.equal(result["実質純資産"], 50);
});

test("real-estate market value is not added when book value is missing", () => {
  const map = completeAnalysisMap({ "流動_現金及び預金": 100 });
  const result = calculatePyo(verifiedData(map, {
    "不動産_簿価_億": 0,
    "不動産_時価_億": 50,
  }));

  assert.equal(result["調整済み不動産額"], 0);
  assert.equal(result["実質純資産"], 100);
  assert.match(result["P_與_注意事項"].join(" "), /簿価/);
});
