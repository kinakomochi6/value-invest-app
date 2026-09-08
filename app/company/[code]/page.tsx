import { db } from "@/lib/firebaseAdmin";
import { calculatePyo, checkBsAnomaly } from "@/lib/valueLogic";
import BsChart from "@/components/BsChart";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Building2,
  Calculator,
  CircleAlert,
  Database,
  Landmark,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { StockRecord } from "@/lib/types";

const displayValue = (value: unknown, fallback = "-") => {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "string" || typeof value === "number") return value;
  return String(value);
};

const InfoRow = ({ label, value }: { label: string; value: unknown }) => (
  <tr className="border-b border-[var(--md-outline-variant)] last:border-b-0">
    <th className="w-1/2 bg-[var(--md-surface-container-low)] px-3 py-2.5 text-left text-xs font-semibold text-[var(--md-on-surface-variant)] sm:text-sm">
      {label}
    </th>
    <td className="px-3 py-2.5 text-right text-xs font-bold text-[var(--md-on-surface)] sm:text-sm">
      {displayValue(value)}
    </td>
  </tr>
);

const SectionHeading = ({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) => (
  <h2 className="m3-section-title mb-4">
    <span className="m3-section-icon"><Icon size={19} /></span>
    {children}
  </h2>
);

const formatDate = (value: unknown) => {
  if (!value) return "-";
  if (value && typeof value === "object" && "_seconds" in value) {
    return new Date((value as { _seconds: number })._seconds * 1000).toLocaleDateString("ja-JP");
  }
  return String(value);
};

function getOrderedRawData(data: StockRecord) {
  const rawKeys = Object.keys(data);
  const orderedData: StockRecord = {};
  const starKeys = rawKeys.filter((key) => key.startsWith("★")).sort();
  starKeys.forEach((key) => orderedData[key] = data[key]);

  const bsPrefixes = ["流動_", "有形_", "無形_", "投資_", "流負_", "固負_", "純資_"];
  const generalKeys = rawKeys.filter((key) =>
    !key.startsWith("★") && !bsPrefixes.some((prefix) => key.startsWith(prefix))
  ).sort();
  generalKeys.forEach((key) => orderedData[key] = data[key]);

  bsPrefixes.forEach((prefix) => {
    rawKeys.filter((key) => key.startsWith(prefix)).sort().forEach((key) => {
      orderedData[key] = data[key];
    });
  });

  return orderedData;
}

export default async function CompanyDetail({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const doc = await db.collection("companies").doc(code).get();

  if (!doc.exists) {
    return (
      <main className="m3-page">
        <div className="mx-auto max-w-xl py-16 text-center">
          <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--md-error-container)] text-[var(--md-error)]">
            <CircleAlert size={27} />
          </span>
          <h1 className="text-2xl font-black">データが見つかりません</h1>
          <Link href="/companies" className="m3-primary-button mt-6">
            <ArrowLeft size={18} />
            全銘柄一覧
          </Link>
        </div>
      </main>
    );
  }

  const data: StockRecord = JSON.parse(JSON.stringify({ id: doc.id, ...doc.data() }));
  const pyoData = calculatePyo(data);
  const anomalies = checkBsAnomaly(data);
  const pyoWarnings = Array.isArray(pyoData["P_與_注意事項"])
    ? pyoData["P_與_注意事項"].filter((item): item is string => typeof item === "string")
    : [];
  const pyoCalculationEligible = pyoData["P_與_計算可能"] === true;
  const pyoReliability = displayValue(pyoData["P_與_信頼区分"]);
  const pyoDisplay = typeof pyoData["P_與"] === "number" ? `${pyoData["P_與"]} 倍` : "算出保留";

  const calcSimPrice = (targetPyo: number) => {
    if (!pyoCalculationEligible) return "-";
    const currentPrice = typeof data["株価"] === "number" ? data["株価"] : 0;
    const marketCap = typeof data["時価総額_億"] === "number" ? data["時価総額_億"] : 0;
    const realNetAsset = typeof pyoData["実質純資産"] === "number" ? pyoData["実質純資産"] : 0;
    if (currentPrice > 0 && marketCap > 0 && realNetAsset > 0) {
      return Math.floor(currentPrice * ((targetPyo * realNetAsset) / marketCap));
    }
    return "-";
  };

  const orderedRawData = getOrderedRawData(data);

  return (
    <main className="m3-page">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/companies"
          className="mb-6 inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-sm font-bold text-[var(--md-primary)] hover:bg-[var(--md-secondary-container)]"
        >
          <ArrowLeft size={18} />
          全銘柄一覧
        </Link>

        <header className="mb-7 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="mb-3 inline-flex rounded-full bg-[var(--md-primary-container)] px-3 py-1 text-xs font-extrabold text-[var(--md-on-primary-container)]">
              {code}
            </span>
            <h1 className="text-3xl font-black text-[var(--md-on-surface)] md:text-4xl">
              {displayValue(data["★企業名"])}
            </h1>
            <p className="mt-2 text-sm text-[var(--md-on-surface-variant)]">
              {displayValue(data["★業種"])} ・ {displayValue(data["★市場区分"])}
            </p>
          </div>
          <p className="text-xs font-semibold text-[var(--md-on-surface-variant)]">
            データ更新 {formatDate(data["データ最終更新日"])}
          </p>
        </header>

        <section className={`mb-7 rounded-lg border-l-[6px] p-5 ${pyoCalculationEligible ? "border-[var(--md-primary)] bg-[var(--md-secondary-container)] text-[var(--md-on-secondary-container)]" : "border-[var(--md-tertiary)] bg-[var(--md-tertiary-container)] text-[var(--md-on-tertiary-container)]"}`}>
          <div className="flex flex-wrap items-start gap-3">
            {pyoCalculationEligible ? <ShieldCheck size={24} /> : <CircleAlert size={24} />}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-extrabold">B/S分析品質: {pyoReliability}</p>
                <p className="text-xs font-semibold">
                  {displayValue(pyoData["P_與_計算方式"])} ・ {displayValue(data["B/S_検証状態"])}
                </p>
              </div>
              <p className="mt-2 text-xs">最終正常B/S更新: {formatDate(data["B/S_正常更新日時"])}</p>
              <p className="mt-1 break-words text-xs">正常採用書類: {displayValue(data["B/S_正常更新書類"])}</p>
              {pyoWarnings.length > 0 && (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-xs">
                  {pyoWarnings.map((warning, index) => <li key={index}>{warning}</li>)}
                </ul>
              )}
              {anomalies.length > 0 && (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-xs font-semibold">
                  {anomalies.map((message, index) => <li key={index}>{message}</li>)}
                </ul>
              )}
            </div>
          </div>
        </section>

        <section className="mb-8">
          <SectionHeading icon={TrendingUp}>企業価値サマリー</SectionHeading>
          <div className="grid gap-3 md:grid-cols-3">
            <article className="m3-surface border-t-4 border-t-[var(--md-primary)] p-5">
              <p className="m3-label">P/與（実質PBR）</p>
              <p className={`mt-2 text-3xl font-black ${pyoCalculationEligible ? "text-[var(--md-primary)]" : "text-[var(--md-tertiary)]"}`}>{pyoDisplay}</p>
              <p className="mt-2 text-xs text-[var(--md-on-surface-variant)]">{pyoCalculationEligible ? "検証済みデータ" : "B/S品質の確認が必要"}</p>
            </article>
            <article className="m3-surface p-5">
              <p className="m3-label">実質純資産</p>
              <p className="mt-2 text-2xl font-black">{displayValue(pyoData["実質純資産"])} <span className="text-sm font-bold">億円</span></p>
              <p className="mt-2 text-xs text-[var(--md-on-surface-variant)]">換金価値ベース</p>
            </article>
            <article className="m3-surface p-5">
              <p className="m3-label">時価総額</p>
              <p className="mt-2 text-2xl font-black">{displayValue(data["時価総額_億"], "0")} <span className="text-sm font-bold">億円</span></p>
              <p className="mt-2 text-xs text-[var(--md-on-surface-variant)]">現在の市場評価</p>
            </article>
          </div>
        </section>

        <section className="m3-tonal-section mb-8 p-5 md:p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="m3-section-icon bg-[var(--md-primary)] text-[var(--md-on-primary)]"><Calculator size={19} /></span>
            <div>
              <h2 className="font-extrabold">P/與 水準別の参考株価</h2>
              <p className="mt-1 text-xs opacity-75">現在の実質純資産から逆算</p>
            </div>
          </div>
          <div className="grid divide-y divide-[var(--md-outline-variant)] md:grid-cols-3 md:divide-x md:divide-y-0">
            {[
              { label: "P/與 0.7倍", value: calcSimPrice(0.7) },
              { label: "P/與 0.5倍", value: calcSimPrice(0.5) },
              { label: "P/與 0.3倍", value: calcSimPrice(0.3) },
            ].map((item) => (
              <div key={item.label} className="px-2 py-4 md:px-5 md:py-2">
                <p className="text-xs font-bold opacity-70">{item.label}</p>
                <p className="mt-1 text-xl font-black">{item.value} <span className="text-xs">円</span></p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <SectionHeading icon={BarChart3}>貸借対照表</SectionHeading>
          <div className="m3-surface p-3 md:p-6">
            <BsChart data={data} />
          </div>
        </section>

        <section className="mb-8">
          <SectionHeading icon={Calculator}>P/與 計算プロセス</SectionHeading>
          <div className="m3-surface overflow-hidden">
            <table className="w-full text-left">
              <tbody>
                <InfoRow label="B/S資産額（倍率計算後）" value={`${pyoData["倍率計算のみのBS"]} 億円`} />
                <InfoRow label="有価証券 含み益の税金控除" value={`▲ ${pyoData["有価証券_税金控除額"]} 億円`} />
                <InfoRow label="調整済 B/S資産" value={`${pyoData["調整済み資産額_BS"]} 億円`} />
                <InfoRow label="調整済 不動産" value={`${pyoData["調整済み不動産額"]} 億円`} />
                <InfoRow label="実質純資産" value={`${pyoData["実質純資産"]} 億円`} />
                <InfoRow label="お買い得度" value={pyoData["お買い得度"]} />
                <InfoRow label="大分類の資産合計" value={`${pyoData["B_S分類資産合計"]} 億円`} />
                <InfoRow label="総資産との差額" value={`${pyoData["B_S資産合計差額"]} 億円`} />
                <InfoRow label="計算方式" value={pyoData["P_與_計算方式"]} />
                <tr className="bg-[var(--md-primary-container)]">
                  <th className="w-1/2 px-3 py-3 text-left text-sm font-black">最終 P/與</th>
                  <td className="px-3 py-3 text-right text-lg font-black text-[var(--md-primary)]">{pyoDisplay}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-8 grid gap-5 lg:grid-cols-2">
          <article className="m3-surface overflow-hidden">
            <h2 className="flex items-center gap-2 border-b border-[var(--md-outline-variant)] px-4 py-4 font-extrabold">
              <Landmark size={19} className="text-[var(--md-primary)]" />
              株価・資産指標
            </h2>
            <table className="w-full"><tbody>
              <InfoRow label="表面PBR（倍）" value={data["PBR"] || "-"} />
              <InfoRow label="PER（倍）" value={data["PER"] || "-"} />
              <InfoRow label="4年平均PER（倍）" value={data["4年平均PER_赤字除"] || "-"} />
              <InfoRow label="現在株価（円）" value={data["株価"] || "-"} />
              <InfoRow label="時価総額（億）" value={data["時価総額_億"] || "-"} />
              <InfoRow label="不動産含み益（億）" value={data["不動産_含み益_億"] || 0} />
              <InfoRow label="有価証券含み益（億）" value={data["有価証券_含み益_億"] || 0} />
              <InfoRow label="純資産（億）" value={data["純資産_億"] || "-"} />
              <InfoRow label="EPS（円）" value={data["EPS"] || "-"} />
              <InfoRow label="ROE（%）" value={data["ROE_pct"] || "-"} />
            </tbody></table>
          </article>

          <article className="m3-surface overflow-hidden">
            <h2 className="flex items-center gap-2 border-b border-[var(--md-outline-variant)] px-4 py-4 font-extrabold">
              <Building2 size={19} className="text-[var(--md-tertiary)]" />
              還元・業績指標
            </h2>
            <table className="w-full"><tbody>
              <InfoRow label="配当利回り（%）" value={data["配当利回り_pct"] || "-"} />
              <InfoRow label="配当性向（%）" value={data["配当性向_pct"] || "-"} />
              <InfoRow label="4年自社株買い利回り（%）" value={data["4年自社株買い利回り_pct"] || "-"} />
              <InfoRow label="4年平均還元利回り（%）" value={data["4年平均還元利回り_pct"] || "-"} />
              <InfoRow label="4年平均自社株買い（億）" value={data["4年平均自社株買い_億"] || "-"} />
              <InfoRow label="4年平均総還元額（億）" value={data["4年平均総還元額_億"] || "-"} />
              <InfoRow label="4年自社株買い比率（%）" value={data["4年自社株買い比率_pct"] || "-"} />
              <InfoRow label="10年増配率（%）" value={data["10年増配率_pct"] || "-"} />
              <InfoRow label="10年減配率（%）" value={data["10年減配率_pct"] || "-"} />
              <InfoRow label="4年赤字率（%）" value={data["4年赤字率_pct"] || 0} />
            </tbody></table>
          </article>
        </section>

        <details className="m3-surface group cursor-pointer overflow-hidden">
          <summary className="flex min-h-14 list-none items-center gap-3 px-4 font-bold text-[var(--md-on-surface-variant)]">
            <Database size={18} />
            すべての生データ
          </summary>
          <pre className="max-h-[32rem] overflow-auto border-t border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] p-4 text-xs text-[var(--md-on-surface-variant)]">
            {JSON.stringify(orderedRawData, null, 2)}
          </pre>
        </details>
      </div>
    </main>
  );
}
