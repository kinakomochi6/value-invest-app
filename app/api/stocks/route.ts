import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { calculatePyo, calculateValueScore, calculateTargetPrice } from "@/lib/valueLogic";

export async function GET(request: NextRequest) {
  try {
    // ?limit=10 のようなクエリパラメーターでテスト時の件数を制限できる
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 0; // 0 = 全件

    let query: FirebaseFirestore.Query = db.collection("companies");
    if (limit > 0) {
      query = query.limit(limit);
    }

    const snapshot = await query.get();

    const companies = snapshot.docs.map((doc) => {
      // FirestoreのTimestamp等の特殊型をJSON安全な形に変換
      const raw = JSON.parse(JSON.stringify(doc.data()));
      const data = { ...raw, id: doc.id };

      try {
        const pyoData = calculatePyo(data);
        const { score } = calculateValueScore(data, pyoData);
        const { status, targetPrice, dropRate } = calculateTargetPrice(data, score, pyoData);
        return {
          code: doc.id,
          ...data,
          pyo: pyoData["P_與"],
          score,
          status,
          targetPrice,
          dropRate,
        };
      } catch (e) {
        // 計算エラーが起きても他銘柄への影響なく返す
        return { code: doc.id, ...data };
      }
    });

    return NextResponse.json(companies);
  } catch (error) {
    console.error("Firestore 取得エラー:", error);
    return NextResponse.json(
      { error: "データ取得に失敗しました", detail: String(error) },
      { status: 500 }
    );
  }
}
