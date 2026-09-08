"use client";

import { useEffect, useState } from "react";
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
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-full">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">全銘柄一覧</h1>
          <p className="mt-2 text-gray-500">
            コードをクリックすると銘柄詳細ページへ移動します。
          </p>
        </div>

        {loading && (
          <div className="flex h-64 items-center justify-center text-lg text-gray-500">
            <span className="animate-pulse">データを読み込み中...</span>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            <strong>エラー:</strong> {error}
            <br />
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-2 inline-block text-blue-600 underline"
            >
              再読み込みする
            </button>
          </div>
        )}

        {!loading && !error && rowData.length === 0 && (
          <div className="flex h-64 items-center justify-center text-gray-500">
            データが0件でした。Firestoreに銘柄データが存在するか確認してください。
          </div>
        )}

        {!loading && !error && rowData.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
            <div className="border-b border-gray-100 px-4 py-2 text-sm text-gray-500">
              {rowData.length.toLocaleString()}件の銘柄が見つかりました
            </div>
            <CompanyTable rowData={rowData} />
          </div>
        )}
      </div>
    </main>
  );
}
