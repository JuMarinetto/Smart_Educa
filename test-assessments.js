const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://ykglesravcuazuqpfmjy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrZ2xlc3JhdmN1YXp1cXBmbWp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MTYwOTUsImV4cCI6MjA4ODE5MjA5NX0.yfTAwUVVvITYkbPcmpt9DiIbEojOmOFYh_PlUQCSafY";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function checkAssessments() {
    const { data, error } = await supabase
        .from('assessment_snapshots')
        .select(`
          *,
          avaliacao:assessments!inner(*)
        `)
        .order('data_aplicacao', { ascending: false });

    if (error) {
        console.error('Error in query:', error.message, error.details, error.hint);
    } else {
        console.log('Query success! Records:', data?.length);
        if (data && data.length > 0) console.log('First record avaliacao:', JSON.stringify(data[0].avaliacao));
    }
}

checkAssessments();
