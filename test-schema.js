const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://ykglesravcuazuqpfmjy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrZ2xlc3JhdmN1YXp1cXBmbWp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MTYwOTUsImV4cCI6MjA4ODE5MjA5NX0.yfTAwUVVvITYkbPcmpt9DiIbEojOmOFYh_PlUQCSafY";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function checkSchema() {
    const res = await supabase.rpc('get_schema_info', { table_name: 'assessment_snapshots' });
    console.log(res);

    // Alternative way: query information_schema if possible, usually inaccessible from JS client. So let's just test updating the score to 99 vs 100.

    // We can also fetch the assessment to see its nota_total
    const { data: assess } = await supabase.from('assessments').select('*').limit(1);
    console.log('Sample Assessment Nota Total:', assess[0].nota_total);
}
checkSchema();
