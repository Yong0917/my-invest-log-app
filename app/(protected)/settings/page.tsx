"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Laptop, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const THEME_OPTIONS = [
  { value: "light", label: "라이트", icon: Sun },
  { value: "dark", label: "다크", icon: Moon },
  { value: "system", label: "시스템", icon: Laptop },
] as const;

/**
 * 설정 페이지
 * - 테마(라이트/다크/시스템) 선택
 * - 로그아웃
 */
export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // 클라이언트 마운트 후 테마 표시
  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-8 max-w-md">
      {/* 페이지 헤더 */}
      <div className="flex flex-col gap-1">
        <h1 className="text-[22px] font-bold tracking-tight">설정</h1>
        <p className="text-sm text-muted-foreground">앱 환경을 설정하세요</p>
      </div>

      {/* 테마 설정 */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          화면 테마
        </p>
        <Card>
          <CardContent className="p-2 flex gap-2">
            {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
              const isActive = mounted && theme === value;
              return (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={`flex flex-1 flex-col items-center justify-center gap-2 rounded-xl py-4 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="size-5" />
                  <span>{label}</span>
                </button>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* 계정 */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          계정
        </p>
        <Card>
          <CardContent className="p-2">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
              onClick={handleLogout}
            >
              <LogOut className="size-4" />
              로그아웃
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
