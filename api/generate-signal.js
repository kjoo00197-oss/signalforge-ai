import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const CATEGORIES = ['FX', 'Crypto', 'Perpetuals'];
const PAIRS = {
  FX: [{ pair: 'EUR/USD', base: 1.0850, leverage: 1 }, { pair: 'GBP/JPY', base: 191.50, leverage: 1 }],
  Crypto: [{ pair: 'BTC/USDT', base: 67320, leverage: 1 }, { pair: 'ETH/USDT', base: 2580, leverage: 1 }],
  Perpetuals: [{ pair: 'BTC/USDT-PERP', base: 67320, leverage: 20 }, { pair: 'SOL/USDT-PERP', base: 148, leverage: 15 }]
};

export default async function handler(req, res) {
  const userId = req.headers['x-user-id'] || 'anonymous';
  const isPremium = req.query.premium === 'true';
  const today = new Date().toISOString().split('T')[0];

  try {
    if (isPremium) {
      const category = CATEGORIES[Math.floor(Math.random() * 3)];
      const pair = PAIRS[category][Math.floor(Math.random() * PAIRS[category].length)];
      const signal = await generateSignal(pair, category);
      signal.message = `Premium • ${category}`;
      return res.status(200).json(signal);
    }

    // Check today's usage
    const { data: row } = await supabase
      .from('signals_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    const used = row || { fx_used: 0, crypto_used: 0, perps_used: 0 };

    let availableCat = null;
    if (used.fx_used < 2) availableCat = 'FX';
    else if (used.crypto_used < 2) availableCat = 'Crypto';
    else if (used.perps_used < 2) availableCat = 'Perpetuals';

    if (!availableCat) {
      return res.status(200).json({
        message: "All 6 FREE signals used today!",
        breakdown: `FX: ${used.fx_used}/2 | Crypto: ${used.crypto_used}/2 | Perps: ${used.perps_used}/2`,
        free: false
      });
    }

    const pair = PAIRS[availableCat][used[`${availableCat.toLowerCase()}_used`] % PAIRS[availableCat].length];
    const signal = await generateSignal(pair, availableCat);

    // Update usage
    const field = `${availableCat.toLowerCase()}_used`;
    await supabase.from('signals_usage').upsert({
      user_id: userId,
      date: today,
      [field]: used[field] + 1
    });

    signal.message = `Free ${used[field] + 1}/2 • ${availableCat}`;
    res.status(200).json(signal);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function generateSignal(pair, category) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const entry = (pair.base * (1 + (Math.random() - 0.5) * 0.006)).toFixed(category === 'FX' ? 5 : 2);

  const prompt = `Generate ONE high-probability ${category} signal for ${pair.pair} in valid JSON only:
{
  "pair": "${pair.pair}",
  "type": "${category}",
  "direction": "${Math.random() > 0.5 ? 'LONG' : 'SHORT'}",
  "entry": "${entry}",
  "tp": "+${category === 'Perpetuals' ? '2.5' : '1.8'}%",
  "sl": "-${category === 'Perpetuals' ? '1.2' : '0.9'}%",
  "leverage": ${pair.leverage},
  "confidence": "${82 + Math.floor(Math.random() * 9)}%",
  "expires_in": "30 minutes"
}`;
  const result = await model.generateContent(prompt);
  const text = result.response.text().replace(/```json|```/g, '').trim();
  return JSON.parse(text);
}
