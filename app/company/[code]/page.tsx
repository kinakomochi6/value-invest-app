import { db } from "@/lib/firebaseAdmin";
import { calculatePyo, calculateValueScore, calculateTargetPrice, checkBsAnomaly } from "@/lib/valueLogic";
import BsChart from "@/components/BsChart";
import Link from "next/link";
import type { StockRecord } from "@/lib/types";

const displayValue = (value: unknown, fallback = "-") => {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "string" || typeof value === "number") return value;
  return String(value);
};

// 簡易的なテーブル行を作るための部品
const InfoRow = ({ label, value }: { label: string, value: unknown }) => (
  <tr className="border-b border-gray-100"><th className="py-2 px-3 bg-gray-50 text-gray-600 font-normal w-1/2 text-left">{label}</th><td className="py-2 px-3 font-medium text-right">{displayValue(value)}</td></tr>
);

// Firebaseの特殊な日付データを、ただの文字（YYYY/MM/DD）に変換する関数
const formatDate = (val: unknown) => {
  if (!val) return '-';
  if (val && typeof val === 'object' && '_seconds' in val) {
    return new Date((val as { _seconds: number })._seconds * 1000).toLocaleDateString('ja-JP');
  }
  return String(val);
};

// ★★★ 新規追加：Streamlit版の独自JSON並び順ロジックを完全再現する関数 ★★★
function getOrderedRawData(data: StockRecord) {
  const rawKeys = Object.keys(data);
  const orderedData: StockRecord = {};
  
  // 1. 【優先】★で始まる項目（企業名、業種、資産合計、負債合計、純資産合計など）をアルファベット順
  const starKeys = rawKeys.filter(k => k.startsWith('★')).sort();
  starKeys.forEach(k => orderedData[k] = data[k]);
  
  // 2. 基本的なバリュー・還元・業績指標（★やB/Sプレフィックスなし）をアルファベット順
  const bsPrefixes = ['流動_', '有形_', '無形_', '投資_', '流負_', '固負_', '純資_'];
  const generalKeys = rawKeys.filter(k => 
    !k.startsWith('★') && 
    !bsPrefixes.some(prefix => k.startsWith(prefix))
  ).sort();
  generalKeys.forEach(k => orderedData[k] = data[k]);
  
  // 3. 貸借対照表 (B/S) 項目。指定されたプレフィックス順（ categorized visual order from Python）に、各グループ内でアルファベット順
  bsPrefixes.forEach(prefix => {
    rawKeys.filter(k => k.startsWith(prefix)).sort().forEach(k => {
      orderedData[k] = data[k];
    });
  });
  
  return orderedData;
}

