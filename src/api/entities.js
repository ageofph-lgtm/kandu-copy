/**
 * KANDU — Entity Layer
 * Auth: Base44 (login, sessão, User.me)
 * Dados: Supabase (jobs, applications, ratings, chat, notifications)
 */
import { base44 } from './base44Client';
import { supabase } from './supabaseClient';

// ─── Normalização de sort ─────────────────────────────────────────────────────
function normalizeSort(sort = '-created_at') {
  return sort
    .replace('created_date', 'created_at')
    .replace('updated_date', 'updated_at');
}

// ─── Factory para entidades Supabase ─────────────────────────────────────────
function makeEntity(tableName) {
  return {
    async list(sort = '-created_at') {
      sort = normalizeSort(sort);
      const isDesc = sort.startsWith('-');
      const col = isDesc ? sort.slice(1) : sort;
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order(col, { ascending: !isDesc });
      if (error) throw error;
      return data || [];
    },

    async filter(query = {}, sort = '-created_at') {
      sort = normalizeSort(sort);
      const isDesc = sort.startsWith('-');
      const col = isDesc ? sort.slice(1) : sort;
      let req = supabase.from(tableName).select('*');
      for (const [k, v] of Object.entries(query)) {
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
      const { data, error } = await supabase
        .from(tableName)
        .update({ ...updates, updated_at: new Date().toISOString() })
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

// ─── Entidades de dados (Supabase) ────────────────────────────────────────────
export const Job          = makeEntity('jobs');
export const Application  = makeEntity('applications');
export const Rating       = makeEntity('ratings');
export const ChatMessage  = makeEntity('chat_messages');
export const Notification = makeEntity('notifications');
export const Blacklist    = makeEntity('blacklist');

// ─── User — Base44 Auth + sync com tabela users no Supabase ──────────────────
export const User = {
  // me() — usa Base44 auth, depois enriquece com dados do Supabase
  async me() {
    const b44User = await base44.auth.me();
    if (!b44User) throw new Error('Not authenticated');
    // Tentar buscar dados extra do Supabase (user_type, bio, etc.)
    const { data: supa } = await supabase
      .from('users').select('*').eq('id', b44User.id).maybeSingle();
    // Merge: dados Base44 + dados Supabase
    return { ...b44User, ...(supa || {}) };
  },

  async update(id, updates) {
    // Actualizar Base44
    try { await base44.entities.User.update(id, updates); } catch {}
    // Upsert no Supabase
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('users')
      .upsert({ id, ...updates, updated_at: now }, { onConflict: 'id' })
      .select().single();
    if (error) throw error;
    return data;
  },

  async updateMyUserData(updates) {
    const b44User = await base44.auth.me();
    if (!b44User) throw new Error('Not authenticated');
    return this.update(b44User.id, updates);
  },

  async filter(query = {}) {
    let req = supabase.from('users').select('*');
    for (const [k, v] of Object.entries(query)) {
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

  async logout() { base44.auth.logout(window.location.href); },
  async loginWithRedirect() { base44.auth.redirectToLogin(window.location.href); },
};
