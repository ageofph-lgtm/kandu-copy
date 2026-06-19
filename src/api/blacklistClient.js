// Blacklist — cliente Supabase directo (não depende do entities.js gerado pelo Base44)
import { supabase } from "@/api/supabaseClient";

const BLACKLIST_TABLE = "blacklist";

export const Blacklist = {
  async list(order = "-created_at") {
    const ascending = !order.startsWith("-");
    const col = order.replace(/^-/, "");
    const { data, error } = await supabase
      .from(BLACKLIST_TABLE)
      .select("*")
      .order(col, { ascending });
    if (error) console.error("Blacklist.list error:", error);
    return data || [];
  },

  async filter(params = {}) {
    let q = supabase.from(BLACKLIST_TABLE).select("*").order("created_at", { ascending: false });
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) q = q.eq(k, v);
    });
    const { data } = await q;
    return data || [];
  },

  async create(payload) {
    // Apenas os campos que existem na tabela blacklist: id, user_id, reason, created_at
    const { data, error } = await supabase.from(BLACKLIST_TABLE).insert({
      id: crypto.randomUUID(),
      user_id: payload.user_id,
      reason: payload.reason || "",
      created_at: new Date().toISOString(),
    }).select().single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from(BLACKLIST_TABLE).delete().eq("id", id);
    if (error) throw error;
  },
};
