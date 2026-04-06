import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { TrendingUp } from "lucide-react";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-svh flex bg-background">
      {/* Left brand panel (desktop only) */}
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
          <div className="flex-1 flex flex-col justify-center">
            <div className="space-y-4">
              <h1 className="font-display font-extrabold text-4xl text-foreground leading-[1.1] tracking-tight">
                걱정하지 마세요
              </h1>
              <p className="text-muted-foreground text-base leading-relaxed max-w-xs">
                이메일 주소를 입력하시면<br />빠르게 비밀번호를 재설정할 수 있습니다
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground/50">
            © 2025 핀로그 — Personal Investment Tracker
          </p>
        </div>
      </aside>

      {/* Right form panel */}
      <main className="flex-1 flex items-center justify-center px-6 py-10 lg:px-16">
        <div className="w-full max-w-[360px] animate-fade-in-up">
          <ForgotPasswordForm />
        </div>
      </main>
    </div>
  );
}
