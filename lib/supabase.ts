import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lncgbmbjkxhpmuejiryw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxuY2dibWJqa3hocG11ZWppcnl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNzA2OTIsImV4cCI6MjA2Nzk0NjY5Mn0.uwKHKCvNfC2yCOphIDmKhYkIl2G_zced5a1PROnj7UE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;