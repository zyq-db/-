import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Types
export interface Role {
  id: string
  name: string
  color: string
  created_at?: string
}

export interface Person {
  id: string
  name: string
  role_id: string
  color: string
  department?: string
  created_at?: string
}

export interface Task {
  id: string
  title: string
  description: string
  person_ids: string[]
  week: string
  progress: number
  status: 'pending' | 'inProgress' | 'blocked' | 'completed'
  start_date: string
  due_date: string
  blockers: string[]
  notes: string
  updated_at: string
  created_at?: string
}
