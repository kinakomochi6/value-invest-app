import type { StockRecord } from "./types";

export const ANALYSIS_BS_FIELD = "B/S_分析分類";
export const SUPPORTED_ANALYSIS_BS_VERSION = "1.0";
export const MIN_REAL_NET_ASSETS_OKU = 1;
export const MIN_REAL_NET_ASSET_RATIO = 0.05;

// 分析用の共通資産分類。負債は内訳ではなく負債合計を一度だけ控除する。
export const ASSET_MULTIPLIERS: Record<string, number> = {
  "流動_現金及び預金": 1, "流動_受取手形": 0.8, "流動_売掛金": 0.8, "流動_契約資産": 0.8,
  "流動_電子記録債権": 0.8, "流動_受取手形・売掛金(合算)": 0.8, "流動_有価証券": 1,
  "流動_棚卸資産": 0.5, "流動_前払費用": 0.8, "流動_未収入金": 0.8, "流動_未収消費税等": 0.8,
  "流動_短期貸付金": 0.8, "流動_リース債権": 0.8, "流動_貸倒引当金": 1, "流動_その他流動資産": 0.15,
  "有形_建物・構築物": 0.15, "有形_機械・運搬具": 0.15, "有形_土地": 0.15, "有形_建設仮勘定": 0.15,
  "有形_リース資産": 0.15, "有形_賃貸用資産": 0.15, "有形_工具器具備品": 0.15, "有形_その他有形固定資産": 0.15,
  "無形_ソフトウエア": 0.15, "無形_のれん": 0.15, "無形_借地権": 0.15, "無形_その他無形固定資産": 0.15,
  "投資_投資有価証券": 1, "投資_関係会社株式": 0.15, "投資_投資不動産": 0.15, "投資_長期貸付金": 0.15,
  "投資_差入保証金": 0.15, "投資_退職給付資産": 0.15, "投資_繰延税金資産": 0.15, "投資_貸倒引当金": 1,
  "投資_その他固定資産": 0.15
};

// 既存の参照元との互換性を維持する公開定数。
export const MULTIPLIERS: Record<string, number> = {
  ...ASSET_MULTIPLIERS,
  "純資_非支配株主持分": -1,
  "★負債合計": -1,
};

