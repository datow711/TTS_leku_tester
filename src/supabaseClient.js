import { createClient } from '@supabase/supabase-js'

// 提醒：請將這些金鑰移至 .env.local 檔案中，並從 .gitignore 排除
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)
