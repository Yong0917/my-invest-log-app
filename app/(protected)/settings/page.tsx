"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Laptop, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const THEME_OPTIONS = [
  { value: "light",  label: "라이트", icon: Sun  },
  { value: "dark",   label: "다크",   icon: Moon },
  { value: "system", label: "시스템", icon: Laptop },
] as const;

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push("/auth/login");
  }

  return (
    <div className="flex flex-col gap-6 max-w-md animate-fade-in-up">
      {/* Page header */}
      <div className="flex flex-col gap-0.5">
        <h1 className="font-display font-bold text-[22px] tracking-tight text-foreground">
          설정
        </h1>
        <p className="text-sm text-muted-foreground">앱 환경을 설정하세요</p>
      </div>

      {/* Theme section */}
      <div className="flex flex-col gap-2">
        <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.12em] text-muted-foreground px-0.5">
          화면 테마
        </p>
        <div className="bg-card border border-border rounded-xl p-1.5 flex gap-1.5">
          {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
            const isActive = mounted && theme === value;
            return (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={`flex flex-1 flex-col items-center justify-center gap-2 rounded-lg py-4 text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <Icon className="size-4.5" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Account section */}
      <div className="flex flex-col gap-2">
        <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.12em] text-muted-foreground px-0.5">
          계정
        </p>
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium
                           text-destructive hover:bg-destructive/8 transition-colors"
              >
                <LogOut className="size-4 shrink-0" />
                로그아웃
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="font-display">로그아웃</AlertDialogTitle>
                <AlertDialogDescription>
                  정말 로그아웃 하시겠습니까?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={handleLogout}
                >
                  로그아웃
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* App info */}
      <div className="flex flex-col gap-2">
        <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.12em] text-muted-foreground px-0.5">
          앱 정보
        </p>
        <div className="bg-card border border-border rounded-xl divide-y divide-border">
          {[
            { label: "앱 이름",   value: "핀로그" },
            { label: "버전",      value: "1.0.0" },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between px-4 py-3.5">
              <span className="text-sm text-muted-foreground">{label}</span>
              <span className="text-sm font-mono font-medium text-foreground">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
