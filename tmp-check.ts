import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("URL:", supabaseUrl?.substring(0, 20) + "...");
    const { data: members, error: e1 } = await supabase.from('squad_members').select('*');
    console.log("Members count:", members?.length || 0, "Error:", e1);

    const { data: feed, error: e2 } = await supabase.from('squad_feed').select('*').order('created_at', { ascending: false }).limit(5);
    console.log("Latest Feed Events:", JSON.stringify(feed, null, 2), "Error:", e2);
}
check();
