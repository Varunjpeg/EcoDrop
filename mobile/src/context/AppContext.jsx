/*
 * EcoDrop-CA — Smart AppContext
 * Auto-detects Supabase: uses real auth when configured, mock data when not.
 * 
 * Mock mode: works offline, all users see demo data
 * Supabase mode: real signup/login, real transactions, real leaderboard
 */
import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { MOCK_USER, MOCK_TRANSACTIONS, MOCK_VOUCHERS, FORUM_POSTS } from '../data/mockData';
import { supabase } from '../supabase';
import { startAutoSync, flushQueue, queueTransaction, getPendingCount } from '../services/syncService';

const AppContext = createContext(null);

// ── Check if Supabase is actually configured ──────────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const IS_SUPABASE_LIVE = SUPABASE_URL.length > 10 && !SUPABASE_URL.includes('YOUR_PROJECT');

// ── Initial State ─────────────────────────────────────────────
const initialState = {
  user: null,
  isAuthenticated: false,
  supabaseMode: IS_SUPABASE_LIVE,
  loading: true,              // true while checking auth on startup
  transactions: MOCK_TRANSACTIONS,
  vouchers: MOCK_VOUCHERS,
  forumPosts: FORUM_POSTS,
  notifications: [
    { id: 'n1', type: 'earn',   text: '+16 E-Coins for Plastic Bottle',    read: false, time: '2h ago' },
    { id: 'n2', type: 'reward', text: 'Gazebo voucher expires in 24 hours', read: false, time: '5h ago' },
    { id: 'n3', type: 'rank',   text: 'You moved up to rank #13!',          read: true,  time: '1d ago' },
  ],
};

// ── Reducer ───────────────────────────────────────────────────
function appReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'LOGIN':
      return { ...state, isAuthenticated: true, user: action.payload, loading: false };
    case 'LOGOUT':
      return { ...state, isAuthenticated: false, user: null, loading: false };
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload };
    case 'ADD_TRANSACTION':
      return {
        ...state,
        transactions: [action.payload, ...state.transactions],
        user: {
          ...state.user,
          coins: (state.user?.coins || 0) + action.payload.coins,
          totalEarned: (state.user?.totalEarned || 0) + action.payload.coins,
          totalItems: (state.user?.totalItems || 0) + 1,
          co2Saved: +((state.user?.co2Saved || 0) + (action.payload.co2 || 0)).toFixed(2),
        },
      };
    case 'REDEEM_REWARD': {
      const { reward } = action.payload;
      const newVoucher = {
        id: 'v' + Date.now(),
        partner: reward.partner,
        icon: reward.icon,
        desc: reward.desc,
        code: reward.partner.substring(0, 3).toUpperCase() + '-' +
              Math.random().toString(36).substring(2, 8).toUpperCase(),
        status: 'active',
        expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        coins: reward.coins,
      };
      return {
        ...state,
        vouchers: [newVoucher, ...state.vouchers],
        transactions: [
          {
            id: 't' + Date.now(), type: 'spend', item: null, condition: null,
            coins: -reward.coins, date: new Date().toISOString(),
            partner: reward.partner, voucher: newVoucher.code,
          },
          ...state.transactions,
        ],
        user: {
          ...state.user,
          coins: (state.user?.coins || 0) - reward.coins,
          totalSpent: (state.user?.totalSpent || 0) + reward.coins,
        },
      };
    }
    case 'ADD_FORUM_POST':
      return { ...state, forumPosts: [action.payload, ...state.forumPosts] };
    case 'LIKE_POST':
      return {
        ...state,
        forumPosts: state.forumPosts.map(p =>
          p.id === action.payload ? { ...p, likes: p.likes + 1, liked: true } : p
        ),
      };
    case 'ADD_COMMENT':
      return {
        ...state,
        forumPosts: state.forumPosts.map(p =>
          p.id === action.payload.postId
            ? { ...p, comments: p.comments + 1, commentsList: [...(p.commentsList || []), action.payload.comment] }
            : p
        ),
      };
    case 'MARK_NOTIFICATIONS_READ':
      return { ...state, notifications: state.notifications.map(n => ({ ...n, read: true })) };
    default:
      return state;
  }
}

// ── Helper: convert Supabase profile to app user format ───────
function profileToUser(profile, authUser = null) {
  if (!profile && authUser) {
    const name = authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User';
    return {
      id: authUser.id,
      name: name,
      email: authUser.email || '',
      department: authUser.user_metadata?.department || 'General',
      year: authUser.user_metadata?.year || 1,
      coins: 0,
      totalEarned: 0,
      totalItems: 0,
      totalSpent: 0,
      streak: 0,
      co2Saved: 0,
      referralCode: 'ECO' + authUser.id.substring(0, 4).toUpperCase(),
      avatar: name.substring(0, 2).toUpperCase(),
      joinedAt: authUser.created_at || new Date().toISOString(),
    };
  }

  const name = profile.full_name || authUser?.email?.split('@')[0] || 'User';
  return {
    id: profile.id,
    name: name,
    email: profile.email || authUser?.email || '',
    department: profile.department || 'General',
    year: profile.year || 1,
    coins: profile.coins_balance || 0,
    totalEarned: profile.total_coins_earned || 0,
    totalItems: profile.total_items_deposited || 0,
    totalSpent: 0,
    streak: profile.daily_streak || 0,
    co2Saved: +((profile.total_items_deposited || 0) * 0.3).toFixed(1),
    referralCode: profile.referral_code || 'ECO' + profile.id.substring(0, 4).toUpperCase(),
    avatar: name.substring(0, 2).toUpperCase(),
    joinedAt: profile.created_at,
  };
}

