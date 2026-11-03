/**
 * EcoDrop-CA — Offline Sync Service
 * ===================================
 * When the phone is on the Pi's WiFi hotspot, it has no internet,
 * so Supabase calls fail. This service:
 *
 *  1. Saves pending transactions to localStorage immediately
 *  2. Tries to flush them to Supabase whenever internet comes back
 *  3. Runs automatically on app startup and on network reconnect
 *
 * This makes the wallet/coins work 100% offline during a deposit
 * and syncs silently in the background when the user walks away
 * from the machine and rejoins their own WiFi / cellular.
 */

import { supabase } from '../supabase';

const QUEUE_KEY = 'ecodrop_pending_txns';

// ── Save a transaction to the offline queue ──────────────────────────
export function queueTransaction(txn) {
  const queue = getQueue();
  queue.push({ ...txn, queuedAt: new Date().toISOString() });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  console.log('[Sync] Queued transaction offline:', txn.id);
}

// ── Get the current offline queue ────────────────────────────────────
export function getQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function getPendingCount() {
  return getQueue().length;
}

// ── Try to flush pending transactions to Supabase ────────────────────
export async function flushQueue(userId) {
  if (!userId) return 0;

  const queue = getQueue();
  if (queue.length === 0) return 0;

  // Quick internet check
  if (!navigator.onLine) {
    console.log('[Sync] Offline — queue flush skipped');
    return 0;
  }

  let synced = 0;
  const remaining = [];

  for (const txn of queue) {
    try {
      // Push transaction to Supabase
      const { error: txnErr } = await supabase.from('transactions').insert({
        user_id:        userId,
        machine_id:     txn.machine || 'MACH_001',
        item_type:      txn.item,
        item_condition: txn.condition,
        coins_earned:   txn.coins,
        co2_saved_kg:   txn.co2 || 0,
        ai_confidence:  txn.confidence || 0,
        ai_model_used:  txn.model || 'yolov8-nano',
        created_at:     txn.date,
      });

      if (txnErr) throw txnErr;

      // Update user's coin balance in Supabase
      const { error: balErr } = await supabase.rpc('increment_coins', {
        user_id_input:  userId,
        coins_to_add:   txn.coins,
        items_to_add:   1,
        co2_to_add:     txn.co2 || 0,
      });

      // If RPC doesn't exist, fallback to manual update
      if (balErr) {
        await supabase
          .from('profiles')
          .update({
            coins_balance: supabase.rpc('coalesce_coins', {}), // fallback
          })
          .eq('id', userId);
      }

      synced++;
      console.log(`[Sync] Flushed txn ${txn.id} to Supabase ✅`);

    } catch (err) {
      console.warn(`[Sync] Failed to flush txn ${txn.id}:`, err.message);
      remaining.push(txn); // keep it in queue for next attempt
    }
  }

  // Save remaining (failed) back to queue
  localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));

  if (synced > 0) {
    console.log(`[Sync] Flushed ${synced} transaction(s) to Supabase`);
  }

  return synced;
}

// ── Auto-sync when internet comes back ───────────────────────────────
export function startAutoSync(getUserId) {
  // Try to flush immediately on call
  const uid = getUserId();
  if (uid) flushQueue(uid);

  // Listen for network reconnection
  const onOnline = () => {
    const uid = getUserId();
    if (uid && getPendingCount() > 0) {
      console.log('[Sync] Network restored — flushing queue...');
      flushQueue(uid);
    }
  };

  window.addEventListener('online', onOnline);

  // Also try every 60 seconds when online (belt-and-suspenders)
  const interval = setInterval(() => {
    if (navigator.onLine) {
      const uid = getUserId();
      if (uid && getPendingCount() > 0) {
        flushQueue(uid);
      }
    }
  }, 60_000);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', onOnline);
    clearInterval(interval);
  };
}
