import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "企業バリュー検索アプリ",
  description: "日本株の貸借対照表と企業価値を確認する分析ツール",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        <div className="flex min-h-screen bg-[var(--md-surface)]">
          <Sidebar />
          <div className="w-full min-w-0 flex-1 md:pl-64">
            <div className="pt-16 md:pt-0">
              {children}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
