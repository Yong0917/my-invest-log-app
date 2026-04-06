"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Mobile-only brand header */}
      <div className="flex flex-col gap-5 lg:hidden">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">핀로그</span>
        </div>
      </div>

      {/* Heading */}
      <div className="space-y-1.5">
        <h2 className="font-display font-bold text-2xl tracking-tight text-foreground">
          다시 오셨군요
        </h2>
        <p className="text-sm text-muted-foreground">계정에 로그인하세요</p>
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} className="flex flex-col gap-5">
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

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              비밀번호
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              비밀번호 찾기
            </Link>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
          {isLoading ? "로그인 중…" : "로그인"}
        </button>
      </form>

      {/* Footer links */}
      <p className="text-center text-sm text-muted-foreground">
        계정이 없으신가요?{" "}
        <Link
          href="/auth/sign-up"
          className="text-primary font-medium hover:underline underline-offset-4 transition-colors"
        >
          회원가입
        </Link>
      </p>
    </div>
  );
}
