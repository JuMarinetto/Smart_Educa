const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://ykglesravcuazuqpfmjy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrZ2xlc3JhdmN1YXp1cXBmbWp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MTYwOTUsImV4cCI6MjA4ODE5MjA5NX0.yfTAwUVVvITYkbPcmpt9DiIbEojOmOFYh_PlUQCSafY";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function checkClasses() {
  const { data, error } = await supabase
    .from('classes')
    .select('id, nome_turma, created_at')
    .order('created_at', { ascending: true }); // Ascending to see old ones

  if (error) {
    console.error('Error fetching classes:', error);
    return;
  }

  console.log('--- ALL CLASSES DATA ---');
  console.table(data);
}

checkClasses();
