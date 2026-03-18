const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://ykglesravcuazuqpfmjy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrZ2xlc3JhdmN1YXp1cXBmbWp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MTYwOTUsImV4cCI6MjA4ODE5MjA5NX0.yfTAwUVVvITYkbPcmpt9DiIbEojOmOFYh_PlUQCSafY";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function authTest() {
    // 1. Get an existing snapshot to find the student email to login
    const { data: snaps } = await supabase.from('assessment_snapshots').select('id, id_aluno').not('id_aluno', 'is', null).limit(1);
    const snap = snaps[0];

    const { data: profile } = await supabase.from('profiles').select('email, senha').eq('id', snap.id_aluno).single();
    if (!profile) return console.log('No profile found');

    // 2. Login as the student
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: profile.senha || 'escola123'
    });

    if (authErr) return console.log('Auth error:', authErr.message);
    console.log('Logged in as:', authData.user.email);

    // 3. Try Update
    const { data: updData, error: updErr } = await supabase
        .from('assessment_snapshots')
        .update({ nota_obtida: 9.5, status_aprovacao: true })
        .eq('id', snap.id)
        .select();

    if (updErr) {
        console.error('Update Failed for logged in user:', updErr.message);
    } else {
        console.log('Update Success!', updData);
    }
}
authTest();
