'use client';
import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseAnonKey, getSupabaseUrl } from './settings';

export function createSupabaseBrowser() {
  return createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey());
}
