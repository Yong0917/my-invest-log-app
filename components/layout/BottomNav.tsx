"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, Settings } from "lucide-react";

/** 하단 탭 정의 */
const TABS = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/portfolio", label: "보유 종목", icon: BookOpen },
  { href: "/settings", label: "설정", icon: Settings },
] as const;

/**
 * 하단 탭바 네비게이션
 * - 모바일/데스크톱 공통으로 하단에 고정
 * - 현재 경로 탭을 활성 상태로 표시
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-50 w-full border-t border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-safe">
      <div className="mx-auto flex h-16 max-w-screen-xl">
        {TABS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div
                className={`flex items-center justify-center rounded-xl px-5 py-1.5 transition-colors ${
                  isActive ? "bg-muted" : ""
                }`}
              >
                <Icon className="size-5" />
              </div>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
