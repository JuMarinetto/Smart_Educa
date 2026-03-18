const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://ykglesravcuazuqpfmjy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrZ2xlc3JhdmN1YXp1cXBmbWp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MTYwOTUsImV4cCI6MjA4ODE5MjA5NX0.yfTAwUVVvITYkbPcmpt9DiIbEojOmOFYh_PlUQCSafY";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function testSchema() {
    const { data: snaps } = await supabase.from('assessment_snapshots').select('id').limit(1);
    const id = snaps[0].id;

    console.log('Testing 99.99');
    const { error: err1 } = await supabase.from('assessment_snapshots').update({ nota_obtida: 99.99 }).eq('id', id);
    console.log('99.99 result:', err1 ? err1.message : 'Success');

    console.log('Testing 100.00');
    const { error: err2 } = await supabase.from('assessment_snapshots').update({ nota_obtida: 100.00 }).eq('id', id);
    console.log('100.00 result:', err2 ? err2.message : 'Success');
}
testSchema();
