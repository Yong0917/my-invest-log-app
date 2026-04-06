"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { TrendingUp, ArrowLeft, MailCheck } from "lucide-react";
import { useState } from "react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col gap-8 animate-fade-in-up">
        <div className="flex items-center gap-2.5 lg:hidden">
          <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">핀로그</span>
        </div>

        <div className="flex flex-col items-center gap-5 py-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center">
            <MailCheck className="w-7 h-7 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="font-display font-bold text-2xl tracking-tight text-foreground">
              이메일을 확인해주세요
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
              비밀번호 재설정 링크를 <span className="text-foreground font-medium">{email}</span>
              으로 전송했습니다
            </p>
          </div>
        </div>

        <Link
          href="/auth/login"
          className="flex items-center justify-center gap-2 h-11 w-full rounded-lg border border-border
                     text-sm font-medium text-foreground hover:bg-accent
                     focus:outline-none focus:ring-2 focus:ring-ring/40
                     transition-all duration-150"
        >
          <ArrowLeft className="w-4 h-4" />
          로그인으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Mobile brand header */}
      <div className="flex flex-col gap-5 lg:hidden">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">핀로그</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <h2 className="font-display font-bold text-2xl tracking-tight text-foreground">
          비밀번호 재설정
        </h2>
        <p className="text-sm text-muted-foreground">
          가입한 이메일을 입력하시면 재설정 링크를 보내드립니다
        </p>
      </div>

      <form onSubmit={handleForgotPassword} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            이메일
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            className="h-11 w-full rounded-lg border border-input bg-card px-4 text-sm
                       text-foreground placeholder:text-muted-foreground/60
                       focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring
                       transition-all duration-150"
          />
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="h-11 w-full rounded-lg bg-primary text-primary-foreground font-display
                     font-semibold text-sm tracking-wide
                     hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring/40
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-150 mt-1"
        >
          {isLoading ? "전송 중…" : "재설정 이메일 보내기"}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link
          href="/auth/login"
          className="text-primary font-medium hover:underline underline-offset-4 transition-colors"
        >
          ← 로그인으로 돌아가기
        </Link>
      </p>
    </div>
  );
}
