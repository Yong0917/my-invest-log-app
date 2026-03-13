import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker");

  if (!ticker) {
    return NextResponse.json({ error: "ticker 파라미터가 필요합니다." }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const isKorean = ticker.endsWith(".KS") || ticker.endsWith(".KQ");
    const locale = isKorean ? "&region=KR&lang=ko-KR" : "";
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d${locale}`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json({ error: "종목을 찾을 수 없습니다." }, { status: 404 });
    }

    const json = await res.json();
    const result = json?.chart?.result?.[0];

    if (!result) {
      return NextResponse.json({ error: "종목을 찾을 수 없습니다." }, { status: 404 });
    }

    const meta = result.meta;
    const price: number = meta?.regularMarketPrice;

    if (price == null) {
      return NextResponse.json({ error: "종목을 찾을 수 없습니다." }, { status: 404 });
    }

    // 전일 종가: chartPreviousClose → previousClose 순으로 폴백
    const prevClose: number | undefined =
      meta?.chartPreviousClose ?? meta?.previousClose;

    // 전일대비 변동률 직접 계산 (API 필드가 없는 경우 대비)
    const changePercent: number | null =
      prevClose != null && prevClose !== 0
        ? ((price - prevClose) / prevClose) * 100
        : (meta?.regularMarketChangePercent ?? null);

    return NextResponse.json({
      ticker,
      price,
      changePercent,
      prevClose: prevClose ?? null,
      // 한국 주식은 longName에 한글명이 담겨 있음
      name: meta?.longName ?? meta?.shortName ?? ticker,
      currency: meta?.currency ?? "USD",
      timestamp: meta?.regularMarketTime ?? Math.floor(Date.now() / 1000),
    });
  } catch (err) {
    clearTimeout(timeout);

    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json({ error: "시세 조회 시간 초과" }, { status: 408 });
    }
    return NextResponse.json({ error: "시세 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}
