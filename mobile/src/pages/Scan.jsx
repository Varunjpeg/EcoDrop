/**
 * EcoDrop-CA — Scan Page (Final Production Version)
 * ===================================================
 * Transport: Direct WiFi to Pi's hotspot (replaces BLE, same architecture)
 * 
 * Flow:
 *  Step 0 — Connect to Machine (enter/scan Machine ID, checks Pi is reachable)
 *  Step 1 — Place Item in front of PiCam v2
 *  Step 2 — Pi captures + runs YOLOv11 (edge AI, <1s) + Gemini if needed
 *  Step 3 — Result: item, condition, coins
 *  Step 4 — Success + confetti (transaction queued offline, syncs to Supabase later)
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import toast from 'react-hot-toast';
import Confetti from 'react-confetti';
import { queueTransaction } from '../services/syncService';
import { classifyWithGemini } from '../services/geminiService';

// ── Pi URL auto-detection ─────────────────────────────────────────────
// When phone is on Pi's hotspot, Pi is always at 10.42.0.1
// When testing on localhost, Pi mock server is at localhost:8000
const PI_URL = (() => {
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:8000';
  if (host === '10.42.0.1') return 'http://10.42.0.1:8000'; // already on Pi's page
  return `http://${host}:8000`; // Pi serving the app itself
})();

const STEPS = ['Connect', 'Place Item', 'AI Analysis', 'Result', 'Done'];

const ITEM_ICONS = {
  plastic_bottle: '🍶', notebook: '📓', pen: '🖊️', cardboard: '📦',
  mouse: '🖱️', mobile_phone: '📱',
};

// ── Step Indicator ────────────────────────────────────────────────────
function StepDots({ current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0 16px' }}>
      {STEPS.map((label, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
          <div title={label} style={{
            width: i === current ? 30 : 22, height: i === current ? 30 : 22,
            borderRadius: '50%', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, transition: 'all 0.3s',
            background: i < current ? 'var(--accent)' : i === current ? 'var(--accent-dim)' : 'var(--surface-2)',
            border: i === current ? '2px solid var(--accent)' : i < current ? 'none' : '1px solid var(--border)',
            color: i < current ? '#fff' : i === current ? 'var(--accent)' : 'var(--text-3)',
          }}>
            {i < current ? '✓' : i + 1}
          </div>
          {i < STEPS.length - 1 && (
            <div style={{ width: 12, height: 2, background: i < current ? 'var(--accent)' : 'var(--border)', transition: 'background 0.3s' }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Step 0: Connect ───────────────────────────────────────────────────
function StepConnect({ onConnected }) {
  const [machineId, setMachineId] = useState('MACH_001');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [cameraOn, setCameraOn] = useState(false);
  const qrRef = useRef(null);

  useEffect(() => () => stopCamera(), []);

  async function startCamera() {
    setCameraOn(true);
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      qrRef.current = new Html5Qrcode('qr-box');
      await qrRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 200, height: 200 } },
        (text) => {
          stopCamera();
          // QR contains: ECODROP:MACH_001 or just MACH_001
          const id = text.replace('ECODROP:', '').trim().toUpperCase();
          setMachineId(id);
          toast.success(`QR Scanned: ${id}`);
        },
        () => {}
      );
    } catch (e) {
      setCameraOn(false);
      toast.error('Camera not available');
    }
  }

  async function stopCamera() {
    if (qrRef.current) {
      try { await qrRef.current.stop(); } catch {}
      qrRef.current = null;
    }
    setCameraOn(false);
  }

  async function connect() {
    setError('');
    setChecking(true);
    try {
      const res = await fetch(`${PI_URL}/health`, { signal: AbortSignal.timeout(5000) });
      const data = await res.json();
      if (data.status === 'ok') {
        // Start session
        const s = await fetch(`${PI_URL}/session/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ machine_id: machineId }),
        });
        const session = await s.json();
        toast.success(`Connected to ${machineId} ✅`);
        onConnected(machineId, session.session_id);
      }
    } catch (err) {
      setError(`Cannot reach Pi at ${PI_URL}.\nMake sure you are connected to "EcoDrop-Machine" WiFi and the Pi server is running.`);
    }
    setChecking(false);
  }

  return (
    <div className="anim-slide-up" style={{ padding: '0 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 56, marginBottom: 8 }}>🔗</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
          Connect to Machine
        </h2>
        <p style={{ color: 'var(--text-2)', fontSize: 13, lineHeight: 1.5 }}>
          Make sure your phone's WiFi is connected to{' '}
          <b style={{ color: 'var(--accent)' }}>EcoDrop-Machine</b>
        </p>
      </div>

      {/* WiFi check tip */}
      <div style={{ padding: '10px 14px', background: 'var(--accent-dim)', borderRadius: 12, marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 18 }}>📶</span>
        <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
          Go to <b>Phone Settings → WiFi → EcoDrop-Machine</b> (password: ecodrop123),
          then come back here and tap Connect.
        </p>
      </div>

      {/* QR Scanner */}
      <div id="qr-box" style={{ display: cameraOn ? 'block' : 'none', width: '100%', maxWidth: 280, margin: '0 auto 12px', borderRadius: 14, overflow: 'hidden' }} />

      {!cameraOn ? (
        <button className="btn btn-outline btn-full" onClick={startCamera} style={{ marginBottom: 10, padding: '12px' }}>
          📷 Scan QR Code on Machine
        </button>
      ) : (
        <button className="btn btn-outline btn-full" onClick={stopCamera} style={{ marginBottom: 10, padding: '12px', borderColor: '#EF4444', color: '#EF4444' }}>
          ✕ Stop Camera
        </button>
      )}

      {/* Manual ID */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input className="input-plain" value={machineId}
          onChange={e => setMachineId(e.target.value.toUpperCase())}
          placeholder="MACH_001" style={{ flex: 1, fontWeight: 700, textAlign: 'center' }} />
        <button className="btn btn-accent" onClick={connect} disabled={!machineId || checking}
          style={{ padding: '0 20px', fontWeight: 700 }}>
          {checking ? '...' : 'Connect'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 14px', background: '#FEF2F2', borderRadius: 12, border: '1px solid #FECACA' }}>
          <p style={{ color: '#DC2626', fontSize: 12, whiteSpace: 'pre-line' }}>{error}</p>
        </div>
      )}
    </div>
  );
}

