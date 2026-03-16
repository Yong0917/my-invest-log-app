import { getPortfolios } from "@/app/actions/portfolio";
import { getGroups } from "@/app/actions/group";
import { DashboardClient } from "./DashboardClient";

/**
 * 대시보드 Server Component
 * - getPortfolios() + getGroups() 병렬 조회 후 Client Component에 전달
 */
export default async function DashboardPage() {
  const [portfolios, groups] = await Promise.all([getPortfolios(), getGroups()]);

  return <DashboardClient initialPortfolios={portfolios} initialGroups={groups} />;
}
