/*
 * Supabase Service Layer — EcoDrop-CA
 * Handles all database operations. Falls back to mock data when Supabase isn't configured.
 * 
 * To activate: create a .env file in mobile/ with:
 *   VITE_SUPABASE_URL=https://yourproject.supabase.co
 *   VITE_SUPABASE_ANON=your-anon-key
 */

import { supabase } from '../supabase';

// ──────────────────────────────────────────────
// Check if Supabase is configured
// ──────────────────────────────────────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
export const isSupabaseConfigured = () =>
  SUPABASE_URL.length > 10 && !SUPABASE_URL.includes('YOUR_PROJECT');

// ──────────────────────────────────────────────
// AUTH
// ──────────────────────────────────────────────
export async function signUp({ email, password, fullName, department, year }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, department, year },
    },
  });
  if (error) throw error;

  // Create profile row
  if (data.user) {
    await supabase.from('profiles').insert({
      id: data.user.id,
      full_name: fullName,
      email,
      department,
      year: parseInt(year),
    });
  }
  return data;
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// ──────────────────────────────────────────────
// PROFILE
// ──────────────────────────────────────────────
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ──────────────────────────────────────────────
// TRANSACTIONS
// ──────────────────────────────────────────────
export async function getTransactions(userId, limit = 50) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function addTransaction(txData) {
  const { data, error } = await supabase
    .from('transactions')
    .insert(txData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ──────────────────────────────────────────────
// REWARDS & REDEMPTIONS
// ──────────────────────────────────────────────
export async function getRewards() {
  const { data, error } = await supabase
    .from('rewards')
    .select('*')
    .eq('active', true)
    .order('coin_cost');
  if (error) throw error;
  return data;
}

export async function redeemReward(userId, rewardId, coinCost, validDays = 30) {
  // Insert redemption — the DB trigger deducts coins automatically
  const expiresAt = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('redemptions')
    .insert({
      user_id: userId,
      reward_id: rewardId,
      coins_spent: coinCost,
      expires_at: expiresAt,
    })
    .select('*, rewards(*)')
    .single();
  if (error) throw error;
  return data;
}

export async function getUserVouchers(userId) {
  const { data, error } = await supabase
    .from('redemptions')
    .select('*, rewards(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// ──────────────────────────────────────────────
// LEADERBOARD
// ──────────────────────────────────────────────
export async function getLeaderboardAllTime(limit = 20) {
  const { data, error } = await supabase
    .from('leaderboard_all_time')
    .select('*')
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function getLeaderboardWeekly(limit = 20) {
  const { data, error } = await supabase
    .from('leaderboard_weekly')
    .select('*')
    .limit(limit);
  if (error) throw error;
  return data;
}

// ──────────────────────────────────────────────
// MACHINES
// ──────────────────────────────────────────────
export async function getMachines() {
  const { data, error } = await supabase
    .from('machines')
    .select('*')
    .order('id');
  if (error) throw error;
  return data;
}

// ──────────────────────────────────────────────
// FORUMS
// ──────────────────────────────────────────────
export async function getForumPosts(limit = 30) {
  const { data, error } = await supabase
    .from('forum_posts')
    .select('*, profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function createForumPost(userId, title, body, topic = 'General') {
  const { data, error } = await supabase
    .from('forum_posts')
    .insert({ user_id: userId, title, body, topic })
    .select('*, profiles(full_name)')
    .single();
  if (error) throw error;
  return data;
}

export async function likePost(userId, postId) {
  const { error } = await supabase
    .from('forum_likes')
    .insert({ user_id: userId, post_id: postId });
  if (error && error.code !== '23505') throw error; // ignore duplicate

  await supabase.rpc('increment_post_likes', { post_id_input: postId });
}

export async function getComments(postId) {
  const { data, error } = await supabase
    .from('forum_comments')
    .select('*, profiles(full_name)')
    .eq('post_id', postId)
    .order('created_at');
  if (error) throw error;
  return data;
}

export async function addComment(userId, postId, body) {
  const { data, error } = await supabase
    .from('forum_comments')
    .insert({ user_id: userId, post_id: postId, body })
    .select('*, profiles(full_name)')
    .single();
  if (error) throw error;
  return data;
}

// ──────────────────────────────────────────────
// PARTNER PORTAL — Voucher verification
// ──────────────────────────────────────────────
export async function verifyVoucher(voucherCode) {
  const { data, error } = await supabase
    .from('redemptions')
    .select('*, rewards(*), profiles(full_name)')
    .eq('voucher_code', voucherCode.toUpperCase())
    .single();
  if (error) throw error;
  return data;
}

export async function markVoucherUsed(redemptionId) {
  const { data, error } = await supabase
    .from('redemptions')
    .update({ status: 'used', used_at: new Date().toISOString() })
    .eq('id', redemptionId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ──────────────────────────────────────────────
// ACHIEVEMENTS
// ──────────────────────────────────────────────
export async function getUserAchievements(userId) {
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return data;
}

// ──────────────────────────────────────────────
// CAMPUS STATS (aggregated)
// ──────────────────────────────────────────────
export async function getCampusStats() {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('transactions')
    .select('coins_earned, co2_saved_kg')
    .gte('created_at', today);
  if (error) return { itemsToday: 0, coinsToday: 0, co2Today: 0 };

  return {
    itemsToday: data.length,
    coinsToday: data.reduce((s, t) => s + (t.coins_earned || 0), 0),
    co2Today: +data.reduce((s, t) => s + (parseFloat(t.co2_saved_kg) || 0), 0).toFixed(1),
  };
}
