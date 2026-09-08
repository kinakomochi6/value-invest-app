import { calculatePyo } from "@/lib/valueLogic";
import type { StockRecord } from "@/lib/types";

export const STOCK_LIST_FIELDS = [
  "★企業名",
  "PBR",
  "PER",
  "配当利回り_pct",
  "ROE_pct",
  "時価総額_億",
  "有価証券_含み益_億",
  "不動産_含み益_億",
  "株価",
  "EPS",
  "4年平均PER_赤字除",
  "配当性向_pct",
  "4年平均還元利回り_pct",
  "4年自社株買い利回り_pct",
  "4年自社株買い比率_pct",
  "10年増配率_pct",
  "10年減配率_pct",
  "4年赤字率_pct",
  "純資産_億",
  "★市場区分",
  "★業種",
] as const;

export function buildStockListItem(
  code: string,
  raw: Record<string, unknown>
): StockRecord {
  const data: StockRecord = { ...raw, id: code };
  const item: StockRecord = { code };

  for (const field of STOCK_LIST_FIELDS) {
    if (field in data) {
      item[field] = data[field];
    }
  }

  try {
    const pyoData = calculatePyo(data);

    Object.assign(item, {
      pyo: pyoData["P_與"],
      bsReliability: pyoData["P_與_信頼区分"],
    });
  } catch {
    // One malformed company must not prevent the full market list from loading.
  }

  return item;
}
