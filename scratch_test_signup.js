import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSignup() {
  console.log("Testing signup...");
  const res = await supabase.auth.signUp({
    email: 'test_user_' + Date.now() + '@example.com',
    password: 'Password123!',
    options: {
      data: {
        name: 'Test User',
        college: 'Test College',
        field: 'Test Field'
      }
    }
  });
  console.log(JSON.stringify(res, null, 2));
}

testSignup();
