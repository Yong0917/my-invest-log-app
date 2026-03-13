"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Portfolio } from "@/types/portfolio";
import type { PortfolioFormValues } from "@/schemas/portfolio";

export async function getPortfolios(): Promise<Portfolio[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("portfolios")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) return [];
  return data ?? [];
}

export async function createPortfolio(
  data: PortfolioFormValues,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "로그인이 필요합니다." };

  const { error } = await supabase.from("portfolios").insert({
    user_id: user.id,
    ticker: data.ticker,
    name: data.name,
    quantity: data.quantity,
    avg_price: data.avg_price,
    currency: data.currency,
  });

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "이미 등록된 종목입니다." };
    }
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function updatePortfolio(
  id: string,
  data: Pick<PortfolioFormValues, "quantity" | "avg_price">,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("portfolios")
    .update({
      quantity: data.quantity,
      avg_price: data.avg_price,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}

export async function deletePortfolio(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.from("portfolios").delete().eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}
