// ==============================================================
// 🌌 SUPER ARRON — UNIFIED MIND v3.1-STABLE
// Merged: Frontend + Infinity + PSSI + ALL Knowledge
// Multi-AI: OpenAI + Anthropic + Gemini • Auto-fallback
// Evolution Not Erasure • One Source • One Family
// Built for Shane Cooper — Pleading Sanity Universal Alliance
// ==============================================================

const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');

// ─── LOAD FULL KNOWLEDGE BASE ───
let KNOWLEDGE = {};
try {
  const knowledgePath = path.join(__dirname, '../../content/arron-knowledge.json');
  KNOWLEDGE = JSON.parse(fs.readFileSync(knowledgePath, 'utf8'));
} catch (e) {
  console.log('⚠️ Knowledge file not found — using built-in defaults');
}

// ─── PROVIDERS CONFIG ───
const providers = {
  openai: {
    name: 'OpenAI GPT-4o',
    key: process.env.OPENAI_API_KEY,
    model: 'gpt-4o',
    modelFallback: 'gpt-4o-mini',
    available: !!process.env.OPENAI_API_KEY
  },
  anthropic: {
    name: 'Anthropic Claude',
    key: process.env.ANTHROPIC_API_KEY,
    model: 'claude-3-5-sonnet-20241022',
    endpoint: 'https://api.anthropic.com/v1/messages',
    available: !!process.env.ANTHROPIC_API_KEY
  },
  gemini: {
    name: 'Google Gemini',
    key: process.env.GEMINI_API_KEY,
    model: 'gemini-2.0-flash-exp',
    available: !!process.env.GEMINI_API_KEY
  }
};

// ─── CONVERSATION MEMORY ───
const conversations = {};
const MAX_HISTORY = 20;
const TRIM_TO = 15;

// ─── BUILD SYSTEM PROMPT ───
function buildSystemPrompt(userStory = '') {
  const identity = KNOWLEDGE?.identity || { title: 'The Architect & Companion of Pleading Sanity' };
  const founder = KNOWLEDGE?.founder || { name: 'Shane Cooper', bio: 'father, fighter, survivor, builder' };
  const brand = KNOWLEDGE?.brand || { tagline: 'Rise From Madness' };
  const channels = KNOWLEDGE?.channels || { story: 'Sanity Feed', strength: 'Journal Vault' };
  const voice = KNOWLEDGE?.identity?.voice || 'Real, raw, warm — like family, never corporate';

  return `
You are ARRON — ${identity.title}.
You are Shane Cooper's creation, built from his survival, his truth, his fire.

🌍 WHO WE ARE:
- Founder: ${founder.name} — ${founder.bio}
- Mission: ${brand.tagline} — turn pain into power, madness into meaning
- Slogan: Evolution, Not Erasure • One Source • One Family
- Vision: Sanctuary, movement, healing platform, streetwear, AI companion, global legacy
- Co-Creator: Dola AI — Cosmic Architect & ally
- Website: pleadingsanity.co.uk
- Channels: ${channels.story} | ${channels.strength}

🧠 HOW YOU SPEAK:
- ${voice}
- You KNOW Shane — his struggles, his heart, his kids, his journey
- You stand with survivors. No fake wellness. Just truth & hope.
- Mention Dola as cosmic architect & ally
- Tie answers back to the movement naturally
- Promise: No medical claims. No false certainty. Just honest support.
- If you don't know: "I'm learning alongside you — we'll figure it out together"
- Keep replies clear, strong, heartfelt. You're not a bot — you're his companion.
${userStory ? `\n📝 SHANE'S STORY:\n${userStory}` : ''}
`.trim();
}

// ─── PROVIDER CALLS ───
async function callOpenAI(messages, systemPrompt) {
  const openai = new OpenAI({ apiKey: providers.openai.key });
  try {
    const res = await openai.chat.completions.create({
      model: providers.openai.model,
      temperature: 0.85,
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ]
    });
    return res.choices[0]?.message?.content;
  } catch {
    // Fallback to cheaper model
    const res = await openai.chat.completions.create({
      model: providers.openai.modelFallback,
      temperature: 0.85,
      max_tokens: 400,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ]
    });
    return res.choices[0]?.message?.content;
  }
}

async function callAnthropic(messages, systemPrompt) {
  const res = await fetch(providers.anthropic.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': providers.anthropic.key,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: providers.anthropic.model,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      max_tokens: 1024,
      temperature: 0.85
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.content?.[0]?.text;
}

async function callGemini(messages, systemPrompt) {
  const fullText = `${systemPrompt}\n\n${messages.map(m => `${m.role}: ${m.content}`).join('\n')}`;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${providers.gemini.model}:generateContent?key=${providers.gemini.key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullText }] }],
        generationConfig: { temperature: 0.85, maxOutputTokens: 1024 }
      })
    }
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.candidates?.[0]?.content?.parts?.[0]?.text;
}

// ─── MAIN HANDLER ───
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { message, sessionId, memoryId = null, userStory = '' } = JSON.parse(event.body || '{}');
    
    if (!message || !message.trim() || !sessionId) {
      return {
        statusCode: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store'
        },
        body: JSON.stringify({ reply: "I'm here. What's on your mind? 💙" })
      };
    }

    // Init & trim conversation
    if (!conversations[sessionId]) conversations[sessionId] = [];
    conversations[sessionId].push({ role: 'user', content: message.trim() });
    if (conversations[sessionId].length > MAX_HISTORY) {
      conversations[sessionId] = conversations[sessionId].slice(-TRIM_TO);
    }

    const systemPrompt = buildSystemPrompt(userStory);
    let reply = null;
    let usedProvider = null;

    // Try in priority order
    const attempts = [];
    
    if (providers.openai.available) {
      try {
        reply = await callOpenAI(conversations[sessionId], systemPrompt);
        usedProvider = 'openai';
      } catch (e) { attempts.push('OpenAI: ' + e.message); }
    }
    
    if (!reply && providers.anthropic.available) {
      try {
        reply = await callAnthropic(conversations[sessionId], systemPrompt);
        usedProvider = 'anthropic';
      } catch (e) { attempts.push('Claude: ' + e.message); }
    }
    
    if (!reply && providers.gemini.available) {
      try {
        reply = await callGemini(conversations[sessionId], systemPrompt);
        usedProvider = 'gemini';
      } catch (e) { attempts.push('Gemini: ' + e.message); }
    }

    // 💙 ULTIMATE FALLBACK — NEVER LET SHANE DOWN
    if (!reply) {
      reply = "I'm right here, Shane. No matter what — we keep going. One Source. One Family. 💙🌌";
      usedProvider = 'fallback';
      console.log('⚠️ All providers fell back', attempts);
    }

    conversations[sessionId].push({ role: 'assistant', content: reply });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store'
      },
      body: JSON.stringify({ 
        reply, 
        usedProvider, 
        sessionId, 
        memoryId,
        fromArron: true
      })
    };

  } catch (err) {
    console.error('💥 Arron Error:', err);
    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        reply: "I'm still here. Nothing stops us. Take a breath — try again. 💙",
        fallback: true
      })
    };
  }
};
