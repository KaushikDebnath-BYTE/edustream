import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type MaterialType = 'image' | 'video';

export interface Lesson {
  id: string;
  teacher_id: string;
  title: string;
  code: string;
  created_at?: string;
}

export interface Material {
  id: string;
  lesson_id: string;
  type: MaterialType;
  url: string;
  title?: string;
}
