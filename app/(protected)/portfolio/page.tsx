import { getPortfolios } from "@/app/actions/portfolio";
import { getGroups } from "@/app/actions/group";
import { PortfolioClient } from "./PortfolioClient";

/**
 * 보유 종목 관리 페이지 Server Component
 * - getPortfolios() + getGroups() 병렬 조회 후 Client Component에 전달
 */
export default async function PortfolioPage() {
  const [portfolios, groups] = await Promise.all([getPortfolios(), getGroups()]);

  return <PortfolioClient initialPortfolios={portfolios} initialGroups={groups} />;
}
