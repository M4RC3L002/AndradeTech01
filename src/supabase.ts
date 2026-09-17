import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://yqpgdnztjoplteltassu.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_bkwyPpi15PfyHh_rHVVkLA_XW-w2GZY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)