export default async function CompanyDetail({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const doc = await db.collection("companies").doc(code).get();
  
  if (!doc.exists) {
    return (
      <main className="p-8"><h1 className="text-2xl font-bold text-red-600">データが見つかりません</h1><Link href="/" className="text-blue-500 underline mt-4 inline-block">← 一覧に戻る</Link></main>
    );
  }

  const data: StockRecord = JSON.parse(JSON.stringify({ id: doc.id, ...doc.data() }));
  const pyoData = calculatePyo(data);
  const { score, messages } = calculateValueScore(data, pyoData);
  const { status, targetPrice, dropRate } = calculateTargetPrice(data, score, pyoData);
  const anomalies = checkBsAnomaly(data);
  const pyoWarnings = Array.isArray(pyoData['P_與_注意事項'])
    ? pyoData['P_與_注意事項'].filter((item): item is string => typeof item === 'string')
    : [];
  const pyoScoreEligible = pyoData['P_與_スコア利用可'] === true;
  const pyoReliability = displayValue(pyoData['P_與_信頼区分']);
  const pyoDisplay = typeof pyoData['P_與'] === 'number'
    ? `${pyoData['P_與']} 倍`
    : '算出保留';

  // 指値シミュレーション用の計算関数
  const calcSimPrice = (targetPyo: number) => {
    if (!pyoScoreEligible) return "-";
    const currentPrice = typeof data['株価'] === "number" ? data['株価'] : 0;
    const marketCap = typeof data['時価総額_億'] === "number" ? data['時価総額_億'] : 0;
    const realNetAsset = typeof pyoData['実質純資産'] === "number" ? pyoData['実質純資産'] : 0;
    if (currentPrice > 0 && marketCap > 0 && realNetAsset > 0) {
      return Math.floor(currentPrice * ((targetPyo * realNetAsset) / marketCap));
    }
    return "-";
  };

  // ★ここで生データデータを独自の並び順に変換します！
  const orderedRawData = getOrderedRawData(data);

  return (
    <main className="p-8 bg-gray-50 min-h-screen">
      <Link href="/companies" className="text-blue-600 hover:underline font-bold mb-6 inline-block">← 全銘柄一覧に戻る</Link>

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800">[{code}] {displayValue(data['★企業名'])}</h1>
        <p className="text-gray-500 mt-2">
          業種: {displayValue(data['★業種'])} | 市場: {displayValue(data['★市場区分'])} | 最終更新: {formatDate(data['データ最終更新日'])}
        </p>
      </div>

      <div className={`mb-6 border-l-4 p-4 ${pyoScoreEligible ? 'border-green-600 bg-green-50 text-green-900' : 'border-amber-500 bg-amber-50 text-amber-950'}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-bold">B/S分析品質: {pyoReliability}</p>
          <p className="text-sm">
            {displayValue(pyoData['P_與_計算方式'])} / 検証状態: {displayValue(data['B/S_検証状態'])}
          </p>
        </div>
        <p className="mt-1 text-sm">最終正常B/S更新: {formatDate(data['B/S_正常更新日時'])}</p>
        <p className="mt-1 text-sm">正常採用書類: {displayValue(data['B/S_正常更新書類'])}</p>
        {pyoWarnings.length > 0 && (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {pyoWarnings.map((warning, index) => <li key={index}>{warning}</li>)}
          </ul>
        )}
      </div>

      {/* スコアアラート */}
      <div className={`p-4 rounded-lg mb-6 text-lg font-bold border-l-4 ${score >= 70 ? 'bg-green-50 border-green-500 text-green-800' : score >= 40 ? 'bg-blue-50 border-blue-500 text-blue-800' : 'bg-yellow-50 border-yellow-500 text-yellow-800'}`}>
        {score >= 70 ? '💎 総合バリュースコア' : score >= 40 ? '⭐ 総合バリュースコア' : '総合バリュースコア'}: {score} / 100点
      </div>

      {/* 購入判定メッセージ */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-8 border border-gray-200">
        <h3 className="font-bold text-gray-800 mb-2">💡 判定詳細</h3>
        {status === "❌購入非推奨" && <p className="text-red-600">現在の財務状態では、株価がどれだけ下がっても70点に到達しません。（バリュートラップの可能性があります）</p>}
        {status === "⚠️B/S要確認" && <p className="text-amber-700">B/Sの品質確認が必要なため、購入判定と目安株価を停止しています。</p>}
        {status === "⏳下落待ち" && <p className="text-blue-600">約 <strong>{targetPrice} 円</strong> まで下がるとスコアが70点に到達します！（現在価格から <strong>-{dropRate}%</strong> の下落待ち）</p>}
        {status === "✅購入水準" && <p className="text-green-600">既に70点以上の <strong>✅購入水準</strong> に達しています！</p>}
        {messages.length > 0 && (
          <ul className="list-disc ml-5 mt-3 text-gray-600 text-sm space-y-1">
            {messages.map((msg: string, i: number) => <li key={i}>{msg}</li>)}
          </ul>
        )}
        {anomalies.length > 0 && (
          <div className="mt-4 rounded border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
            <p className="font-bold">B/Sデータ確認</p>
            <ul className="ml-5 mt-2 list-disc space-y-1">
              {anomalies.map((msg, i) => <li key={i}>{msg}</li>)}
            </ul>
          </div>
        )}
      </div>

      {/* SECTION 1: サマリー */}
      <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-blue-200 pb-2 mb-4">📊 サマリー</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"><h3 className="text-sm text-gray-500 mb-1">P/與 (実質PBR)</h3><p className={`text-3xl font-bold ${pyoScoreEligible ? 'text-blue-600' : 'text-amber-700'}`}>{pyoDisplay}</p><p className="mt-1 text-xs text-gray-500">{pyoScoreEligible ? 'スコア利用可' : 'B/S品質の確認が必要です'}</p></div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"><h3 className="text-sm text-gray-500 mb-1">実質純資産 (換金価値)</h3><p className="text-3xl font-bold text-gray-800">{pyoData['実質純資産']} 億円</p></div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"><h3 className="text-sm text-gray-500 mb-1">時価総額 (買収価格)</h3><p className="text-3xl font-bold text-gray-800">{displayValue(data['時価総額_億'], "0")} 億円</p></div>
      </div>

      <div className="bg-indigo-50 p-6 rounded-lg shadow-sm border border-indigo-100 mb-8">
        <h3 className="font-bold text-indigo-900 mb-2">🎯 P/與 水準別の目安株価 (指値シミュレーション)</h3>
        <p className="text-xs text-indigo-700 mb-4">現在の実質純資産をベースに、P/與が特定の倍率まで低下した場合の株価を逆算しています。</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded border"><div className="text-xs text-gray-500">P/與 0.7倍 (割安ライン)</div><div className="text-xl font-bold">{calcSimPrice(0.7)} 円</div></div>
          <div className="bg-white p-4 rounded border"><div className="text-xs text-gray-500">P/與 0.5倍 (超絶割安ライン)</div><div className="text-xl font-bold text-blue-600">{calcSimPrice(0.5)} 円</div></div>
          <div className="bg-white p-4 rounded border"><div className="text-xs text-gray-500">P/與 0.3倍 (異常値・暴落時)</div><div className="text-xl font-bold text-red-600">{calcSimPrice(0.3)} 円</div></div>
        </div>
      </div>

      {/* SECTION 2: B/Sグラフ */}
      <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-blue-200 pb-2 mb-4 mt-8">🥧 財務グラフ (B/S)</h2>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <BsChart data={data} />
      </div>

      {/* SECTION 3: 詳細データ */}
      <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-blue-200 pb-2 mb-4 mt-8">📋 詳細データ一覧</h2>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <h3 className="font-bold text-gray-800 mb-4">🔍 P/與 計算プロセス</h3>
        <table className="w-full text-sm text-left border rounded-lg overflow-hidden">
          <tbody>
            <InfoRow label="① B/S資産額 (倍率計算のみ)" value={`${pyoData['倍率計算のみのBS']} 億円`} />
            <InfoRow label="② 有価証券 含み益 (税金控除)" value={`▲ ${pyoData['有価証券_税金控除額']} 億円`} />
            <InfoRow label="③ 調整済 B/S資産 (①-②)" value={`${pyoData['調整済み資産額_BS']} 億円`} />
            <InfoRow label="④ 調整済 不動産" value={`${pyoData['調整済み不動産額']} 億円`} />
            <InfoRow label="⑤ 実質純資産 (③+④)" value={`${pyoData['実質純資産']} 億円`} />
            <InfoRow label="⑥ お買い得度 (⑤÷時価総額)" value={pyoData['お買い得度']} />
            <InfoRow label="大分類の資産合計" value={`${pyoData['B_S分類資産合計']} 億円`} />
            <InfoRow label="総資産との差額" value={`${pyoData['B_S資産合計差額']} 億円`} />
            <InfoRow label="計算方式" value={pyoData['P_與_計算方式']} />
            <tr className="bg-blue-50 font-bold"><th className="py-2 px-3 w-1/2 text-left">🎯 最終 P/與 (1÷⑥)</th><td className="py-2 px-3 text-right text-blue-600">{pyoDisplay}</td></tr>
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="font-bold text-gray-800 mb-4">■ バリュー・株価・資産指標</h3>
          <table className="w-full text-sm border rounded-lg overflow-hidden"><tbody>
            <InfoRow label="表面PBR (倍)" value={data['PBR'] || '-'} />
            <InfoRow label="PER (倍)" value={data['PER'] || '-'} />
            <InfoRow label="4年平均PER_赤字除 (倍)" value={data['4年平均PER_赤字除'] || '-'} />
            <InfoRow label="現在の株価 (円)" value={data['株価'] || '-'} />
            <InfoRow label="時価総額 (億)" value={data['時価総額_億'] || '-'} />
            <InfoRow label="🏢 不動産 含み益" value={`${data['不動産_含み益_億'] || 0} 億円`} />
            <InfoRow label="📈 有価証券 含み益" value={`${data['有価証券_含み益_億'] || 0} 億円`} />
            <InfoRow label="純資産_億" value={data['純資産_億'] || '-'} />
            <InfoRow label="EPS (円)" value={data['EPS'] || '-'} />
            <InfoRow label="ROE (%)" value={data['ROE_pct'] || '-'} />
          </tbody></table>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="font-bold text-gray-800 mb-4">■ 還元・業績推移指標</h3>
          <table className="w-full text-sm border rounded-lg overflow-hidden"><tbody>
            <InfoRow label="配当利回り (%)" value={data['配当利回り_pct'] || '-'} />
            <InfoRow label="配当性向 (%)" value={data['配当性向_pct'] || '-'} />
            <InfoRow label="4年自社株買い利回り (%)" value={data['4年自社株買い利回り_pct'] || '-'} />
            <InfoRow label="4年平均還元利回り (%)" value={data['4年平均還元利回り_pct'] || '-'} />
            <InfoRow label="4年平均自社株買い (億)" value={data['4年平均自社株買い_億'] || '-'} />
            <InfoRow label="4年平均総還元額 (億)" value={data['4年平均総還元額_億'] || '-'} />
            <InfoRow label="4年自社株買い比率 (%)" value={data['4年自社株買い比率_pct'] || '-'} />
            <InfoRow label="10年増配率 (%)" value={data['10年増配率_pct'] || '-'} />
            <InfoRow label="10年減配率 (%)" value={data['10年減配率_pct'] || '-'} />
            <InfoRow label="4年赤字率 (%)" value={`${data['4年赤字率_pct'] || 0}%`} />
          </tbody></table>
        </div>
      </div>

      {/* ★開発用JSONエキスパンダー。独自に並び替えたorderedRawDataを使用します。 */}
      <details className="mt-8 bg-white border border-gray-200 rounded-lg p-4 cursor-pointer shadow-sm">
        <summary className="font-bold text-gray-700">すべての生データをJSONで確認する（開発・確認用）</summary>
        {/* indent depthを2に設定して美しくフォーマットします。 */}
        <pre className="mt-4 text-xs text-gray-600 overflow-x-auto p-4 bg-gray-50 rounded border">
          {JSON.stringify(orderedRawData, null, 2)}
        </pre>
      </details>

    </main>
  );
}
