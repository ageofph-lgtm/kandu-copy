/**
 * KANDU — Supabase Entity Layer
 * Compatível com a API anterior: Entity.list(), .filter(), .get(), .create(), .update(), .delete()
 */
import { supabase } from './supabaseClient';

function normalizeSort(sort = '-created_at') {
  return sort
    .replace('created_date', 'created_at')
    .replace('updated_date', 'updated_at');
}

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
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },

    async create(record) {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from(tableName)
        .insert([{ ...record, created_at: now, updated_at: now }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async update(id, updates) {
      const { data, error } = await supabase
        .from(tableName)
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
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

// User — Supabase Auth + tabela users
export const User = {
  async me() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new Error('Not authenticated');
    const { data, error: dbErr } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    if (dbErr) throw dbErr;
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateMyUserData(updates) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return this.update(user.id, updates);
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
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async logout() {
    await supabase.auth.signOut();
  },

  async loginWithRedirect() {
    window.location.href = '/';
  },
};

// Compatibilidade com imports antigos @/entities/*
export { Job as default };
