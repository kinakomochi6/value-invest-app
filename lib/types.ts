export type StockRecord = Record<string, unknown> & {
  id?: string;
  code?: string;
  score?: number;
  status?: string;
  targetPrice?: number | null;
  dropRate?: number | null;
  pyo?: number | "-";
};

