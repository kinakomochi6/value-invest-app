"use client";

import { useEffect, useState } from "react";
import CompanyTable from "@/components/CompanyTable";

// ★テスト時は true にすると10件だけ取得して動作確認が速くなります
const TEST_MODE = true; // ★テスト完了後に false に戻してください

export default function Home() {
  const [rowData, setRowData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const url = TEST_MODE ? "/api/stocks?limit=10" : "/api/stocks";
        const res = await fetch(url);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.detail || `HTTP ${res.status}`);
        }
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error("レスポンスが配列ではありません");
        setRowData(data);
      } catch (e: any) {
        console.error("データ取得失敗", e);
        setError(`データの取得に失敗しました: ${e.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <main className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-full">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">📋 全銘柄一覧</h1>
          <p className="text-gray-500 mt-2">
            ※コード欄をクリックすると個別銘柄の詳細ページへ移動します
            {TEST_MODE && (
              <span className="ml-2 bg-yellow-200 text-yellow-800 text-xs font-bold px-2 py-1 rounded">
                🧪 テストモード（10件表示）
              </span>
            )}
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center h-64 text-gray-500 text-lg">
            <span className="animate-pulse">📡 データを読み込み中...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            <strong>エラー：</strong> {error}
            <br />
            <a
              href="/"
              onClick={(e) => { e.preventDefault(); window.location.reload(); }}
              className="text-blue-600 underline mt-2 inline-block"
            >
              再読み込みする
            </a>
          </div>
        )}

        {!loading && !error && rowData.length === 0 && (
          <div className="flex items-center justify-center h-64 text-gray-500">
            データが0件でした。Firestoreに銘柄データが存在するか確認してください。
          </div>
        )}

        {!loading && !error && rowData.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-100">
              {rowData.length.toLocaleString()} 件の銘柄が見つかりました
            </div>
            <CompanyTable rowData={rowData} />
          </div>
        )}
      </div>
    </main>
  );
}