// ── Step 1: Place Item ────────────────────────────────────────────────
function StepPlace({ onCapture }) {
  const [countdown, setCountdown] = useState(10);
  const [imgSrc, setImgSrc]       = useState(`${PI_URL}/preview.jpg?t=0`);
  const [camOk, setCamOk]         = useState(true);
  const fired     = useRef(false);
  const timerRef  = useRef(null);
  const refreshRef = useRef(null);

  useEffect(() => {
    // Countdown auto-capture
    timerRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(timerRef.current); doCapture(); return 0; }
        return c - 1;
      });
    }, 1000);

    // Poll /preview.jpg every 500ms — shows live PiCam feed
    refreshRef.current = setInterval(() => {
      setImgSrc(`${PI_URL}/preview.jpg?t=${Date.now()}`);
    }, 500);

    return () => {
      clearInterval(timerRef.current);
      clearInterval(refreshRef.current);
    };
  }, []);

  function doCapture() {
    if (fired.current) return;
    fired.current = true;
    clearInterval(timerRef.current);
    clearInterval(refreshRef.current);
    onCapture();
  }

  return (
    <div className="anim-slide-up" style={{ padding: '0 20px', textAlign: 'center' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
        Place Item in Front of Camera
      </h2>
      <p style={{ color: 'var(--text-2)', fontSize: 13, marginBottom: 14 }}>
        Hold item steady in front of PiCam v2
      </p>

      {/* Live PiCam Preview */}
      <div style={{
        width: '100%', maxWidth: 320, margin: '0 auto 16px',
        borderRadius: 14, overflow: 'hidden',
        background: '#0a0a0a', border: '2px solid #1f1f1f',
        position: 'relative', aspectRatio: '4/3',
        minHeight: 180,
      }}>
        {camOk ? (
          <img
            src={imgSrc}
            alt="Live PiCam feed"
            onError={() => setCamOk(false)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: '100%', minHeight: 180 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🎥</div>
            <p style={{ color: '#555', fontSize: 12, fontWeight: 700 }}>PiCam v2</p>
            <p style={{ color: '#333', fontSize: 10, marginTop: 2 }}>Preview not available in mock mode</p>
          </div>
        )}
        {/* LIVE badge */}
        {camOk && (
          <div style={{
            position: 'absolute', top: 8, left: 8,
            background: '#EF4444', color: '#fff',
            fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 20,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff',
              animation: 'pulse 1s ease-in-out infinite', display: 'inline-block' }} />
            LIVE
          </div>
        )}
        {/* Countdown overlay */}
        <div style={{
          position: 'absolute', bottom: 8, right: 8,
          width: 38, height: 38, borderRadius: '50%',
          background: 'rgba(0,0,0,0.65)', border: '2px solid var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--accent)',
        }}>
          {countdown}
        </div>
      </div>

      <p style={{ color: 'var(--text-3)', fontSize: 12, marginBottom: 14 }}>
        Auto-capture in <b style={{ color: 'var(--accent)' }}>{countdown}s</b> — or tap below
      </p>

      <button className="btn btn-accent btn-full" onClick={doCapture}
        style={{ padding: 15, fontWeight: 700, fontSize: 16 }}>
        📸 Capture Now
      </button>
    </div>
  );
}

// ── Step 2: AI Analysis (with phone-bridge Gemini fallback) ───────────
function StepAnalysis({ sessionId, setResult, onError }) {
  const [phases, setPhases] = useState([
    { label: 'PiCam v2 capturing image...', done: false, active: true },
    { label: 'YOLOv11 running on Pi (edge AI)...', done: false, active: false },
    { label: 'Confidence check...', done: false, active: false },
    { label: 'Calculating E-Coins...', done: false, active: false },
  ]);
  const [cloudMsg, setCloudMsg] = useState('');
  const [usingGemini, setUsingGemini] = useState(false);

  function advance(idx) {
    setPhases(prev => prev.map((p, i) => ({
      ...p, done: i < idx, active: i === idx,
    })));
  }

  useEffect(() => {
    let cancelled = false;
    async function analyze() {
      try {
        advance(0);
        await new Promise(r => setTimeout(r, 700));
        advance(1);

        // Ask Pi to capture + run YOLOv11
        const res = await fetch(`${PI_URL}/session/${sessionId}/item-detected`, {
          method: 'POST', signal: AbortSignal.timeout(30_000),
        });
        if (!res.ok) throw new Error(`Pi error: ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        if (!data.result) throw new Error('No result from Pi');

        const r = data.result;
        advance(2); // confidence check

        if (r.needs_cloud) {
          // ── LOW CONFIDENCE: phone calls Gemini via cellular ──────
          setUsingGemini(true);
          setCloudMsg('Sending image to Gemini via your mobile data (~100KB)...');
          toast('Low confidence — using Gemini via your cellular (~100KB)', { icon: '⚡', duration: 4000 });

          let cloudResult;
          try {
            cloudResult = await classifyWithGemini(r.image_b64);
            setCloudMsg('Gemini identified item — sending result back to Pi...');
          } catch (geminiErr) {
            // Log the error so we can debug
            console.error('Gemini failed:', geminiErr?.message || geminiErr);
            setCloudMsg('Gemini unavailable — Pi YOLO result used (may be inaccurate)');
            // Do NOT use r.item_type here — Pi sends a placeholder (first class).
            // Send a sentinel so Pi knows Gemini failed; Pi will keep whatever YOLO detected.
            cloudResult = { item_type: r.item_type, condition: r.condition || 'good', confidence: 0.0 };
          }

          // Phone sends Gemini result back to Pi → Pi recalculates coins
          const cr = await fetch(`${PI_URL}/session/${sessionId}/cloud-result`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cloudResult), signal: AbortSignal.timeout(10_000),
          });
          if (!cr.ok) throw new Error(`cloud-result error: ${cr.status}`);
          const cdData = await cr.json();
          if (cancelled) return;

          advance(3);
          await new Promise(re => setTimeout(re, 500));
          const f = cdData.result;
          setResult({
            type: f.item_type, label: f.display || f.item_type, condition: f.condition,
            baseCoins: f.base_coins, condMult: f.condition_multiplier, recycle: f.recyclability_factor,
            coins: f.calculated_coins, co2: parseFloat(f.co2_kg || 0.1),
            confidence: Math.round((f.confidence || 0.9) * 100),
            model: 'gemini-3.5-flash-lite', needs_cloud: true,
          });

        } else {
          // ── HIGH CONFIDENCE: 100% local, zero internet ───────────
          advance(3);
          await new Promise(re => setTimeout(re, 500));
          setResult({
            type: r.item_type, label: r.display || r.item_type, condition: r.condition,
            baseCoins: r.base_coins, condMult: r.condition_multiplier, recycle: r.recyclability_factor,
            coins: r.calculated_coins, co2: parseFloat(r.co2_kg || 0.1),
            confidence: Math.round((r.confidence || 0.9) * 100),
            model: r.model_used || 'custom-yolov11', needs_cloud: false,
          });
        }
      } catch (err) {
        if (!cancelled) onError(err.message);
      }
    }
    analyze();
    return () => { cancelled = true; };
  }, [sessionId]);

  return (
    <div className="anim-slide-up" style={{ padding: '0 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 52, marginBottom: 16, animation: 'spin 2s linear infinite' }}>🧠</div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
        {usingGemini ? 'Gemini AI (via your phone)' : 'Edge AI (YOLOv11 on Pi)'}
      </h2>
      <p style={{ color: 'var(--text-2)', fontSize: 13, marginBottom: 20 }}>
        {usingGemini ? 'Using ~100KB of your cellular data for higher accuracy' : '100% offline — no internet needed'}
      </p>
      <div className="card" style={{ textAlign: 'left', marginBottom: 12 }}>
        {phases.map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < phases.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11,
              background: p.done ? '#D1FAE5' : p.active ? 'var(--accent-dim)' : 'var(--surface-2)',
              border: `1px solid ${p.done ? '#10B981' : p.active ? 'var(--accent)' : 'var(--border)'}`,
              color: p.done ? '#059669' : p.active ? 'var(--accent)' : 'var(--text-3)',
            }}>
              {p.done ? '✓' : p.active ? <span style={{ fontSize: 7, animation: 'pulse 0.8s infinite' }}>●●●</span> : ''}
            </div>
            <span style={{ fontSize: 13, color: p.done || p.active ? 'var(--text)' : 'var(--text-3)', fontWeight: p.active ? 600 : 400 }}>{p.label}</span>
          </div>
        ))}
      </div>
      {usingGemini && cloudMsg && (
        <div style={{ padding: '10px 14px', borderRadius: 12, textAlign: 'left', background: '#FEF3C7', border: '1px solid #FCD34D' }}>
          <p style={{ fontSize: 12, color: '#92400E', fontWeight: 600 }}>⚡ Gemini Fallback Active</p>
          <p style={{ fontSize: 11, color: '#78350F', marginTop: 2 }}>{cloudMsg}</p>
        </div>
      )}
    </div>
  );
}

// ── Step 3: Result ────────────────────────────────────────────────────
function StepResult({ result, onConfirm, onReject }) {
  if (!result) return null;
  const icon = ITEM_ICONS[result.type] || '♻️';
  const condColors = { excellent: '#10B981', good: '#3B82F6', fair: '#F59E0B', poor: '#EF4444' };
  const cc = condColors[result.condition] || 'var(--accent)';

  return (
    <div className="anim-slide-up" style={{ padding: '0 20px' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, textAlign: 'center', marginBottom: 4 }}>
        Item Identified! 🎯
      </h2>
      <p style={{ color: 'var(--text-2)', fontSize: 13, textAlign: 'center', marginBottom: 16 }}>
        Confirm to deposit and earn E-Coins
      </p>

      <div className="card" style={{ marginBottom: 14 }}>
        {/* Item header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{ width: 60, height: 60, borderRadius: 14, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
            {icon}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{result.label}</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span className="badge" style={{ background: cc + '22', color: cc, border: `1px solid ${cc}44`, fontSize: 11 }}>
                ● {result.condition}
              </span>
              <span className="badge badge-accent" style={{ fontSize: 10 }}>
                🤖 {result.confidence}% · {result.model}
              </span>
              {result.needs_cloud && (
                <span className="badge" style={{ background: '#FEF3C7', color: '#92400E', fontSize: 10 }}>
                  ⚡ Gemini used
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Coin breakdown */}
        <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: 14, marginBottom: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-3)', marginBottom: 10 }}>E-COIN CALCULATION</p>
          {[
            { l: 'Base Value',                    v: `${result.baseCoins} coins` },
            { l: `Condition (${result.condition})`, v: `×${result.condMult}` },
            { l: 'Recyclability Factor',           v: `×${result.recycle}` },
          ].map((row, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{row.l}</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{row.v}</span>
            </div>
          ))}
          <div style={{ height: 1, background: 'var(--border)', margin: '10px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700 }}>You Earn</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 800, color: 'var(--accent)' }}>
              🟡 {result.coins}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="badge badge-green" style={{ fontSize: 10 }}>🌿 ~{result.co2}kg CO₂ saved</span>
          <span style={{ fontSize: 10, color: 'var(--text-3)' }}>PiCam v2 · Edge AI · Pi 5</span>
        </div>
      </div>

      <button className="btn btn-accent btn-full" onClick={onConfirm} style={{ padding: 16, fontWeight: 800, fontSize: 16, marginBottom: 10 }}>
        ✅ Confirm & Deposit
      </button>
      <button className="btn btn-outline btn-full" onClick={onReject} style={{ padding: 13 }}>
        ✕ Cancel
      </button>
    </div>
  );
}

// ── Step 4: Done ──────────────────────────────────────────────────────
function StepDone({ result, pendingSync }) {
  const navigate = useNavigate();
  const [boom, setBoom] = useState(true);
  useEffect(() => { const t = setTimeout(() => setBoom(false), 5000); return () => clearTimeout(t); }, []);

  return (
    <div className="anim-slide-up" style={{ padding: '0 20px', textAlign: 'center' }}>
      {boom && <Confetti recycle={false} numberOfPieces={250} colors={['#059669','#10B981','#F59E0B','#3B82F6']} style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999, pointerEvents: 'none' }} />}

      <div style={{ fontSize: 88, marginBottom: 8 }}>🎉</div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--accent)', marginBottom: 4 }}>
        Deposited!
      </h2>
      <p style={{ color: 'var(--text-2)', marginBottom: 24 }}>Your item has been accepted. Great job recycling! 🌿</p>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 56, fontWeight: 800, color: 'var(--accent)', marginBottom: 8 }}>
          +{result?.coins} 🟡
        </div>
        <p style={{ color: 'var(--text-2)', marginBottom: 16 }}>E-Coins added to your wallet</p>

        {pendingSync && (
          <div style={{ padding: '8px 12px', background: '#FEF3C7', borderRadius: 10, marginBottom: 8 }}>
            <p style={{ fontSize: 11, color: '#92400E' }}>
              ⏳ Wallet will sync to server when you rejoin your regular WiFi/mobile data
            </p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr' }}>
          <div>
            <p style={{ fontSize: 22, fontWeight: 800 }}>{result?.coins} coins</p>
            <p style={{ fontSize: 11, color: 'var(--text-3)' }}>Just Earned</p>
          </div>
          <div style={{ background: 'var(--border)' }} />
          <div>
            <p style={{ fontSize: 22, fontWeight: 800, color: '#10B981' }}>~{result?.co2}kg</p>
            <p style={{ fontSize: 11, color: 'var(--text-3)' }}>CO₂ Saved</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-outline" style={{ flex: 1, padding: 13 }}
          onClick={() => toast('Impact shared! 🌍', { icon: '🌿' })}>
          🌍 Share
        </button>
        <button className="btn btn-primary" style={{ flex: 1, padding: 13 }}
          onClick={() => navigate('/')}>
          Done ✓
        </button>
      </div>
    </div>
  );
}

// ── Main Orchestrator ─────────────────────────────────────────────────
export default function Scan() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();

  const [step,       setStep]       = useState(0);
  const [machineId,  setMachineId]  = useState('');
  const [sessionId,  setSessionId]  = useState('');
  const [result,     setResult]     = useState(null);
  const [pendingSync, setPendingSync] = useState(false);

  const handleConnected = (mid, sid) => {
    setMachineId(mid);
    setSessionId(sid);
    setStep(1);
  };

  const handleResultReady = (r) => {
    setResult(r);
    setStep(3);
  };

  const handleConfirm = async () => {
    // 1. Confirm on Pi
    await fetch(`${PI_URL}/session/${sessionId}/confirm`, { method: 'POST' }).catch(() => {});

    // 2. Update local state immediately (optimistic — always works offline)
    const txn = {
      id:         't' + Date.now(),
      type:       'earn',
      item:       result.type,
      condition:  result.condition,
      coins:      result.coins,
      co2:        result.co2,
      date:       new Date().toISOString(),
      machine:    machineId,
      confidence: result.confidence,
      model:      result.model,
    };
    dispatch({ type: 'ADD_TRANSACTION', payload: txn });

    // 3. Try Supabase now; if offline, queue for later
    if (state.user?.id) {
      try {
        const { error } = await Promise.race([
          fetch(`${window.location.origin}/health`).then(() => ({ error: null })),
          new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 2000)),
        ]);
        // If we reach here internet exists — syncService will handle it via startAutoSync
      } catch {
        // No internet (on Pi's hotspot) — queue it
        queueTransaction({ ...txn, userId: state.user.id });
        setPendingSync(true);
      }
    }

    toast.success(`+${result.coins} E-Coins earned! 🟡`);
    setStep(4);
  };

  const handleReject = async () => {
    await fetch(`${PI_URL}/session/${sessionId}/reject`, { method: 'POST' }).catch(() => {});
    toast('Cancelled.', { icon: '✕' });
    navigate('/');
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ padding: '52px 20px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <button onClick={() => step > 0 && step < 4 ? setStep(s => s - 1) : navigate('/')}
            style={{ color: 'var(--text-2)', padding: '8px 12px', fontSize: 18, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            ←
          </button>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>
            {STEPS[step]}
          </h1>
        </div>
        <StepDots current={step} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '8px 0 40px', overflowY: 'auto' }}>
        {step === 0 && <StepConnect onConnected={handleConnected} />}
        {step === 1 && <StepPlace onCapture={() => setStep(2)} />}
        {step === 2 && (
          <StepAnalysis
            sessionId={sessionId}
            setResult={handleResultReady}
            onError={(e) => { toast.error(`AI Error: ${e}`); setStep(1); }}
          />
        )}
        {step === 3 && <StepResult result={result} onConfirm={handleConfirm} onReject={handleReject} />}
        {step === 4 && <StepDone result={result} pendingSync={pendingSync} />}
      </div>
    </div>
  );
}
