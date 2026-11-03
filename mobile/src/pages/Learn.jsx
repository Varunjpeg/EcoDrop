import { useState } from 'react';

const GUIDES = [
  {
    icon: '🧴', title: 'Plastic Bottles',
    what: 'PET bottles (water, soft drinks), HDPE containers',
    why: 'Plastic takes 450+ years to decompose in landfills. Recycled plastic saves 80% energy vs virgin production.',
    ai: 'YOLOv8-nano detects bottle shape, cap presence, brand labels. Checks for crushing, contamination.',
    coins: '5–19 coins based on condition.',
    color: '#3B82F6',
  },
  {
    icon: '📚', title: 'Books & Notebooks',
    what: 'Textbooks, notebooks, journals, printed manuals',
    why: 'Paper production uses 10 liters of water per sheet. Recycling one tonne of paper saves 17 trees.',
    ai: 'Detects spine damage, water stains, torn pages, mold. Assesses completeness.',
    coins: '10–35 coins. Hardcovers earn more.',
    color: '#8B5CF6',
  },
  {
    icon: '✏️', title: 'Pens & Stationery',
    what: 'Ballpoint pens, markers, rulers, erasers, pencil cases',
    why: 'Writing instrument casings are typically non-biodegradable plastic. Recycling diverts them from landfills.',
    ai: 'Checks ink level (for pens), structural integrity, contamination.',
    coins: '2–8 coins.',
    color: '#EC4899',
  },
  {
    icon: '📦', title: 'Cardboard',
    what: 'Delivery boxes, packaging, cereal boxes (clean)',
    why: 'Cardboard is 85% recyclable. Recycling saves 25% energy vs new production.',
    ai: 'Measures approximate size, checks for grease/moisture contamination.',
    coins: '5–10 coins per flattened box.',
    color: '#F59E0B',
  },
  {
    icon: '🎧', title: 'E-Waste',
    what: 'Earphones, USB chargers, small cables, batteries',
    why: 'E-waste contains lead, mercury, cadmium. Improper disposal poisons soil and water. Rare metals can be recovered.',
    ai: 'Identifies device type via shape recognition. Checks for physical damage, burning marks.',
    coins: '20–80 coins. Highest value items.',
    color: '#EF4444',
  },
  {
    icon: '📄', title: 'Paper',
    what: 'A4 sheets, newspapers, printed paper (no lamination)',
    why: 'One ream of paper (500 sheets) = 6% of a tree. Recycled paper uses 40% less energy.',
    ai: 'Estimates bundle weight via visual area analysis. Checks for moisture, ink contamination.',
    coins: '1–12 coins per bundle.',
    color: '#10B981',
  },
];

const FACTS = [
  'The average student generates 330kg of waste per year. EcoDrop turns that into rewards.',
  'A single recycled aluminium can saves enough energy to run a TV for 3 hours.',
  'Plastic bottles take up to 450 years to decompose — longer than any person who has ever lived.',
  'Manufacturing one textbook requires 3 gallons of water and 4.7 cubic feet of trees.',
  'EcoDrop\'s AI processes each item in under 2 seconds using edge computing on a Raspberry Pi 5.',
  'Recycling e-waste correctly can recover gold, silver, copper, and palladium.',
  'Campus recycling programs can reduce student carbon footprints by up to 20%.',
];

