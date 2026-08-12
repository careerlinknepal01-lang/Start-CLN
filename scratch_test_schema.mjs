import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://caclltjrsfatglxrgcer.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhY2xsdGpyc2ZhdGdseHJnY2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTI3NDYsImV4cCI6MjA5NDM4ODc0Nn0.xOVDVVOqTEvoOzire2iH45si7sbFhLJAlUH7VgdfgyY";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkSchema() {
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  console.log("Data:", data);
  console.log("Error:", error);
}

checkSchema();
