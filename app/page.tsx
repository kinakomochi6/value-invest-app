"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowRight, Building2, ChartNoAxesCombined, ListFilter, Search } from "lucide-react";

const STOCK_CODE_PATTERN = /^[0-9][0-9A-Z]{3}$/;

export default function Home() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedCode = code.trim().toUpperCase();

    if (!STOCK_CODE_PATTERN.test(normalizedCode)) {
      setError("4文字の証券コードを入力してください。");
      return;
    }

    setError(null);
    router.push(`/company/${normalizedCode}`);
  };

  return (
    <main className="m3-page">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex items-start gap-4 pt-2 md:mb-12 md:pt-8">
          <span className="m3-section-icon mt-1 !h-12 !w-12 bg-[var(--md-primary)] text-[var(--md-on-primary)]">
            <Building2 size={25} />
          </span>
          <div>
            <p className="mb-1 text-xs font-extrabold text-[var(--md-primary)]">VALUE LENS</p>
            <h1 className="text-3xl font-black text-[var(--md-on-surface)] md:text-5xl">
              企業バリュー検索
            </h1>
            <p className="mt-2 text-sm text-[var(--md-on-surface-variant)] md:text-base">
              日本株の貸借対照表と企業価値を確認
            </p>
          </div>
        </header>

        <section className="m3-tonal-section mb-5 overflow-hidden p-5 md:p-8">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--md-primary)] text-[var(--md-on-primary)]">
              <Search size={21} />
            </span>
            <div>
              <p className="text-xs font-bold text-[var(--md-secondary)]">STOCK SEARCH</p>
              <h2 className="text-xl font-extrabold md:text-2xl">証券コードから分析</h2>
            </div>
          </div>

          <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label htmlFor="stock-code" className="m3-label mb-2 block">
                証券コード
              </label>
              <input
                id="stock-code"
                type="text"
                inputMode="text"
                autoCapitalize="characters"
                maxLength={4}
                placeholder="7203 / 130A"
                value={code}
                onChange={(event) => {
                  setCode(event.target.value.toUpperCase().replace(/[^0-9A-Z]/g, ""));
                  setError(null);
                }}
                className="m3-input font-bold"
              />
              {error && <p className="mt-2 text-sm font-bold text-[var(--md-error)]">{error}</p>}
            </div>

            <button type="submit" className="m3-primary-button sm:min-w-36">
              <ChartNoAxesCombined size={20} />
              分析する
            </button>
          </form>
        </section>

        <Link
          href="/companies"
          className="group flex min-h-24 items-center gap-4 rounded-lg border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-lowest)] p-5 shadow-[var(--md-shadow)] hover:bg-[var(--md-surface-container-low)] md:p-6"
        >
          <span className="m3-section-icon !h-12 !w-12 bg-[var(--md-tertiary-container)] text-[var(--md-on-tertiary-container)]">
            <ListFilter size={23} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-[var(--md-tertiary)]">MARKET VIEW</p>
            <h2 className="text-lg font-extrabold text-[var(--md-on-surface)] md:text-xl">全銘柄一覧</h2>
            <p className="mt-1 text-sm text-[var(--md-on-surface-variant)]">P/與・財務指標・含み益で比較</p>
          </div>
          <span className="m3-icon-button bg-[var(--md-surface-container)] group-hover:bg-[var(--md-primary-container)] group-hover:text-[var(--md-on-primary-container)]">
            <ArrowRight size={21} />
          </span>
        </Link>
      </div>
    </main>
  );
}
