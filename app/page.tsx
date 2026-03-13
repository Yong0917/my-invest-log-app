import { redirect } from "next/navigation";

/**
 * 루트 페이지 — 로그인 페이지로 리다이렉트
 * 인증된 사용자는 middleware에서 /dashboard로 이동됨
 */
export default function Home() {
  redirect("/auth/login");
}
