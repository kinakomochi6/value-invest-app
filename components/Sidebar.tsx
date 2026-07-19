"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function Sidebar() {
  const [code, setCode] = useState("");
  const [isOpen, setIsOpen] = useState(false); // スマホ用の開閉ステータス
  const router = useRouter();
  const pathname = usePathname();

  // ページを移動したら、スマホのメニューを自動で閉じる
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault(); 
    if (code.length >= 4) {
      router.push(`/company/${code}`);
      setCode(""); 
      setIsOpen(false); // 検索した時もメニューを閉じる
    } else {
      alert("4桁の証券コードを入力してください。");
    }
  };

  return (
    <>
      {/* スマホ専用：画面上部に固定されるヘッダー＆ハンバーガー（三本線）ボタン */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-gray-800 text-white z-40 flex items-center px-4 shadow-md">
        <button 
          onClick={() => setIsOpen(true)}
          className="p-2 mr-4 bg-gray-700 rounded focus:outline-none"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <h1 className="font-bold text-lg">企業バリュー検索</h1>
      </div>

      {/* スマホ専用：メニューを開いている時に、後ろの画面を暗くする黒い膜 */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* サイドバー本体（PCでは常に表示、スマホではスライドして出てくる） */}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-gray-800 text-white p-6 flex flex-col shadow-xl transition-transform duration-300 ease-in-out transform ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
        
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span>🏢</span> バリュー検索
          </h2>
          {/* スマホ専用：閉じる（×）ボタン */}
          <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setIsOpen(false)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="mb-10">
          <p className="text-xs text-gray-400 mb-3 font-bold tracking-wider">メインメニュー</p>
          <nav className="space-y-2">
            <Link 
              href="/" 
              onClick={() => setIsOpen(false)}
              className={`block p-3 rounded-lg transition-colors ${pathname === '/' ? 'bg-blue-600 font-bold' : 'hover:bg-gray-700'}`}
            >
              🔍 銘柄検索
            </Link>
            <Link
              href="/companies"
              onClick={() => setIsOpen(false)}
              className={`block p-3 rounded-lg transition-colors ${pathname === '/companies' ? 'bg-blue-600 font-bold' : 'hover:bg-gray-700'}`}
            >
              📋 全銘柄一覧
            </Link>
          </nav>
        </div>

        <div className="mb-8">
          <p className="text-xs text-gray-400 mb-3 font-bold tracking-wider">🔍 個別銘柄を検索</p>
          <form onSubmit={handleSearch} className="flex flex-col gap-3">
            {/* ★修正：Tailwindのバグを無視するため、直接「白背景・黒文字」を強制指定！ */}
            <input 
              type="text" 
              maxLength={4}
              placeholder="証券コード (例: 1377)" 
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={{ backgroundColor: '#ffffff', color: '#000000' }}
              className="p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            />
            <button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-lg font-bold transition-colors shadow-lg"
            >
              検索する
            </button>
          </form>
        </div>

        <div className="mt-auto pt-8 border-t border-gray-700">
          <p className="text-xs text-gray-400 leading-relaxed">
            データソース:<br/>
            JPX / Yahoo Finance / EDINET
          </p>
        </div>
      </aside>
    </>
  );
}
