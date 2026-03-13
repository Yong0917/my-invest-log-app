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
): Promise<{ success: boolean; error?: string; merged?: boolean; id?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "로그인이 필요합니다." };

  // 동일 티커가 이미 존재하는지 확인
  const { data: existing } = await supabase
    .from("portfolios")
    .select("id, quantity, avg_price")
    .eq("user_id", user.id)
    .eq("ticker", data.ticker)
    .single();

  if (existing) {
    // 가중평균 매수가 재계산 후 수량 합산
    const totalQuantity = existing.quantity + data.quantity;
    const newAvgPrice =
      (existing.quantity * existing.avg_price + data.quantity * data.avg_price) / totalQuantity;

    const { error } = await supabase
      .from("portfolios")
      .update({
        quantity: totalQuantity,
        avg_price: Math.round(newAvgPrice * 10000) / 10000,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) return { success: false, error: error.message };

    revalidatePath("/dashboard");
    revalidatePath("/portfolio");
    return { success: true, merged: true, id: existing.id };
  }

  const { data: inserted, error } = await supabase
    .from("portfolios")
    .insert({
      user_id: user.id,
      ticker: data.ticker,
      name: data.name,
      quantity: data.quantity,
      avg_price: data.avg_price,
      currency: data.currency,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/portfolio");
  return { success: true, merged: false, id: inserted.id };
}

export async function updatePortfolio(
  id: string,
  data: Pick<PortfolioFormValues, "quantity" | "avg_price">,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "로그인이 필요합니다." };

  const { error } = await supabase
    .from("portfolios")
    .update({
      quantity: data.quantity,
      avg_price: data.avg_price,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/portfolio");
  return { success: true };
}

export async function deletePortfolio(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "로그인이 필요합니다." };

  const { error } = await supabase
    .from("portfolios")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/portfolio");
  return { success: true };
}
