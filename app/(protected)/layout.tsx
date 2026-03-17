import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Toaster } from "sonner";

/**
 * 인증된 사용자용 레이아웃
 * Header(상단) + 하단 탭바 포함
 */
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      {/* 공통 헤더 */}
      <Header />

      {/* 메인 콘텐츠 영역 */}
      <main className="flex-1 mx-auto w-full max-w-screen-xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* 하단 탭바 네비게이션 */}
      <BottomNav />

      {/* 토스트 알림 */}
      <Toaster position="top-center" richColors />
    </div>
  );
}
