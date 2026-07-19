"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function Home() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedCode = code.trim();

    if (!/^\d{4}$/.test(normalizedCode)) {
      setError("4桁の証券コードを入力してください。");
      return;
    }

    setError(null);
    router.push(`/company/${normalizedCode}`);
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6">
            <p className="mb-2 text-sm font-bold text-blue-700">企業バリュー検索</p>
            <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">
              証券コードから銘柄を分析
            </h1>
            <p className="mt-3 max-w-2xl text-gray-600">
              個別銘柄のP/與、バリュースコア、B/S、購入判定を確認できます。
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
            <div className="min-w-0 flex-1">
              <label htmlFor="stock-code" className="mb-2 block text-sm font-bold text-gray-700">
                証券コード
              </label>
              <input
                id="stock-code"
                type="text"
                inputMode="numeric"
                maxLength={4}
                placeholder="例: 7203"
                value={code}
                onChange={(event) => {
                  setCode(event.target.value.replace(/\D/g, ""));
                  setError(null);
                }}
                className="h-12 w-full rounded border border-gray-300 bg-white px-4 text-lg text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              {error && <p className="mt-2 text-sm font-bold text-red-600">{error}</p>}
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="h-12 w-full rounded bg-blue-600 px-6 font-bold text-white transition-colors hover:bg-blue-500 sm:w-auto"
              >
                分析する
              </button>
            </div>
          </form>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <Link
            href="/companies"
            className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50"
          >
            <p className="text-sm font-bold text-blue-700">一覧から探す</p>
            <h2 className="mt-2 text-xl font-bold text-gray-900">全銘柄一覧へ</h2>
            <p className="mt-2 text-sm text-gray-600">
              スコア、PBR、配当利回りなどで並び替えながら銘柄を確認できます。
            </p>
          </Link>

          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-gray-500">確認できる項目</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-700">
              <span className="rounded bg-gray-100 px-3 py-2">P/與</span>
              <span className="rounded bg-gray-100 px-3 py-2">バリュースコア</span>
              <span className="rounded bg-gray-100 px-3 py-2">B/Sグラフ</span>
              <span className="rounded bg-gray-100 px-3 py-2">購入判定</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

