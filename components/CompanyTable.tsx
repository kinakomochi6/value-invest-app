"use client";

import { useMemo, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule, themeQuartz, CellClickedEvent, ColDef, ICellRendererParams } from "ag-grid-community";
import { useRouter } from "next/navigation";
import type { StockRecord } from "@/lib/types";

ModuleRegistry.registerModules([AllCommunityModule]);

export default function CompanyTable({ rowData }: { rowData: StockRecord[] }) {
  const router = useRouter();

  // コードセルのレンダラー：青いリンク風テキスト（クリックは onCellClicked で処理）
  const CodeCellRenderer = useCallback((params: ICellRendererParams<StockRecord>) => {
    return (
      <span style={{ color: "#2563eb", fontWeight: "bold", cursor: "pointer", textDecoration: "underline" }}>
        {params.value}
      </span>
    );
  }, []);

  // 購入判定セルのレンダラー
  const StatusCellRenderer = useCallback((params: ICellRendererParams<StockRecord>) => {
    const s = params.value;
    if (s === "✅購入水準")
      return <span style={{ background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: "9999px", fontSize: "12px", fontWeight: "bold" }}>{s}</span>;
    if (s === "⏳下落待ち")
      return <span style={{ background: "#fef9c3", color: "#854d0e", padding: "2px 8px", borderRadius: "9999px", fontSize: "12px", fontWeight: "bold" }}>{s}</span>;
    if (s === "❌購入非推奨")
      return <span style={{ background: "#fee2e2", color: "#991b1b", padding: "2px 8px", borderRadius: "9999px", fontSize: "12px", fontWeight: "bold" }}>{s}</span>;
    if (s === "⚠️B/S要確認")
      return <span style={{ background: "#fffbeb", color: "#92400e", padding: "2px 8px", borderRadius: "9999px", fontSize: "12px", fontWeight: "bold" }}>{s}</span>;
    return <span>{s ?? "-"}</span>;
  }, []);

  // スコアセルのレンダラー
  const ScoreCellRenderer = useCallback((params: ICellRendererParams<StockRecord>) => {
    return <span style={{ fontWeight: "bold", color: "#2563eb" }}>{params.value ?? "-"} 点</span>;
  }, []);

  const ReliabilityCellRenderer = useCallback((params: ICellRendererParams<StockRecord>) => {
    const value = String(params.value ?? "-");
    const verified = value === "検証済み";
    return (
      <span style={{ color: verified ? "#166534" : "#92400e", fontWeight: "bold", fontSize: "12px" }}>
        {value}
      </span>
    );
  }, []);

  const colDefs = useMemo<ColDef<StockRecord>[]>(
    () => [
      {
        field: "code",
        headerName: "コード",
        width: 90,
        pinned: "left",
        cellRenderer: CodeCellRenderer,
      },
      { field: "★企業名", headerName: "企業名", width: 180, pinned: "left" },
      {
        field: "status",
        headerName: "購入判定",
        width: 130,
        pinned: "left",
        cellRenderer: StatusCellRenderer,
      },
      {
        field: "bsReliability",
        headerName: "B/S品質",
        width: 110,
        cellRenderer: ReliabilityCellRenderer,
      },
      { field: "pyo", headerName: "P/與", width: 90, type: "numericColumn" },
      {
        field: "score",
        headerName: "バリュースコア",
        width: 130,
        type: "numericColumn",
        cellRenderer: ScoreCellRenderer,
      },
      { field: "targetPrice", headerName: "70点_目安株価(円)", width: 160, type: "numericColumn" },
      { field: "dropRate", headerName: "70点_下落待ち(%)", width: 160, type: "numericColumn" },
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
    ],
    [CodeCellRenderer, StatusCellRenderer, ScoreCellRenderer, ReliabilityCellRenderer]
  );

  const defaultColDef = useMemo(
    () => ({ sortable: true, filter: true, resizable: true }),
    []
  );

  // ★ AG Grid のセルクリックイベントで「コード」列だけナビゲーション
  const onCellClicked = useCallback((event: CellClickedEvent) => {
    if (event.colDef.field === "code" && event.value) {
      router.push(`/company/${event.value}`);
    }
  }, [router]);

  return (
    <div style={{ height: "75vh", width: "100%" }}>
      <AgGridReact
        theme={themeQuartz}
        rowData={rowData}
        columnDefs={colDefs}
        defaultColDef={defaultColDef}
        pagination={true}
        paginationPageSize={100}
        onCellClicked={onCellClicked}
      />
    </div>
  );
}
