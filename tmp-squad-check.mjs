import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: members, error: e1 } = await supabase.from('squad_members').select('*');
    console.log("Members count:", members?.length || 0, "Error:", e1);

    const { data: feed, error: e2 } = await supabase.from('squad_feed').select('*').order('created_at', { ascending: false }).limit(5);
    console.log("Feed Events:", feed, "Error:", e2);
}
check();
