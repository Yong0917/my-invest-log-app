import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Toaster } from "sonner";

/**
 * 인증된 사용자 레이아웃
 * Header + main content + BottomNav
 */
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 mx-auto w-full max-w-screen-xl px-4 py-6 sm:px-6 lg:px-8 sm:py-8">
        {children}
      </main>

      <BottomNav />

      <Toaster
        position="top-center"
        richColors
        toastOptions={{
          style: {
            fontFamily: "var(--font-sans, ui-sans-serif)",
            fontSize: "13px",
          },
        }}
      />
    </div>
  );
}
