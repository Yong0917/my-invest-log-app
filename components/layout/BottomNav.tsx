"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, Settings } from "lucide-react";

const TABS = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/portfolio", label: "보유 종목",  icon: BookOpen },
  { href: "/settings",  label: "설정",       icon: Settings },
] as const;

/**
 * 하단 탭바 네비게이션
 * Active tab: pill indicator + primary color
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-50 w-full bg-background/92 backdrop-blur-md border-t border-border/60 pb-safe">
      <div className="mx-auto flex h-16 max-w-screen-xl">
        {TABS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");

          return (
            <Link
              key={href}
              href={href}
              className="flex flex-1 flex-col items-center justify-center gap-1 transition-colors"
              aria-current={isActive ? "page" : undefined}
            >
              {/* Icon with active pill background */}
              <div
                className={`flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200 ${
                  isActive
                    ? "bg-primary/15"
                    : "bg-transparent"
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-colors duration-200 ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                />
              </div>

              {/* Label */}
              <span
                className={`text-[10px] font-medium transition-colors duration-200 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
