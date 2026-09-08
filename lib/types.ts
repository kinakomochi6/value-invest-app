export type StockRecord = Record<string, unknown> & {
  id?: string;
  code?: string;
  pyo?: number | "-";
  bsReliability?: string;
};
