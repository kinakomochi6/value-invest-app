import type { StockRecord } from "./types";

export const ANALYSIS_BS_FIELD = "B/S_分析分類";

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

// 1. P/與の計算
export function calculatePyo(data: StockRecord) {
  const analysisMap = getAnalysisMap(data);
  let adjustedAssets = 0;
  for (const [key, multiplier] of Object.entries(ASSET_MULTIPLIERS)) {
    adjustedAssets += getAnalysisNumber(data, analysisMap, key) * multiplier;
  }

  const totalLiabilities = getNumber(data, "★負債合計");
  const nonControllingInterests = getAnalysisNumber(
    data,
    analysisMap,
    "純資_非支配株主持分",
  );
  const raw_adj_bs_asset = adjustedAssets - totalLiabilities - nonControllingInterests;
  
  const sec_profit = getNumber(data, '有価証券_含み益_億');
  const tax_deduction = sec_profit * 0.3;
  const adj_bs_asset = raw_adj_bs_asset - tax_deduction;
      
  const market_val = getNumber(data, '不動産_時価_億');
  const book_val = getNumber(data, '不動産_簿価_億');
  let adj_re_val = 0;
  if (market_val > 0) {
    adj_re_val = market_val - (book_val * 0.15) - ((market_val - book_val) * 0.3);
  }
      
  const market_cap = getNumber(data, '時価総額_億');
  let bargain_degree = 0;
  if (market_cap > 0) {
    bargain_degree = (adj_bs_asset + adj_re_val) / market_cap;
  }
      
  let p_yo: number | "-" = "-";
  if (bargain_degree > 0) {
    p_yo = Number((1 / bargain_degree).toFixed(2));
  }
      
  return {
    倍率計算のみのBS: Number(raw_adj_bs_asset.toFixed(2)),
    有価証券_税金控除額: Number(tax_deduction.toFixed(2)),
    調整済み資産額_BS: Number(adj_bs_asset.toFixed(2)),
    調整済み不動産額: Number(adj_re_val.toFixed(2)),
    実質純資産: Number((adj_bs_asset + adj_re_val).toFixed(2)),
    お買い得度: Number(bargain_degree.toFixed(2)),
    P_與: p_yo
  };
}

// 2. バリュースコアの計算（グラデーション採点版）
export function calculateValueScore(data: StockRecord, pyoData: StockRecord) {
  let score = 0;
  const messages: string[] = [];
  const p_yo = pyoData["P_與"];
  const pbr = getNumber(data, 'PBR');
  const roe = getNumber(data, 'ROE_pct');
  const real_estate_profit = getNumber(data, '不動産_含み益_億');
  const sec_profit = getNumber(data, '有価証券_含み益_億');
  const market_cap = getNumber(data, '時価総額_億');

  // ① P/與 (Max 40点)
  if (typeof p_yo === 'number' && p_yo >= 0) {
    let score_pyo = 0;
    if (p_yo <= 0.5) score_pyo = 40;
    else if (p_yo < 1.0) score_pyo = 40 - ((p_yo - 0.5) / 0.5) * 40;
    score += score_pyo;
    if (p_yo <= 0.5) messages.push(`🔥 【超絶割安】実質PBR(P/與)が0.5以下 (+${Math.floor(score_pyo)}点)`);
    else if (p_yo < 1.0) messages.push(`✅ 【割安】実質PBR(P/與)が1.0未満 (+${Math.floor(score_pyo)}点)`);
  }

  // ② 表面PBR (Max 20点)
  if (typeof pbr === 'number' && pbr >= 0) {
    let score_pbr = 0;
    if (pbr <= 0.5) score_pbr = 20;
    else if (pbr < 1.0) score_pbr = 20 - ((pbr - 0.5) / 0.5) * 20;
    score += score_pbr;
    if (pbr > 0 && pbr <= 0.5) messages.push(`✅ 表面上のPBRも0.5倍以下 (+${Math.floor(score_pbr)}点)`);
  }

  // ③ 含み益インパクト (Max 30点)
  const total_hidden_profit = real_estate_profit + sec_profit;
  if (market_cap > 0 && total_hidden_profit > 0) {
    const hidden_ratio = total_hidden_profit / market_cap;
    const score_hidden = Math.min(30.0, hidden_ratio * 30.0);
    score += score_hidden;
    if (hidden_ratio >= 1.0) messages.push(`🔥 含み益(${total_hidden_profit.toFixed(1)}億)が時価総額以上！ (+${Math.floor(score_hidden)}点)`);
    else if (hidden_ratio >= 0.3) messages.push(`✅ 時価総額に対して30%以上の含み益あり (+${Math.floor(score_hidden)}点)`);
  }

  // ④ ROE (Max 10点)
  if (typeof roe === 'number' && roe > 0) {
    const score_roe = roe >= 8.0 ? 10.0 : (roe / 8.0) * 10.0;
    score += score_roe;
    if (roe >= 8) messages.push(`✅ ROE8%以上で稼ぐ力あり (+${Math.floor(score_roe)}点)`);
  }

  return { score: Math.floor(score), messages };
}

// 3. データ状態（B/Sの異常）チェック
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

// 4. 目標株価の逆算シミュレーション
export function calculateTargetPrice(data: StockRecord, currentScore: number) {
  const current_price = getNumber(data, '株価');
  if (current_price <= 0) return { status: "✖️データなし", targetPrice: null, dropRate: null };
  if (currentScore >= 70) return { status: "✅購入水準", targetPrice: current_price, dropRate: 0.0 };

  // シミュレーション用のコピーを作成（TypeScript流）
  const simDataMin = { ...data };
  simDataMin['時価総額_億'] = getNumber(data, '時価総額_億') * 0.0001;
  simDataMin['PBR'] = getNumber(data, 'PBR') * 0.0001;
  const simPyoMin = calculatePyo(simDataMin);
  const minScoreData = calculateValueScore(simDataMin, simPyoMin);
  
  if (minScoreData.score < 70) return { status: "❌購入非推奨", targetPrice: null, dropRate: null };

  let low = 0.0001;
  let high = 1.0;
  let best_r: number | null = null;
  
  for (let i = 0; i < 20; i++) {
    const mid = (low + high) / 2;
    const simData = { ...data };
    simData['時価総額_億'] = getNumber(data, '時価総額_億') * mid;
    simData['PBR'] = getNumber(data, 'PBR') * mid;
    
    const simPyo = calculatePyo(simData);
    const scoreData = calculateValueScore(simData, simPyo);
    
    if (scoreData.score >= 70) {
      best_r = mid;
      low = mid;
    } else {
      high = mid;
    }
  }

  if (best_r !== null) {
    const target_price = Math.floor(current_price * best_r);
    const drop_rate = Number(((1 - best_r) * 100).toFixed(1));
    return { status: "⏳下落待ち", targetPrice: target_price, dropRate: drop_rate };
  } else {
    return { status: "❌購入非推奨", targetPrice: null, dropRate: null };
  }
}
