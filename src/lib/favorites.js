import { supabase } from "@/api/supabaseClient";

/**
 * Guardados / favoritos (#40) — obras e profissionais que o utilizador
 * guarda para consultar depois em "Trabalho".
 */

export async function listFavorites(userId, targetType) {
  if (!userId) return [];
  let q = supabase.from("favorites").select("*").eq("user_id", userId);
  if (targetType) q = q.eq("target_type", targetType);
  const { data, error } = await q.order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function listFavoriteIds(userId, targetType) {
  const rows = await listFavorites(userId, targetType);
  return rows.map(r => r.target_id);
}

export async function isFavorite(userId, targetType, targetId) {
  if (!userId) return false;
  const { data } = await supabase.from("favorites").select("id")
    .eq("user_id", userId).eq("target_type", targetType).eq("target_id", targetId)
    .maybeSingle();
  return !!data;
}

/** Alterna o favorito. Devolve `true` se ficou guardado. */
export async function toggleFavorite(userId, targetType, targetId) {
  if (!userId) throw new Error("Sem sessão.");
  const { data: existing } = await supabase.from("favorites").select("id")
    .eq("user_id", userId).eq("target_type", targetType).eq("target_id", targetId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("favorites").delete().eq("id", existing.id);
    if (error) throw error;
    return false;
  }

  const { error } = await supabase.from("favorites")
    .insert({ user_id: userId, target_type: targetType, target_id: targetId });
  if (error) throw error;
  return true;
}
