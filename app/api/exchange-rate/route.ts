import { NextResponse } from "next/server";

/**
 * 실시간 USD/KRW 환율 조회 API
 * Yahoo Finance에서 KRW=X 티커로 환율 조회
 */
export async function GET() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const url = "https://query1.finance.yahoo.com/v8/finance/chart/KRW=X?interval=1d";
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json({ error: "환율 조회 실패" }, { status: 404 });
    }

    const json = await res.json();
    const result = json?.chart?.result?.[0];

    if (!result) {
      return NextResponse.json({ error: "환율 조회 실패" }, { status: 404 });
    }

    const meta = result.meta;
    const rate: number = meta?.regularMarketPrice;

    if (rate == null) {
      return NextResponse.json({ error: "환율 조회 실패" }, { status: 404 });
    }

    return NextResponse.json({ rate: Math.round(rate) });
  } catch (err) {
    clearTimeout(timeout);

    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json({ error: "환율 조회 시간 초과" }, { status: 408 });
    }
    return NextResponse.json({ error: "환율 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}
