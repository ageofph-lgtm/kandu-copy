/**
 * KANDU — Entity Layer (Supabase 100%)
 * Auth: Supabase Auth (login, sessão, User.me)
 * Dados: Supabase Postgres (jobs, applications, ratings, chat, notifications)
 */
import { supabase } from './supabaseClient';

function normalizeSort(sort = '-created_at') {
  return sort
    .replace('created_date', 'created_at')
    .replace('updated_date', 'updated_at');
}

function normalizeFields(obj) {
  const map = { is_read: 'read', created_date: 'created_at', updated_date: 'updated_at' };
  const out = {};
  for (const [k, v] of Object.entries(obj)) out[map[k] || k] = v;
  return out;
}

function makeEntity(tableName) {
  return {
    async list(sort = '-created_at') {
      sort = normalizeSort(sort);
      const isDesc = sort.startsWith('-');
      const col = isDesc ? sort.slice(1) : sort;
      const { data, error } = await supabase
        .from(tableName).select('*').order(col, { ascending: !isDesc });
      if (error) throw error;
      return data || [];
    },

    async filter(query = {}, sort = '-created_at') {
      sort = normalizeSort(sort);
      const isDesc = sort.startsWith('-');
      const col = isDesc ? sort.slice(1) : sort;
      const nq = normalizeFields(query);
      let req = supabase.from(tableName).select('*');
      for (const [k, v] of Object.entries(nq)) {
        if (v !== undefined && v !== null) req = req.eq(k, v);
      }
      req = req.order(col, { ascending: !isDesc });
      const { data, error } = await req;
      if (error) throw error;
      return data || [];
    },

    async get(id) {
      const { data, error } = await supabase
        .from(tableName).select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },

    async create(record) {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from(tableName)
        .insert([{ ...record, created_at: now, updated_at: now }])
        .select().single();
      if (error) throw error;
      return data;
    },

    async update(id, updates) {
      const normalized = normalizeFields(updates);
      const { data, error } = await supabase
        .from(tableName)
        .update({ ...normalized, updated_at: new Date().toISOString() })
        .eq('id', id).select().single();
      if (error) throw error;
      return data;
    },

    async delete(id) {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw error;
      return true;
    },

    async bulkCreate(records) {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from(tableName)
        .insert(records.map(r => ({ ...r, created_at: now, updated_at: now })))
        .select();
      if (error) throw error;
      return data || [];
    },
  };
}

export const Job          = makeEntity('jobs');
export const Application  = makeEntity('applications');
export const Rating       = makeEntity('ratings');
export const ChatMessage  = makeEntity('chat_messages');
export const Notification = makeEntity('notifications');
export const Blacklist    = makeEntity('blacklist');

// ─── User — Supabase Auth + tabela users ─────────────────────────────────────
export const User = {
  async me() {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) throw new Error('Not authenticated');
    const { data: profile } = await supabase
      .from('users').select('*').eq('id', authUser.id).maybeSingle();
    return { id: authUser.id, email: authUser.email, full_name: authUser.user_metadata?.full_name || authUser.email, ...(profile || {}) };
  },

  async update(id, updates) {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('users')
      .upsert({ id, ...updates, updated_at: now }, { onConflict: 'id' })
      .select().single();
    if (error) throw error;
    return data;
  },

  async updateMyUserData(updates) {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) throw new Error('Not authenticated');
    return this.update(authUser.id, updates);
  },

  async filter(query = {}) {
    const nq = normalizeFields(query);
    let req = supabase.from('users').select('*');
    for (const [k, v] of Object.entries(nq)) {
      if (v !== undefined && v !== null) req = req.eq(k, v);
    }
    const { data, error } = await req;
    if (error) throw error;
    return data || [];
  },

  async get(id) {
    const { data, error } = await supabase
      .from('users').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  async logout() { await supabase.auth.signOut(); window.location.href = '/'; },
  async loginWithRedirect() { window.location.href = '/Welcome'; },
};
