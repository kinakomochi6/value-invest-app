"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ListFilter, LoaderCircle, RefreshCw } from "lucide-react";
import CompanyTable from "@/components/CompanyTable";
import type { StockRecord } from "@/lib/types";

export default function CompaniesPage() {
  const [rowData, setRowData] = useState<StockRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/stocks");

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          const detail =
            typeof body === "object" && body !== null && "detail" in body
              ? String(body.detail)
              : `HTTP ${res.status}`;
          throw new Error(detail);
        }

        const data: unknown = await res.json();
        if (!Array.isArray(data)) {
          throw new Error("API response is not an array.");
        }

        setRowData(data as StockRecord[]);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        console.error("Failed to fetch stock data:", e);
        setError(`データの取得に失敗しました: ${message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <main className="m3-page !px-2 sm:!px-4 md:!px-6">
      <div className="max-w-full">
        <header className="mb-5 flex flex-wrap items-end justify-between gap-3 px-2 md:px-0">
          <div>
            <p className="mb-1 text-xs font-extrabold text-[var(--md-primary)]">MARKET VIEW</p>
            <h1 className="flex items-center gap-3 text-2xl font-black text-[var(--md-on-surface)] sm:text-3xl">
              <span className="m3-section-icon"><ListFilter size={19} /></span>
              全銘柄一覧
            </h1>
            <p className="mt-2 text-sm text-[var(--md-on-surface-variant)]">
            コードまたは企業名をクリックすると銘柄詳細ページへ移動します。
            </p>
          </div>
          {!loading && !error && rowData.length > 0 && (
            <span className="rounded-full bg-[var(--md-secondary-container)] px-4 py-2 text-sm font-extrabold text-[var(--md-on-secondary-container)]">
              {rowData.length.toLocaleString()} 銘柄
            </span>
          )}
        </header>

        {loading && (
          <div className="flex h-64 flex-col items-center justify-center gap-4 text-[var(--md-on-surface-variant)]">
            <LoaderCircle className="animate-spin text-[var(--md-primary)]" size={36} />
            <span className="text-sm font-bold">全銘柄データを読み込み中</span>
          </div>
        )}

        {error && (
          <div className="mx-2 flex flex-wrap items-center gap-3 rounded-lg bg-[var(--md-error-container)] p-4 text-[var(--md-error)] md:mx-0">
            <AlertTriangle size={21} />
            <strong className="flex-1">{error}</strong>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="m3-primary-button !min-h-10 !bg-[var(--md-error)] !px-4"
            >
              <RefreshCw size={17} />
              再読み込み
            </button>
          </div>
        )}

        {!loading && !error && rowData.length === 0 && (
          <div className="flex h-64 items-center justify-center text-[var(--md-on-surface-variant)]">
            データが0件でした。Firestoreに銘柄データが存在するか確認してください。
          </div>
        )}

        {!loading && !error && rowData.length > 0 && (
          <section className="m3-surface overflow-hidden">
            <CompanyTable rowData={rowData} />
          </section>
        )}
      </div>
    </main>
  );
}
