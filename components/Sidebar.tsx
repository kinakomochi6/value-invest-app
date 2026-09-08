"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Database, ListFilter, Menu, Search, X } from "lucide-react";

const STOCK_CODE_PATTERN = /^[0-9][0-9A-Z]{3}$/;

export default function Sidebar() {
  const [code, setCode] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedCode = code.trim().toUpperCase();
    if (!STOCK_CODE_PATTERN.test(normalizedCode)) {
      window.alert("4文字の証券コードを入力してください。");
      return;
    }

    router.push(`/company/${normalizedCode}`);
    setCode("");
    setIsOpen(false);
  };

  const navigation = [
    { href: "/", label: "銘柄検索", icon: Search },
    { href: "/companies", label: "全銘柄一覧", icon: ListFilter },
  ];

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center gap-3 border-b border-[var(--md-outline-variant)] bg-[var(--md-surface-container-lowest)] px-3 md:hidden">
        <button
          type="button"
          aria-label="メニューを開く"
          onClick={() => setIsOpen(true)}
          className="m3-icon-button"
        >
          <Menu size={22} />
        </button>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)]">
          <Building2 size={19} />
        </span>
        <span className="font-extrabold text-[var(--md-on-surface)]">企業バリュー検索</span>
      </header>

      {isOpen && (
        <button
          type="button"
          aria-label="メニューを閉じる"
          className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[2px] md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] px-4 py-5 shadow-[var(--md-shadow-high)] transition-transform duration-300 ease-out md:translate-x-0 md:shadow-none ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="mb-7 flex items-center gap-3 px-2">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--md-primary)] text-[var(--md-on-primary)] shadow-sm">
            <Building2 size={23} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-[var(--md-primary)]">VALUE LENS</p>
            <h2 className="truncate text-base font-extrabold text-[var(--md-on-surface)]">企業バリュー検索</h2>
          </div>
          <button
            type="button"
            aria-label="メニューを閉じる"
            className="m3-icon-button md:hidden"
            onClick={() => setIsOpen(false)}
          >
            <X size={21} />
          </button>
        </div>

        <nav aria-label="メインメニュー" className="space-y-1">
          {navigation.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setIsOpen(false)}
                className={`flex min-h-12 items-center gap-3 rounded-full px-4 text-sm font-bold ${active ? "bg-[var(--md-secondary-container)] text-[var(--md-on-secondary-container)]" : "text-[var(--md-on-surface-variant)] hover:bg-[var(--md-surface-container-high)]"}`}
              >
                <Icon size={20} strokeWidth={active ? 2.6 : 2} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="my-6 h-px bg-[var(--md-outline-variant)]" />

        <form onSubmit={handleSearch} className="space-y-3">
          <label htmlFor="sidebar-stock-code" className="m3-label px-1">
            証券コード
          </label>
          <input
            id="sidebar-stock-code"
            type="text"
            inputMode="text"
            autoCapitalize="characters"
            maxLength={4}
            placeholder="7203 / 130A"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase().replace(/[^0-9A-Z]/g, ""))}
            className="m3-input !min-h-12"
          />
          <button type="submit" className="m3-primary-button w-full !min-h-11">
            <Search size={18} />
            検索
          </button>
        </form>

        <div className="mt-auto border-t border-[var(--md-outline-variant)] px-2 pt-5">
          <div className="mb-2 flex items-center gap-2 text-[var(--md-on-surface-variant)]">
            <Database size={16} />
            <span className="text-xs font-bold">DATA SOURCES</span>
          </div>
          <p className="text-xs leading-5 text-[var(--md-on-surface-variant)]">
            JPX / Yahoo Finance / EDINET
          </p>
        </div>
      </aside>
    </>
  );
}
