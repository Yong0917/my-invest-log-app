import { NextRequest, NextResponse } from "next/server";

interface YahooQuote {
  symbol: string;
  shortname?: string;
  longname?: string;
  quoteType?: string;
  exchDisp?: string;
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query || query.trim().length < 1) {
    return NextResponse.json({ error: "검색어를 입력해주세요." }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);

  try {
    const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=8&newsCount=0&listsCount=0&region=KR&lang=ko-KR`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json({ error: "검색 결과를 가져올 수 없습니다." }, { status: 502 });
    }

    const json = await res.json();
    const quotes: YahooQuote[] = json?.quotes ?? [];

    // EQUITY, ETF만 필터링
    const results = quotes
      .filter((q) => q.quoteType === "EQUITY" || q.quoteType === "ETF")
      .map((q) => ({
        ticker: q.symbol,
        // 한국 주식은 longname에 한글명이 담겨 있음
        name: q.longname ?? q.shortname ?? q.symbol,
        exchange: q.exchDisp ?? "",
      }));

    return NextResponse.json({ results });
  } catch (err) {
    clearTimeout(timeout);

    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json({ error: "검색 시간 초과" }, { status: 408 });
    }
    return NextResponse.json({ error: "검색 중 오류가 발생했습니다." }, { status: 500 });
  }
}
