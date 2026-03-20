import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // 시스템 TLS 인증서 사용 (Google Fonts 요청 시 TLS 오류 방지)
    turbopackUseSystemTlsCerts: true,
  },
};

export default nextConfig;
