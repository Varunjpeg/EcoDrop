/**
 * EcoDrop-CA — Gemini Service (Phone Side)
 * ==========================================
 * Called ONLY when Pi's YOLOv11 confidence < 50%.
 * Phone calls Gemini API via its own cellular data.
 * Pi has zero internet — phone is the bridge.
 *
 * Data used per call: ~100 KB (less than loading one photo)
 */

const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY || '';
const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/` +
  `models/gemini-3.5-flash-lite:generateContent?key=${GEMINI_KEY}`;

const PROMPT = `You are a waste classification AI for a campus recycling machine.
Look at this image carefully and identify the recyclable item being shown.

Reply ONLY with valid JSON — no markdown, no explanation, just raw JSON:
{"item_type":"<category>","condition":"<condition>","confidence":0.95}

ITEM CATEGORIES (pick the single closest match):
  pen           → Pen, marker, pencil, any writing instrument
  notebook      → Notebook, book, textbook, register, any bound paper book
  cardboard     → Cardboard box, carton, packaging box
  plastic_bottle → Water bottle, plastic bottle, any plastic drink bottle
  mouse         → Computer mouse, optical mouse, wireless mouse
  mobile_phone  → Smartphone, mobile phone, cell phone, any handheld phone

If unsure or none matches, pick the single closest one from the list above.

CONDITION:
- excellent: like new, clean, fully intact
- good: minor wear or scratches, still usable
- fair: visible damage, cracks, or heavy use
- poor: broken, heavily damaged

confidence: your certainty from 0.0 to 1.0`;

/**
 * Classify an image using Gemini Vision via phone's cellular internet.
 * @param {string} imageBase64 - Base64-encoded JPEG from Pi
 * @returns {Promise<{item_type, condition, confidence}>}
 */
export async function classifyWithGemini(imageBase64) {
  if (!GEMINI_KEY) {
    throw new Error('VITE_GEMINI_KEY not set in environment');
  }

  if (!imageBase64 || imageBase64 === 'mock_base64_image_data') {
    // Mock mode — return random result
    const items = ['plastic_bottle','notebook','pen','cardboard','mouse','mobile_phone'];
    return {
      item_type:  items[Math.floor(Math.random() * items.length)],
      condition:  'good',
      confidence: 0.91,
    };
  }

  const payload = {
    contents: [{
      parts: [
        { text: PROMPT },
        { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } },
      ],
    }],
    generationConfig: {
      temperature:     0.1,
      maxOutputTokens: 128,
    },
  };

  const response = await fetch(GEMINI_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
    // 20-second timeout
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  let text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

  // Strip markdown code fences if present
  if (text.includes('```')) {
    text = text.split('```')[1]?.replace(/^json\s*/i, '').trim() || text;
  }

  const result = JSON.parse(text);

  // Validate
  const validItems = ['pen', 'notebook', 'cardboard', 'plastic_bottle', 'mouse', 'mobile_phone'];
  if (!validItems.includes(result.item_type)) {
    // Map any old/legacy class names to the closest new class
    const legacyMap = {
      textbook: 'notebook', paper_bundle: 'notebook', newspaper: 'notebook',
      plastic_bag: 'plastic_bottle',
      charger: 'mobile_phone', earphones: 'mobile_phone', wire_cable: 'mobile_phone',
      keyboard: 'mouse', watch: 'mobile_phone', battery: 'mobile_phone',
      electronic_other: 'mobile_phone',
      metal_can: 'cardboard', metal_object: 'cardboard',
      cloth_fabric: 'cardboard',
      eraser: 'pen', ruler: 'pen',
    };
    result.item_type = legacyMap[result.item_type] || 'plastic_bottle';
  }
  const validConds = ['excellent','good','fair','poor'];
  if (!validConds.includes(result.condition)) {
    result.condition = 'fair';
  }
  result.confidence = Math.min(Math.max(parseFloat(result.confidence) || 0.9, 0), 1);

  return result;
}
