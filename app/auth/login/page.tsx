import { LoginForm } from "@/components/login-form";
import { TrendingUp } from "lucide-react";

const METRICS = [
  { label: "PORTFOLIO", value: "+18.4%", positive: true },
  { label: "YTD RETURN", value: "₩24.2M", positive: null },
];

const FEATURES = [
  "실시간 주가 및 수익률 자동 조회",
  "USD · KRW 다중 통화 포트폴리오",
  "그룹별 종목 분류 및 내보내기",
];

export default function LoginPage() {
  return (
    <div className="min-h-svh flex bg-background">
      {/* ── Left brand panel (desktop only) ─────────────────── */}
      <aside className="hidden lg:flex lg:w-[46%] xl:w-[42%] flex-col relative overflow-hidden bg-card border-r border-border">
        {/* Dot-grid background */}
        <div className="absolute inset-0 dot-grid" />

        {/* Teal gradient wash */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 30% 30%, hsl(168 100% 42% / 0.12), transparent 70%)",
          }}
        />

        <div className="relative z-10 flex flex-col h-full px-12 py-10">
          {/* Brand logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-foreground">
              핀로그
            </span>
          </div>

          {/* Hero copy */}
          <div className="flex-1 flex flex-col justify-center gap-10">
            <div className="space-y-4">
              <h1 className="font-display font-extrabold text-4xl xl:text-5xl text-foreground leading-[1.1] tracking-tight">
                내 투자를<br />한눈에 보다
              </h1>
              <p className="text-muted-foreground text-base xl:text-lg leading-relaxed max-w-xs">
                포트폴리오를 체계적으로 관리하고
                <br />실시간 수익률을 확인하세요
              </p>
            </div>

            {/* Feature bullets */}
            <ul className="space-y-3">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-primary/15 border border-primary/35 flex items-center justify-center flex-shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  </span>
                  <span className="text-sm text-muted-foreground">{f}</span>
                </li>
              ))}
            </ul>

            {/* Fake metric cards */}
            <div className="grid grid-cols-2 gap-3">
              {METRICS.map((m) => (
                <div
                  key={m.label}
                  className="bg-background/50 border border-border rounded-xl p-4 space-y-1.5"
                >
                  <p className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">
                    {m.label}
                  </p>
                  <p
                    className={`text-2xl font-mono font-semibold ${
                      m.positive === true
                        ? "text-profit"
                        : m.positive === false
                        ? "text-loss"
                        : "text-foreground"
                    }`}
                  >
                    {m.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer caption */}
          <p className="text-xs text-muted-foreground/50">
            © 2025 핀로그 — Personal Investment Tracker
          </p>
        </div>
      </aside>

      {/* ── Right form panel ────────────────────────────────── */}
      <main className="flex-1 flex items-center justify-center px-6 py-10 lg:px-16">
        <div className="w-full max-w-[360px] animate-fade-in-up">
          <LoginForm />
        </div>
      </main>
    </div>
  );
}
