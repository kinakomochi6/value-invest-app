import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import { FieldPath } from "firebase-admin/firestore";
import { db } from "@/lib/firebaseAdmin";
import { buildStockListItem } from "@/lib/stockList";

const CACHE_TTL_SECONDS = 6 * 60 * 60;
const STALE_TTL_SECONDS = 24 * 60 * 60;
const CODE_PREFIXES = Array.from({ length: 10 }, (_, index) => String(index));
const LISTED_STOCK_CODE_PATTERN = /^[0-9][0-9A-Z]{3}$/;

const getCachedStockBucket = unstable_cache(
  async (prefix: string) => {
    const nextPrefix = prefix === "9" ? ":" : String(Number(prefix) + 1);
    const snapshot = await db
      .collection("companies")
      .orderBy(FieldPath.documentId())
      .startAt(prefix)
      .endBefore(nextPrefix)
      .get();

    return snapshot.docs
      .filter(
        (doc) => doc.id !== "0000" && LISTED_STOCK_CODE_PATTERN.test(doc.id)
      )
      .map((doc) => buildStockListItem(doc.id, doc.data()));
  },
  ["stock-list-bucket-v3"],
  {
    revalidate: CACHE_TTL_SECONDS,
    tags: ["stock-list"],
  }
);

export async function GET() {
  try {
    const buckets = await Promise.all(CODE_PREFIXES.map(getCachedStockBucket));
    const companies = buckets.flat();

    return NextResponse.json(companies, {
      headers: {
        "Cache-Control": "public, max-age=300",
        "Vercel-CDN-Cache-Control": `public, s-maxage=${CACHE_TTL_SECONDS}, stale-while-revalidate=${STALE_TTL_SECONDS}, stale-if-error=${STALE_TTL_SECONDS}`,
        "X-Stock-Cache-TTL": String(CACHE_TTL_SECONDS),
      },
    });
  } catch (error) {
    console.error("Firestore 取得エラー:", error);
    return NextResponse.json(
      { error: "データ取得に失敗しました", detail: String(error) },
      { status: 500 }
    );
  }
}