// ── Provider ─────────────────────────────────────────────────
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const syncCleanupRef = useRef(null);

  // Start offline sync — runs whenever internet comes back
  useEffect(() => {
    syncCleanupRef.current = startAutoSync(() => state.user?.id);
    return () => syncCleanupRef.current?.();
  }, [state.user?.id]);

  // ── On mount: check for existing session ────────────────────
  useEffect(() => {
    if (IS_SUPABASE_LIVE) {
      // Real Supabase — check for existing session
      checkSession();

      // Listen for auth state changes (login, logout, token refresh)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
            await loadProfile(session.user.id, session.user);
          } else if (event === 'SIGNED_OUT') {
            dispatch({ type: 'LOGOUT' });
          }
        }
      );

      return () => subscription.unsubscribe();
    } else {
      // Mock mode — check sessionStorage for demo login
      const saved = sessionStorage.getItem('ecodrop_user');
      if (saved) {
        dispatch({ type: 'LOGIN', payload: JSON.parse(saved) });
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }
  }, []);

  // ── Check existing Supabase session ─────────────────────────
  async function checkSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadProfile(session.user.id, session.user);
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (err) {
      console.error('Session check failed:', err);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }

  // ── Load profile from Supabase ──────────────────────────────
  async function loadProfile(userId, authUser = null) {
    try {
      let { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      // If profile row doesn't exist yet, insert it automatically
      if (!profile && authUser) {
        const newProfile = {
          id: authUser.id,
          full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
          email: authUser.email || '',
          department: authUser.user_metadata?.department || 'General',
          year: parseInt(authUser.user_metadata?.year) || 1,
        };
        const { data: createdProfile } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .single();
        if (createdProfile) profile = createdProfile;
      }

      const userObject = profileToUser(profile, authUser);
      dispatch({ type: 'LOGIN', payload: userObject });

      // Also load transactions
      const { data: txns } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (txns) {
        const formatted = txns.map(t => ({
          id: t.id,
          type: 'earn',
          item: t.item_type,
          condition: t.item_condition,
          coins: t.coins_earned,
          co2: parseFloat(t.co2_saved_kg) || 0,
          date: t.created_at,
          machine: t.machine_id,
          confidence: parseFloat(t.ai_confidence) || 0,
          model: t.ai_model_used,
        }));
        dispatch({ type: 'SET_TRANSACTIONS', payload: formatted });
      }
    } catch (err) {
      console.error('Profile load error (using fallback):', err);
      // Fallback: log user in with auth metadata even if profile query failed
      if (authUser) {
        dispatch({ type: 'LOGIN', payload: profileToUser(null, authUser) });
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }
  }

  // ── Login ───────────────────────────────────────────────────
  const login = async (userDataOrCredentials) => {
    if (IS_SUPABASE_LIVE && userDataOrCredentials?.email && userDataOrCredentials?.password) {
      // Real Supabase auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: userDataOrCredentials.email,
        password: userDataOrCredentials.password,
      });
      if (error) throw error;
      if (data?.user) {
        await loadProfile(data.user.id, data.user);
      }
      return data;
    } else {
      // Mock mode / Demo mode
      const user = userDataOrCredentials?.name ? userDataOrCredentials : { ...MOCK_USER };
      sessionStorage.setItem('ecodrop_user', JSON.stringify(user));
      dispatch({ type: 'LOGIN', payload: user });
      return user;
    }
  };

  // ── Register ────────────────────────────────────────────────
  const register = async ({ email, password, fullName, department, year }) => {
    if (IS_SUPABASE_LIVE) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, department, year } },
      });
      if (error) throw error;

      // Create profile row
      if (data.user) {
        try {
          await supabase.from('profiles').insert({
            id: data.user.id,
            full_name: fullName,
            email,
            department,
            year: parseInt(year) || 1,
          });
        } catch (e) {
          console.warn('Profile insert warning:', e);
        }
        await loadProfile(data.user.id, data.user);
      }
      return data;
    } else {
      // Mock mode — just login with mock user
      const mockUser = {
        ...MOCK_USER,
        name: fullName,
        email,
        department,
        year: parseInt(year) || 1,
        coins: 0,
        totalEarned: 0,
        totalItems: 0,
        streak: 0,
        co2Saved: 0,
      };
      sessionStorage.setItem('ecodrop_user', JSON.stringify(mockUser));
      dispatch({ type: 'LOGIN', payload: mockUser });
      return mockUser;
    }
  };

  // ── Google Sign-In ──────────────────────────────────────────
  const loginWithGoogle = async () => {
    if (IS_SUPABASE_LIVE) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } else {
      // Mock mode — login with mock user
      sessionStorage.setItem('ecodrop_user', JSON.stringify(MOCK_USER));
      dispatch({ type: 'LOGIN', payload: MOCK_USER });
    }
  };

  // ── Logout ──────────────────────────────────────────────────
  const logout = async () => {
    if (IS_SUPABASE_LIVE) {
      await supabase.auth.signOut();
    }
    sessionStorage.removeItem('ecodrop_user');
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AppContext.Provider value={{
      state,
      dispatch,
      login,
      register,
      loginWithGoogle,
      logout,
      isSupabase: IS_SUPABASE_LIVE,
      queueTransaction,
      getPendingCount,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
