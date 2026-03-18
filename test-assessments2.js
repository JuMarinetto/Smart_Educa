const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://ykglesravcuazuqpfmjy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrZ2xlc3JhdmN1YXp1cXBmbWp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MTYwOTUsImV4cCI6MjA4ODE5MjA5NX0.yfTAwUVVvITYkbPcmpt9DiIbEojOmOFYh_PlUQCSafY";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function checkAll() {
    const { data, error } = await supabase.from('assessment_snapshots').select('*');
    if (error) {
        console.error(error);
    } else {
        console.log('Total snapshots:', data.length);
        if (data.length > 0) {
            console.log(data.map(d => ({ id: d.id, aluno: d.id_aluno, nota: d.nota_obtida, status: d.status_aprovacao })));
        }
    }
}
checkAll();
