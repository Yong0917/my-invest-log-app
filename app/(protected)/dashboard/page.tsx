import { getPortfolios } from "@/app/actions/portfolio";
import { DashboardClient } from "./DashboardClient";

/**
 * 대시보드 Server Component
 * - getPortfolios()로 초기 데이터 조회 후 Client Component에 전달
 */
export default async function DashboardPage() {
  const portfolios = await getPortfolios();

  return <DashboardClient initialPortfolios={portfolios} />;
}
