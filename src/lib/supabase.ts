import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://akcthtleidufncilgbwb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrY3RodGxlaWR1Zm5jaWxnYndiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk1NzUxMDUsImV4cCI6MjA1NTE1MTEwNX0.N3rQUrbq9E_Qq9tjVKqVWkBLZD0xL2J2-XSXYvMfcG0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);