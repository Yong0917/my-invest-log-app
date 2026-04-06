import { SignUpForm } from "@/components/sign-up-form";
import { TrendingUp } from "lucide-react";

export default function SignUpPage() {
  return (
    <div className="min-h-svh flex bg-background">
      {/* ── Left brand panel (desktop only) ─────────────────── */}
      <aside className="hidden lg:flex lg:w-[46%] xl:w-[42%] flex-col relative overflow-hidden bg-card border-r border-border">
        <div className="absolute inset-0 dot-grid" />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 30% 30%, hsl(168 100% 42% / 0.12), transparent 70%)",
          }}
        />

        <div className="relative z-10 flex flex-col h-full px-12 py-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-foreground">
              핀로그
            </span>
          </div>

          <div className="flex-1 flex flex-col justify-center gap-8">
            <div className="space-y-4">
              <h1 className="font-display font-extrabold text-4xl xl:text-5xl text-foreground leading-[1.1] tracking-tight">
                지금 시작하세요
              </h1>
              <p className="text-muted-foreground text-base xl:text-lg leading-relaxed max-w-xs">
                무료로 포트폴리오를 등록하고
                <br />수익률을 실시간으로 추적하세요
              </p>
            </div>

            <div className="space-y-4">
              {[
                { step: "01", text: "이메일로 빠른 가입" },
                { step: "02", text: "보유 종목 등록" },
                { step: "03", text: "수익률 실시간 확인" },
              ].map(({ step, text }) => (
                <div key={step} className="flex items-center gap-4">
                  <span className="w-8 h-8 rounded-full bg-primary/10 border border-primary/25 flex items-center justify-center text-[11px] font-mono font-semibold text-primary flex-shrink-0">
                    {step}
                  </span>
                  <span className="text-sm text-muted-foreground">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground/50">
            © 2025 핀로그 — Personal Investment Tracker
          </p>
        </div>
      </aside>

      {/* ── Right form panel ────────────────────────────────── */}
      <main className="flex-1 flex items-center justify-center px-6 py-10 lg:px-16">
        <div className="w-full max-w-[360px] animate-fade-in-up">
          <SignUpForm />
        </div>
      </main>
    </div>
  );
}
