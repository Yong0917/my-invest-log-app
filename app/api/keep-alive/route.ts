import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Vercel Cron이 5일마다 호출 — Supabase 무료 플랜 비활성 중지 방지
export async function GET(request: Request) {
  // Vercel Cron 요청 검증 (CRON_SECRET 환경변수로 보호)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    // 가장 가벼운 쿼리로 DB 활성 상태 유지
    const { error } = await supabase.from("portfolios").select("id").limit(1);

    if (error) throw error;

    console.log(`[keep-alive] Supabase ping 성공: ${new Date().toISOString()}`);
    return NextResponse.json({ ok: true, pingedAt: new Date().toISOString() });
  } catch (error) {
    console.error("[keep-alive] Supabase ping 실패:", error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
