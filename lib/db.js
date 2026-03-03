import { supabase } from './supabase';

// ─── Auth ───
export async function signUp(email, password, displayName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } }
  });
  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}

// ─── Save & Load App State ───
// We store the entire app state as JSON in a single row per user.
// This is simple and works perfectly for a personal productivity app.

export async function saveAppState(userId, state) {
  const { error } = await supabase
    .from('user_data')
    .upsert({
      user_id: userId,
      hats: state.hats,
      archives: state.archives,
      day_state: state.dayState,
      day_start_time: state.dayStartTime,
      day_date: state.dayDate,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });
  if (error) throw error;
}

export async function loadAppState(userId) {
  const { data, error } = await supabase
    .from('user_data')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  return data;
}
