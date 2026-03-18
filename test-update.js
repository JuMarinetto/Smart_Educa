const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://ykglesravcuazuqpfmjy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrZ2xlc3JhdmN1YXp1cXBmbWp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MTYwOTUsImV4cCI6MjA4ODE5MjA5NX0.yfTAwUVVvITYkbPcmpt9DiIbEojOmOFYh_PlUQCSafY";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function testUpdate() {
    const { data: snaps } = await supabase.from('assessment_snapshots').select('*').limit(1);
    const snapId = snaps[0].id;
    console.log('Testing update on snap ID:', snapId);

    const { data, error } = await supabase
        .from('assessment_snapshots')
        .update({ nota_obtida: 10, status_aprovacao: true })
        .eq('id', snapId)
        .select();

    if (error) {
        console.error('Update Failed:', error);
    } else {
        console.log('Update Success!', data);
    }
}
testUpdate();
