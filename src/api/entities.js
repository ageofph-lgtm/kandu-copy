import { supabase } from "./supabaseClient";

// Helper: normalizar campos created_at/updated_at para created_date/updated_date
// e garantir compatibilidade com código legado Base44
const norm = (row) => {
  if (!row) return row;
  return {
    ...row,
    created_date: row.created_at,
    updated_date: row.updated_at,
    // Compatibilidade: BD usa "read", código antigo usava "is_read"
    is_read: row.read,
    // Rating: BD usa "score", código antigo usava "rating"
    rating: row.score ?? row.rating,
  };
};
const normList = (rows) => (rows || []).map(norm);

// Sessão actual
const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

// ─── USER ───────────────────────────────────────────────
export const User = {
  async me() {
    const session = await getSession();
    if (!session?.user) return null;
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle();
    return data ? norm({ ...data, email: session.user.email }) : null;
  },

  async filter(params = {}) {
    let q = supabase.from("users").select("*");
    Object.entries(params).forEach(([k, v]) => { q = q.eq(k, v); });
    const { data } = await q;
    return normList(data);
  },

  async get(id) {
    const { data } = await supabase.from("users").select("*").eq("id", id).maybeSingle();
    return norm(data);
  },

  async updateMyUserData(updates) {
    const session = await getSession();
    if (!session?.user) throw new Error("No session");
    const { error } = await supabase
      .from("users")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", session.user.id);
    if (error) throw error;
  },

  async list(order = "-created_at") {
    const ascending = order.startsWith("-") ? false : true;
    const col = order.replace(/^-/, "");
    const { data } = await supabase.from("users").select("*").order(col, { ascending });
    return normList(data);
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from("users")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select().single();
    if (error) throw error;
    return norm(data);
  },

  auth: {
    async signOut() { await supabase.auth.signOut(); },
    redirectToLogin() { window.location.href = "/Welcome"; }
  }
};

// ─── JOB ────────────────────────────────────────────────
export const Job = {
  async list(opts = {}) {
    let q = supabase.from("jobs").select("*").order("created_at", { ascending: false });
    if (opts.limit) q = q.limit(opts.limit);
    const { data } = await q;
    return normList(data);
  },

  async filter(params = {}) {
    let q = supabase.from("jobs").select("*").order("created_at", { ascending: false });
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) q = q.eq(k, v);
    });
    const { data } = await q;
    return normList(data);
  },

  async get(id) {
    const { data } = await supabase.from("jobs").select("*").eq("id", id).maybeSingle();
    return norm(data);
  },

  async create(payload) {
    const session = await getSession();
    const now = new Date().toISOString();
    const { data, error } = await supabase.from("jobs").insert({
      id: crypto.randomUUID(),
      ...payload,
      employer_id: payload.employer_id || session?.user?.id,
      created_at: now,
      updated_at: now,
    }).select().single();
    if (error) throw error;
    return norm(data);
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from("jobs")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select().single();
    if (error) throw error;
    return norm(data);
  },

  async delete(id) {
    const { error } = await supabase.from("jobs").delete().eq("id", id);
    if (error) throw error;
  },
};

// ─── APPLICATION ────────────────────────────────────────
export const Application = {
  async list(order = "-created_at") {
    const ascending = order.startsWith("-") ? false : true;
    const col = order.replace(/^-/, "");
    const { data } = await supabase.from("applications").select("*").order(col, { ascending });
    return normList(data);
  },

  async filter(params = {}) {
    let q = supabase.from("applications").select("*").order("created_at", { ascending: false });
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) q = q.eq(k, v);
    });
    const { data } = await q;
    return normList(data);
  },

  async create(payload) {
    const session = await getSession();
    const now = new Date().toISOString();
    const { data, error } = await supabase.from("applications").insert({
      id: crypto.randomUUID(),
      ...payload,
      worker_id: payload.worker_id || session?.user?.id,
      created_at: now,
      updated_at: now,
    }).select().single();
    if (error) throw error;
    return norm(data);
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from("applications")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select().single();
    if (error) throw error;
    return norm(data);
  },

  async delete(id) {
    const { error } = await supabase.from("applications").delete().eq("id", id);
    if (error) throw error;
  },
};