const getNumber = (data: StockRecord, key: string) => {
  const value = data[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
};

const getAnalysisMap = (data: StockRecord): StockRecord | null => {
  const value = data[ANALYSIS_BS_FIELD];
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const analysisMap = value as StockRecord;
  const requiredKeys = [
    ...Object.keys(ASSET_MULTIPLIERS),
    "純資_非支配株主持分",
  ];
  const isComplete = requiredKeys.every((key) => {
    const fieldValue = analysisMap[key];
    return typeof fieldValue === "number" && Number.isFinite(fieldValue);
  });
  return isComplete ? analysisMap : null;
};

const getAnalysisNumber = (
  data: StockRecord,
  analysisMap: StockRecord | null,
  key: string,
) => analysisMap ? getNumber(analysisMap, key) : getNumber(data, key);

const getString = (data: StockRecord, key: string) => {
  const value = data[key];
  return typeof value === "string" ? value : "";
};

const round2 = (value: number) => Number(value.toFixed(2));

// 1. P/與の計算
export function calculatePyo(data: StockRecord) {
  const analysisMap = getAnalysisMap(data);
  const warnings: string[] = [];
  const totalAssets = getNumber(data, "★資産合計");
  const totalLiabilities = getNumber(data, "★負債合計");
  const qualityStatus = getString(data, "B/S_検証状態");
  const classificationVersion = getString(data, "B/S_分析分類バージョン");

  let classifiedAssets = 0;
  let adjustedAssets = 0;
  for (const [key, multiplier] of Object.entries(ASSET_MULTIPLIERS)) {
    const value = getAnalysisNumber(data, analysisMap, key);
    classifiedAssets += value;
    adjustedAssets += value * multiplier;
  }

  const nonControllingInterests = getAnalysisNumber(
    data,
    analysisMap,
    "純資_非支配株主持分",
  );
  const raw_adj_bs_asset = adjustedAssets - totalLiabilities - nonControllingInterests;

  let assetClassificationGap: number | "-" = "-";
  let classificationIsConsistent = false;
  if (analysisMap) {
    assetClassificationGap = totalAssets - classifiedAssets;
    const warningLimit = 1;
    classificationIsConsistent = Math.abs(assetClassificationGap) <= warningLimit;
    if (!classificationIsConsistent) {
      warnings.push(
        `大分類の資産合計と総資産に${round2(assetClassificationGap)}億円の差があります。`,
      );
    }
    if (classificationVersion !== SUPPORTED_ANALYSIS_BS_VERSION) {
      warnings.push(
        `大分類バージョン${classificationVersion || "不明"}は現在の計算方式に未対応です。`,
      );
    }
  } else {
    warnings.push("大分類データが未反映のため、従来分類で参考計算しています。");
  }

  if (qualityStatus === "partial") {
    warnings.push("B/S抽出結果がpartial判定のため、P/與の公開を保留しています。");
  } else if (qualityStatus === "quarantined") {
    warnings.push("最新のB/S抽出が隔離されているため、P/與の公開を保留しています。");
  } else if (qualityStatus !== "verified") {
    warnings.push("B/Sの検証状態を確認できないため、P/與の公開を保留しています。");
  }
  if (totalAssets <= 0) warnings.push("総資産が取得できていません。");
  if (totalLiabilities < 0) warnings.push("負債合計がマイナスのため計算結果を利用できません。");

  const sec_profit = Math.max(0, getNumber(data, '有価証券_含み益_億'));
  const tax_deduction = sec_profit * 0.3;
  const adj_bs_asset = raw_adj_bs_asset - tax_deduction;
      
  const market_val = getNumber(data, '不動産_時価_億');
  const book_val = getNumber(data, '不動産_簿価_億');
  let adj_re_val = 0;
  if (market_val > 0 && book_val > 0) {
    const taxableGain = Math.max(0, market_val - book_val);
    adj_re_val = market_val - (book_val * 0.15) - (taxableGain * 0.3);
  } else if (market_val > 0) {
    warnings.push("不動産の簿価がないため、時価調整を計算に加えていません。");
  }

  const realNetAssets = adj_bs_asset + adj_re_val;
  const market_cap = getNumber(data, '時価総額_億');
  let bargain_degree = 0;
  if (market_cap > 0 && realNetAssets > 0) {
    bargain_degree = realNetAssets / market_cap;
  }

  let referencePyo: number | "-" = "-";
  if (bargain_degree > 0) {
    referencePyo = Number((1 / bargain_degree).toFixed(2));
  }

  if (market_cap <= 0) warnings.push("時価総額が取得できていません。");
  if (realNetAssets <= 0) warnings.push("倍率適用後の実質純資産が0以下です。");

  const minimumStableNetAssets = Math.max(
    MIN_REAL_NET_ASSETS_OKU,
    totalAssets * MIN_REAL_NET_ASSET_RATIO,
  );
  const denominatorIsStable = realNetAssets >= minimumStableNetAssets;
  if (realNetAssets > 0 && !denominatorIsStable) {
    warnings.push(
      `実質純資産が総資産の${MIN_REAL_NET_ASSET_RATIO * 100}%未満または${MIN_REAL_NET_ASSETS_OKU}億円未満で、わずかな分類差によりP/與が大きく変動するため算出を保留しています。`,
    );
  }

  const calculationEligible = Boolean(
    analysisMap
    && classificationVersion === SUPPORTED_ANALYSIS_BS_VERSION
    && qualityStatus === "verified"
    && classificationIsConsistent
    && totalAssets > 0
    && totalLiabilities >= 0
    && market_cap > 0
    && denominatorIsStable
    && typeof referencePyo === "number"
  );
  const p_yo: number | "-" = calculationEligible ? referencePyo : "-";

  let reliability = "要注意";
  if (totalAssets <= 0 || totalLiabilities < 0 || realNetAssets <= 0) {
    reliability = "計算不可";
  } else if (calculationEligible) {
    reliability = "検証済み";
  } else if (!analysisMap) {
    reliability = "旧方式";
  } else if (qualityStatus === "quarantined") {
    reliability = "隔離データ";
  } else if (!denominatorIsStable) {
    reliability = "計算保留";
  }

  return {
    倍率計算のみのBS: round2(raw_adj_bs_asset),
    有価証券_税金控除額: round2(tax_deduction),
    調整済み資産額_BS: round2(adj_bs_asset),
    調整済み不動産額: round2(adj_re_val),
    実質純資産: round2(realNetAssets),
    お買い得度: round2(bargain_degree),
    B_S分類資産合計: round2(classifiedAssets),
    B_S資産合計差額: assetClassificationGap === "-" ? "-" : round2(assetClassificationGap),
    P_與_計算方式: analysisMap ? `大分類 v${classificationVersion || "不明"}` : "旧方式",
    P_與_信頼区分: reliability,
    P_與_注意事項: warnings,
    P_與_参考値: referencePyo,
    P_與_計算可能: calculationEligible,
    P_與: p_yo,
  };
}

// 2. データ状態（B/Sの異常）チェック
export function checkBsAnomaly(data: StockRecord) {
  const anomalies: string[] = [];
  const total_assets = getNumber(data, '★資産合計');
  if (total_assets <= 0) return anomalies;

  const analysisMap = getAnalysisMap(data);
  const threshold = total_assets * 0.05;
  const others_keys = ["流動_その他流動資産", "有形_その他有形固定資産", "無形_その他無形固定資産", "投資_その他固定資産"];
  
  for (const key of others_keys) {
    const val = getAnalysisNumber(data, analysisMap, key);
    if (val < -threshold) {
      anomalies.push(`【${key}】が過剰なマイナス (${val}億円) です。`);
    }
  }
  return anomalies;
}
