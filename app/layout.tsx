import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "企業バリュー検索アプリ",
  description: "Next.js + Firebaseで構築する爆速バリュー投資ツール",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        {/* ★全体を flex で囲み、Sidebar(固定幅) と コンテンツ(残り全部) に分けます */}
        <div className="flex min-h-screen">
          
          <Sidebar />
          
          {/* PCでは sidebar(w-64 = 16rem) の幅だけ左に余白を空ける 
            スマホでは上部バー(pt-16)を考慮しつつ、幅いっぱいに使う
          */}
          <div className="flex-1 md:pl-64 w-full">
            <div className="pt-16 md:pt-0">
              {children}
            </div>
          </div>
          
        </div>
      </body>
    </html>
  );
}