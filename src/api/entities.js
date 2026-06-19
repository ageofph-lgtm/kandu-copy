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
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle();
    if (error || !data) return null;
    return norm({ ...data, email: session.user.email });
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
    let q = supabase.from("users").select("*").order(col, { ascending });
    const { data } = await q;
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

  // alias para Layout.jsx (UserEntity.me())
  async me() {
    const session = await getSession();
    if (!session?.user) return null;
    const { data } = await supabase
      .from("users").select("*").eq("id", session.user.id).maybeSingle();
    return data ? norm({ ...data, email: session.user.email }) : null;
  },

  auth: {
    async signOut() { await supabase.auth.signOut(); },
    redirectToLogin(url) { window.location.href = "/login"; }
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
      ...payload,
      employer_id: session?.user?.id,
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
    const { data, error } = await supabase.from("chat_messages").insert({
      ...payload,
      sender_id: payload.sender_id || session?.user?.id,
      created_at: now,
    }).select().single();
    if (error) throw error;
    return norm(data);
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from("chat_messages")
      .update(updates)
      .eq("id", id)
      .select().single();
    if (error) throw error;
    return norm(data);
  },
};

// ─── BLACKLIST ─────────────────────────────────────────
export const Blacklist = {
  async list(order = "-created_at") {
    const ascending = order.startsWith("-") ? false : true;
    const col = order.replace(/^-/, "");
    let q = supabase.from("blacklists").select("*").order(col, { ascending });
    const { data } = await q;
    return normList(data);
  },

  async create(payload) {
    const session = await getSession();
    const now = new Date().toISOString();
    const { data, error } = await supabase.from("blacklists").insert({
      ...payload,
      admin_id: payload.admin_id || session?.user?.id,
      created_at: now,
      updated_at: now,
    }).select().single();
    if (error) throw error;
    return norm(data);
  },
};

// ─── RATING ────────────────────────────────────────────
export const Rating = {
  async list(order = "-created_at") {
    const ascending = order.startsWith("-") ? false : true;
    const col = order.replace(/^-/, "");
    let q = supabase.from("ratings").select("*").order(col, { ascending });
    const { data } = await q;
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
};

// ─── NOTIFICATION ────────────────────────────────────────
export const Notification = {
  async filter(params = {}) {
    let q = supabase.from("notifications").select("*").order("created_at", { ascending: false });
    Object.entries(params).forEach(([k, v]) => {
      if (typeof v === 'object' && v !== null) return; // skip complex filters
      if (v !== undefined && v !== null) q = q.eq(k, v);
    });
    const { data } = await q;
    return normList(data);
  },

  async create(payload) {
    const now = new Date().toISOString();
    const { data, error } = await supabase.from("notifications").insert({
      ...payload,
      read: false,
      created_at: now,
    }).select().single();
    if (error) throw error;
    return norm(data);
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from("notifications")
      .update(updates)
      .eq("id", id)
      .select().single();
    if (error) throw error;
    return norm(data);
  },
};