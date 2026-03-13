import { getPortfolios } from "@/app/actions/portfolio";
import { PortfolioClient } from "./PortfolioClient";

/**
 * 보유 종목 관리 페이지 Server Component
 * - getPortfolios()로 초기 데이터 조회 후 Client Component에 전달
 */
export default async function PortfolioPage() {
  const portfolios = await getPortfolios();

  return <PortfolioClient initialPortfolios={portfolios} />;
}