// ─── CHAT MESSAGE ────────────────────────────────────────
export const ChatMessage = {
  async list(order = "-created_at") {
    const ascending = order.startsWith("-") ? false : true;
    const col = order.replace(/^-/, "");
    const { data } = await supabase.from("chat_messages").select("*").order(col, { ascending });
    return normList(data);
  },

  async filter(params = {}) {
    let q = supabase.from("chat_messages").select("*").order("created_at", { ascending: true });
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) q = q.eq(k, v);
    });
    const { data } = await q;
    return normList(data);
  },

  async create(payload) {
    const session = await getSession();
    const now = new Date().toISOString();
    // Mapear content → content (BD), message → content (legado)
    const content = payload.content || payload.message || "";
    const { data, error } = await supabase.from("chat_messages").insert({
      // id tem default na BD — não precisamos gerar aqui
      ...payload,
      content,
      sender_id: payload.sender_id || session?.user?.id,
      read: payload.read ?? false,
      created_at: now,
    }).select().single();
    if (error) throw error;
    return norm(data);
  },

  async update(id, updates) {
    // Mapear is_read → read para compatibilidade
    const mapped = { ...updates };
    if ("is_read" in mapped) { mapped.read = mapped.is_read; delete mapped.is_read; }
    const { data, error } = await supabase
      .from("chat_messages")
      .update(mapped)
      .eq("id", id)
      .select().single();
    if (error) throw error;
    return norm(data);
  },
};

// ─── NOTIFICATION ────────────────────────────────────────
export const Notification = {
  async list(order = "-created_at") {
    const ascending = order.startsWith("-") ? false : true;
    const col = order.replace(/^-/, "");
    const { data } = await supabase.from("notifications").select("*").order(col, { ascending });
    return normList(data);
  },

  async filter(params = {}) {
    let q = supabase.from("notifications").select("*").order("created_at", { ascending: false });
    // Mapear is_read → read para compatibilidade com código legado
    const mapped = { ...params };
    if ("is_read" in mapped) { mapped.read = mapped.is_read; delete mapped.is_read; }
    Object.entries(mapped).forEach(([k, v]) => {
      if (v !== undefined && v !== null) q = q.eq(k, v);
    });
    const { data } = await q;
    return normList(data);
  },

  async create(payload) {
    // Ignorar action_url (não existe na BD)
    const { action_url: _action_url, ...rest } = payload;
    const { data, error } = await supabase.from("notifications").insert({
      // id tem default na BD
      ...rest,
      read: rest.read ?? false,
      created_at: new Date().toISOString(),
    }).select().single();
    if (error) throw error;
    return norm(data);
  },

  async update(id, updates) {
    // Mapear is_read → read para compatibilidade
    const mapped = { ...updates };
    if ("is_read" in mapped) { mapped.read = mapped.is_read; delete mapped.is_read; }
    const { data, error } = await supabase
      .from("notifications")
      .update(mapped)
      .eq("id", id)
      .select().single();
    if (error) throw error;
    return norm(data);
  },
};

// ─── RATING ────────────────────────────────────────────
export const Rating = {
  async list(order = "-created_at") {
    const ascending = order.startsWith("-") ? false : true;
    const col = order.replace(/^-/, "");
    const { data } = await supabase.from("ratings").select("*").order(col, { ascending });
    return normList(data);
  },

  async filter(params = {}) {
    let q = supabase.from("ratings").select("*").order("created_at", { ascending: false });
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) q = q.eq(k, v);
    });
    const { data } = await q;
    return normList(data);
  },

  async create(payload) {
    // Mapear rating → score se necessário (BD usa score)
    const score = payload.score ?? payload.rating;
    const { rating: _r, ...rest } = payload;
    const { data, error } = await supabase.from("ratings").insert({
      // id tem default na BD
      ...rest,
      score,
      created_at: new Date().toISOString(),
    }).select().single();
    if (error) throw error;
    return norm(data);
  },
};
