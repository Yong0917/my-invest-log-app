"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { PortfolioGroup } from "@/types/portfolio";
import type { GroupFormValues } from "@/schemas/portfolio";

/** 현재 유저의 그룹 목록 조회 */
export async function getGroups(): Promise<PortfolioGroup[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("portfolio_groups")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) return [];
  return data ?? [];
}

/** 그룹 생성 */
export async function createGroup(
  data: GroupFormValues,
): Promise<{ success: boolean; error?: string; id?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "로그인이 필요합니다." };

  const { data: inserted, error } = await supabase
    .from("portfolio_groups")
    .insert({ user_id: user.id, name: data.name, color: data.color })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/portfolio");
  return { success: true, id: inserted.id };
}

/** 그룹 수정 */
export async function updateGroup(
  id: string,
  data: GroupFormValues,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "로그인이 필요합니다." };

  const { error } = await supabase
    .from("portfolio_groups")
    .update({ name: data.name, color: data.color })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/portfolio");
  return { success: true };
}

/** 그룹 삭제 (소속 종목은 자동으로 미분류로 변경) */
export async function deleteGroup(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "로그인이 필요합니다." };

  const { error } = await supabase
    .from("portfolio_groups")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/portfolio");
  return { success: true };
}

/** 종목을 그룹에 할당 (groupId가 null이면 미분류로 이동) */
export async function assignPortfolioToGroup(
  portfolioId: string,
  groupId: string | null,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "로그인이 필요합니다." };

  const { error } = await supabase
    .from("portfolios")
    .update({ group_id: groupId, updated_at: new Date().toISOString() })
    .eq("id", portfolioId)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/portfolio");
  return { success: true };
}