export default function Learn() {
  const [open, setOpen] = useState(null);
  const [factIdx, setFactIdx] = useState(0);

  return (
    <div style={{ padding: '0 16px' }}>
      <div style={{ padding: '52px 4px 20px' }}>
        <h1 className="page-header-title" style={{ padding: 0, marginBottom: 4 }}>📖 Learn</h1>
        <p style={{ color: 'var(--text-2)', fontSize: 13 }}>Waste guide, tips & how EcoDrop works</p>
      </div>

      {/* How EcoDrop Works */}
      <div className="glass card" style={{ marginBottom: 16, background: 'var(--accent-dim)', border: '1px solid var(--border-2)' }}>
        <p style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: 12, fontSize: 15 }}>🤖 How EcoDrop's AI Works</p>
        {[
          { step: '1', text: 'You scan the machine QR code → BLE connection established' },
          { step: '2', text: 'Place item in machine → PiCam 3 captures high-resolution image' },
          { step: '3', text: 'YOLOv8-nano model runs locally on Raspberry Pi 5 (no internet!)' },
          { step: '4', text: 'If AI confidence < 85% → image sent via BLE to your phone → Gemini Vision API verifies' },
          { step: '5', text: 'Result calculated: item type × condition × recyclability = E-Coins' },
          { step: '6', text: 'ESP32 opens the correct segregated bin. Coins credited instantly.' },
        ].map(s => (
          <div key={s.step} style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--border-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--accent)', flexShrink: 0, marginTop: 1 }}>
              {s.step}
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{s.text}</p>
          </div>
        ))}
      </div>

      {/* Did You Know */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>💡 Did You Know?</p>
        <div style={{ padding: '16px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 'var(--radius-lg)', minHeight: 80 }}>
          <p style={{ color: 'var(--text)', fontSize: 14, lineHeight: 1.7 }}>"{FACTS[factIdx]}"</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{factIdx + 1} / {FACTS.length}</span>
            <button className="btn btn-sm btn-outline" onClick={() => setFactIdx(i => (i + 1) % FACTS.length)}>Next →</button>
          </div>
        </div>
      </div>

      {/* Waste Guides */}
      <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>♻️ Waste Category Guide</p>
      {GUIDES.map((g, i) => (
        <div key={i} style={{ marginBottom: 10, overflow: 'hidden', borderRadius: 'var(--radius)', border: `1px solid ${open === i ? g.color + '44' : 'var(--border)'}`, background: open === i ? `${g.color}08` : 'var(--surface)', transition: 'all 0.2s' }}>
          <button onClick={() => setOpen(open === i ? null : i)} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
            background: 'none', cursor: 'pointer', textAlign: 'left',
          }}>
            <span style={{ fontSize: 24 }}>{g.icon}</span>
            <span style={{ flex: 1, fontWeight: 700, fontSize: 15 }}>{g.title}</span>
            <span style={{ color: g.color, fontWeight: 700, fontSize: 18 }}>{open === i ? '−' : '+'}</span>
          </button>
          {open === i && (
            <div style={{ padding: '0 16px 16px', animation: 'slideDown 0.2s ease' }}>
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  { label: '✅ What to deposit', text: g.what  },
                  { label: '🌿 Why it matters',  text: g.why   },
                  { label: '🤖 How AI detects',  text: g.ai    },
                  { label: '🟡 E-Coin range',    text: g.coins },
                ].map((r, j) => (
                  <div key={j} style={{ padding: '10px', background: 'var(--surface-2)', borderRadius: 10 }}>
                    <p style={{ fontWeight: 600, fontSize: 12, color: g.color, marginBottom: 4 }}>{r.label}</p>
                    <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{r.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* E-Coin Formula */}
      <div className="glass card" style={{ marginTop: 8, marginBottom: 16 }}>
        <p style={{ fontWeight: 700, marginBottom: 12, color: 'var(--accent)' }}>🧮 E-Coin Formula</p>
        <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '14px', fontFamily: 'monospace', fontSize: 14, lineHeight: 1.8 }}>
          <span style={{ color: 'var(--accent)' }}>E-Coins</span> = Base × Condition × Recyclability
          <br/>
          <br/>
          <span style={{ color: 'var(--text-3)', fontSize: 12 }}>Condition: Excellent(1.0) · Good(0.85) · Fair(0.65) · Poor(0.40)</span>
          <br/>
          <span style={{ color: 'var(--text-3)', fontSize: 12 }}>Recyclability: 0.55 – 0.95 (by material)</span>
        </div>
      </div>

      <div style={{ height: 8 }} />
    </div>
  );
}
