import { NextRequest, NextResponse } from "next/server";

export type StockHistoryPoint = {
  date: string; // "YYYY-MM-DD"
  close: number;
};

const RANGE_MAP: Record<string, { range: string; interval: string }> = {
  "1d":  { range: "1mo", interval: "1d" },
  "5d":  { range: "5d",  interval: "1d" },
  "1mo": { range: "1mo", interval: "1d" },
  "3mo": { range: "3mo", interval: "1d" },
  "6mo": { range: "6mo", interval: "1d" },
  "1y":  { range: "1y",  interval: "1wk" },
};

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker");
  const range = request.nextUrl.searchParams.get("range") ?? "1mo";

  if (!ticker) {
    return NextResponse.json({ error: "ticker 파라미터가 필요합니다." }, { status: 400 });
  }

  const config = RANGE_MAP[range] ?? RANGE_MAP["1mo"];
  const isKorean = ticker.endsWith(".KS") || ticker.endsWith(".KQ");
  const locale = isKorean ? "&region=KR&lang=ko-KR" : "";
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${config.interval}&range=${config.range}${locale}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json({ error: "데이터를 가져올 수 없습니다." }, { status: 404 });
    }

    const json = await res.json();
    const result = json?.chart?.result?.[0];

    if (!result) {
      return NextResponse.json({ error: "데이터를 가져올 수 없습니다." }, { status: 404 });
    }

    const timestamps: number[] = result.timestamp ?? [];
    const closes: (number | null)[] = result.indicators?.quote?.[0]?.close ?? [];

    const data: StockHistoryPoint[] = timestamps
      .map((ts, i) => {
        const close = closes[i];
        if (close == null) return null;
        const date = new Date(ts * 1000).toISOString().slice(0, 10);
        return { date, close: Math.round(close * 100) / 100 };
      })
      .filter((d): d is StockHistoryPoint => d !== null);

    return NextResponse.json({ data });
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json({ error: "시간 초과" }, { status: 408 });
    }
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
