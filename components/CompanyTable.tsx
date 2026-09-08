"use client";

import { useMemo, useCallback, useEffect, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule, themeQuartz, CellClickedEvent, ColDef, ICellRendererParams } from "ag-grid-community";
import { useRouter } from "next/navigation";
import type { StockRecord } from "@/lib/types";

ModuleRegistry.registerModules([AllCommunityModule]);

const materialExpressiveGridTheme = themeQuartz.withParams({
  accentColor: "#005ac1",
  backgroundColor: "#ffffff",
  borderColor: "#c4c6d0",
  foregroundColor: "#1a1b20",
  headerBackgroundColor: "#e5edff",
  headerTextColor: "#283141",
  oddRowBackgroundColor: "#f8f9ff",
  rowHoverColor: "#e5eeff",
  selectedRowBackgroundColor: "#d8e2ff",
  fontFamily: "Noto Sans JP, Yu Gothic UI, sans-serif",
  fontSize: 11,
  headerFontWeight: 700,
  wrapperBorderRadius: 0,
});

export default function CompanyTable({ rowData }: { rowData: StockRecord[] }) {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 640px)");
    const updateViewport = () => setIsMobile(mediaQuery.matches);
    updateViewport();
    mediaQuery.addEventListener("change", updateViewport);
    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, []);

  // コードセルのレンダラー：青いリンク風テキスト（クリックは onCellClicked で処理）
  const CodeCellRenderer = useCallback((params: ICellRendererParams<StockRecord>) => {
    return (
      <span className="cursor-pointer font-extrabold text-[var(--md-primary)] underline decoration-[#8aabff] underline-offset-2">
        {params.value}
      </span>
    );
  }, []);

  const CompanyCellRenderer = useCallback((params: ICellRendererParams<StockRecord>) => {
    return (
      <span className="cursor-pointer font-semibold text-[var(--md-primary)] underline decoration-[#8aabff] underline-offset-2">
        {String(params.value ?? "-")}
      </span>
    );
  }, []);

  const ReliabilityCellRenderer = useCallback((params: ICellRendererParams<StockRecord>) => {
    const value = String(params.value ?? "-");
    const verified = value === "検証済み";
    return (
      <span className={`rounded-full px-2 py-1 text-[10px] font-extrabold ${verified ? "bg-[var(--md-secondary-container)] text-[var(--md-on-secondary-container)]" : "bg-[var(--md-tertiary-container)] text-[var(--md-on-tertiary-container)]"}`}>
        {value}
      </span>
    );
  }, []);

  const colDefs = useMemo<ColDef<StockRecord>[]>(
    () => [
      {
        field: "★企業名",
        headerName: "企業名",
        width: isMobile ? 136 : 190,
        pinned: "left",
        lockPinned: true,
        suppressMovable: true,
        tooltipField: "★企業名",
        cellRenderer: CompanyCellRenderer,
      },
      {
        field: "code",
        headerName: "コード",
        width: isMobile ? 78 : 90,
        suppressMovable: true,
        cellRenderer: CodeCellRenderer,
      },
      {
        colId: "pyo",
        field: "pyo",
        headerName: "P/與",
        width: 82,
        type: "numericColumn",
        cellDataType: "number",
        valueGetter: ({ data }) => typeof data?.pyo === "number" ? data.pyo : null,
        valueFormatter: ({ value }) => typeof value === "number" ? String(value) : "-",
      },
      { field: "PBR", headerName: "PBR(倍)", width: 90, type: "numericColumn" },
      { field: "PER", headerName: "PER(倍)", width: 90, type: "numericColumn" },
      { field: "配当利回り_pct", headerName: "配当利回り(%)", width: 130, type: "numericColumn" },
      { field: "ROE_pct", headerName: "ROE(%)", width: 90, type: "numericColumn" },
      { field: "時価総額_億", headerName: "時価総額(億)", width: 120, type: "numericColumn" },
      { field: "有価証券_含み益_億", headerName: "有価証券含み益(億)", width: 160, type: "numericColumn" },
      { field: "不動産_含み益_億", headerName: "不動産含み益(億)", width: 150, type: "numericColumn" },
      { field: "株価", headerName: "株価(円)", width: 100, type: "numericColumn" },
      { field: "EPS", headerName: "EPS", width: 90, type: "numericColumn" },
      { field: "4年平均PER_赤字除", headerName: "4年平均PER", width: 120, type: "numericColumn" },
      { field: "配当性向_pct", headerName: "配当性向(%)", width: 120, type: "numericColumn" },
      { field: "4年平均還元利回り_pct", headerName: "4年平均還元利回り(%)", width: 180, type: "numericColumn" },
      { field: "4年自社株買い利回り_pct", headerName: "4年自社株買い利回り(%)", width: 190, type: "numericColumn" },
      { field: "4年自社株買い比率_pct", headerName: "4年自社株買い比率(%)", width: 180, type: "numericColumn" },
      { field: "10年増配率_pct", headerName: "10年増配率(%)", width: 130, type: "numericColumn" },
      { field: "10年減配率_pct", headerName: "10年減配率(%)", width: 130, type: "numericColumn" },
      { field: "4年赤字率_pct", headerName: "4年赤字率(%)", width: 120, type: "numericColumn" },
      { field: "純資産_億", headerName: "純資産(億)", width: 110, type: "numericColumn" },
      { field: "★市場区分", headerName: "市場", width: 100 },
      { field: "★業種", headerName: "業種", width: 120 },
      {
        field: "bsReliability",
        headerName: "B/S品質",
        width: 110,
        cellRenderer: ReliabilityCellRenderer,
      },
    ],
    [CodeCellRenderer, CompanyCellRenderer, ReliabilityCellRenderer, isMobile]
  );

  const defaultColDef = useMemo(
    () => ({ sortable: true, filter: true, resizable: true }),
    []
  );

  const onCellClicked = useCallback((event: CellClickedEvent) => {
    const field = event.colDef.field;
    const code = event.data?.code;
    if ((field === "code" || field === "★企業名") && code) {
      router.push(`/company/${code}`);
    }
  }, [router]);

  return (
    <div className="stock-grid h-[72dvh] min-h-[28rem] w-full md:h-[75vh]">
      <AgGridReact
        theme={materialExpressiveGridTheme}
        rowData={rowData}
        columnDefs={colDefs}
        defaultColDef={defaultColDef}
        rowHeight={isMobile ? 38 : 42}
        headerHeight={isMobile ? 42 : 46}
        animateRows={false}
        tooltipShowDelay={300}
        onCellClicked={onCellClicked}
      />
    </div>
  );
}
