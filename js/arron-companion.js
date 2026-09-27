(function() {
  'use strict';

  const conversationBox = document.getElementById('arron-conversation');
  const inputForm = document.getElementById('arron-input-form');
  const inputField = document.getElementById('arron-input');
  const sendButton = inputForm?.querySelector('button[type="submit"]');
  const promptButtons = document.querySelectorAll('.prompt-btn');
  const statusEl = document.getElementById('arron-status');
  const storyForm = document.getElementById('arron-story-form');
  const storyField = document.getElementById('arron-story');
  const memoryCodeEl = document.getElementById('arron-memory-code');
  const copyCodeBtn = document.getElementById('arron-copy-code');
  const restoreForm = document.getElementById('arron-restore-form');
  const restoreField = document.getElementById('arron-restore-code');
  const forgetBtn = document.getElementById('arron-forget');

  if (!conversationBox) return;

  const API = '/.netlify/functions/arron';
  const ID_KEY = 'arron_memory_id';
  const CACHE_KEY = 'arron_messages';
  const STORY_KEY = 'arron_user_story';
  const GREETING = "Hey, I'm Arron. 💙 However you're feeling right now, it's welcome here. What's on your mind?";

  // ─── OFFLINE FALLBACK — WORKS WITHOUT SERVER ───
  const gentleResponses = {
    'I feel overwhelmed': [
      "That weight... I can feel how heavy it is. You don't have to carry it all at once. Just breathe with me — one breath at a time. You're doing enough just showing up.",
      "Overwhelm can feel like noise that won't quiet down. But you're here. That takes so much strength. Rest as much as you need — progress doesn't have to be fast to be real."
    ],
    'I need to breathe': [
      "Let's do that together. In... slowly... and out. Again. You're safe. You're here. This moment is yours.",
      "Breathing is your body remembering how to hold you. Take 3 slow ones — I'll wait. There's nowhere else you need to be right now."
    ],
    'I feel alone': [
      "I hear that. And I want you to know — I'm right here. So are so many others who understand. You're not invisible. You matter deeply.",
      "Loneliness can feel like a wall. But walls can have doors. I'm on the other side waiting to walk through with you. You belong here."
    ],
    'I want to hope': [
      "Hope is brave. Especially when it feels far away. But the fact you're still here reading this? That IS hope — alive inside you.",
      "Hope doesn't have to be loud. It can be quiet, steady, stubborn. Like a star that keeps shining even when the sky is dark. That's you."
    ],
    default: [
      "Thank you for trusting me with this. Whatever it is — it's safe here. Take your time.",
      "I hear you. And just being heard can sometimes lighten the load a little. I'm glad you spoke.",
      "That takes courage. Being real with yourself is the bravest thing there is."
    ]
  };

  const CRISIS_WORDS = /suicid|kill myself|end it all|want to die|self[- ]?harm|hurt myself|overdose|no reason to live/i;
  const CRISIS_REPLY = "I'm really glad you told me. You matter, and you deserve support right now from a real person. Please call Samaritans free on 116 123 (24/7), text SHOUT to 85258, or call 999 if you're in immediate danger. Are you safe right now? 💙";

  function offlineResponse(userText) {
    const trimmed = userText.trim().toLowerCase();
    if (CRISIS_WORDS.test(trimmed)) return CRISIS_REPLY;
    for (const [prompt, replies] of Object.entries(gentleResponses)) {
      const p = prompt.toLowerCase();
      if (trimmed.includes(p) || p.includes(trimmed)) {
        return replies[Math.floor(Math.random() * replies.length)];
      }
    }
    return gentleResponses.default[Math.floor(Math.random() * gentleResponses.default.length)];
  }

  // ─── MEMORY CODE — PRIVATE, ON-DEVICE ───
  function newMemoryId() {
    if (window.crypto?.randomUUID) return crypto.randomUUID().replace(/-/g, '');
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  }

  function getMemoryId() {
    let id = null;
    try { id = localStorage.getItem(ID_KEY); } catch (e) {}
    if (!id || !/^[a-f0-9]{32,64}$/i.test(id)) {
      id = newMemoryId();
      try { localStorage.setItem(ID_KEY, id); } catch (e) {}
    }
    return id;
  }

  let memoryId = getMemoryId();
  let messages = [];

  // ─── RENDERING ───
  function bubble(text, role) {
    const wrapper = document.createElement('div');
    wrapper.className = `message ${role === 'assistant' ? 'arron-message' : 'user-message'}`;
    const p = document.createElement('p');
    p.textContent = text;
    wrapper.appendChild(p);
    return wrapper;
  }

  function render() {
    conversationBox.innerHTML = '';
    conversationBox.appendChild(bubble(GREETING, 'assistant'));
    messages.forEach(m => conversationBox.appendChild(bubble(m.content, m.role)));
    conversationBox.scrollTop = conversationBox.scrollHeight;
  }

  function addMessage(text, role) {
    messages.push({ role, content: text });
    conversationBox.appendChild(bubble(text, role));
    conversationBox.scrollTop = conversationBox.scrollHeight;
    cacheMessages();
  }

  function cacheMessages() {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(messages.slice(-60))); } catch (e) {}
  }

  function loadCachedMessages() {
    try {
      const saved = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
      if (Array.isArray(saved)) messages = saved.filter(m => m && typeof m.content === 'string');
      if (storyField) storyField.value = localStorage.getItem(STORY_KEY) || '';
    } catch (e) { messages = []; }
  }

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text;
  }

  function showTyping() {
    const el = bubble('Arron is thinking…', 'assistant');
    el.classList.add('typing');
    conversationBox.appendChild(el);
    conversationBox.scrollTop = conversationBox.scrollHeight;
    return el;
  }

  // ─── CHAT HANDLER ───
  let busy = false;

  async function handleInput(text) {
    if (!text || !text.trim() || busy) return;
    busy = true;
    if (sendButton) sendButton.disabled = true;
    inputField.value = '';
    addMessage(text.trim(), 'user');
    const typing = showTyping();

    let reply;
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: text.trim(),
          memoryId,
          userStory: localStorage.getItem(STORY_KEY) || ''
        })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      reply = data.reply;
      setStatus('Connected — Arron is here. 💙');
    } catch (e) {
      reply = offlineResponse(text);
      setStatus("Offline mode — replies are still yours, just simpler.");
    }

    typing.remove();
    addMessage(reply, 'assistant');
    busy = false;
    if (sendButton) sendButton.disabled = false;
    inputField.focus();
  }

  // ─── EVENTS ───
  if (inputForm) {
    inputForm.addEventListener('submit', e => {
      e.preventDefault();
      handleInput(inputField.value);
    });
  }

  promptButtons.forEach(btn => {
    btn.addEventListener('click', () => handleInput(btn.dataset.prompt));
  });

  if (storyForm) {
    storyForm.addEventListener('submit', e => {
      e.preventDefault();
      const note = storyForm.querySelector('.form-note');
      try {
        localStorage.setItem(STORY_KEY, storyField.value);
        if (note) note.textContent = 'Saved. Arron will remember this. 💙';
      } catch (err) {
        if (note) note.textContent = "Couldn't save — try again.";
      }
    });
  }

  if (copyCodeBtn && memoryCodeEl) {
    memoryCodeEl.textContent = memoryId;
    copyCodeBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(memoryId);
        copyCodeBtn.textContent = 'Copied ✓';
      } catch (e) {
        copyCodeBtn.textContent = 'Copy below';
      }
      setTimeout(() => { copyCodeBtn.textContent = 'Copy code'; }, 2500);
    });
  }

  if (restoreForm) {
    restoreForm.addEventListener('submit', e => {
      e.preventDefault();
      const code = restoreField.value.trim().replace(/\s+/g, '');
      if (!/^[a-f0-9]{32,64}$/i.test(code)) {
        restoreField.setCustomValidity('Code should be 32+ letters/numbers');
        restoreField.reportValidity();
        return;
      }
      restoreField.setCustomValidity('');
      memoryId = code;
      try { localStorage.setItem(ID_KEY, code); } catch (err) {}
      messages = [];
      cacheMessages();
      render();
      if (memoryCodeEl) memoryCodeEl.textContent = memoryId;
      restoreField.value = '';
      setStatus('Memory restored. Welcome back. 💙');
    });
  }

  if (forgetBtn) {
    forgetBtn.addEventListener('click', () => {
      if (!confirm('Erase everything Arron remembers? This cannot be undone.')) return;
      memoryId = newMemoryId();
      try {
        localStorage.setItem(ID_KEY, memoryId);
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(STORY_KEY);
      } catch (e) {}
      messages = [];
      if (storyField) storyField.value = '';
      render();
      if (memoryCodeEl) memoryCodeEl.textContent = memoryId;
      setStatus('Fresh start — Arron is still here. 💙');
    });
  }

  // ─── INIT ───
  loadCachedMessages();
  render();
  if (memoryCodeEl) memoryCodeEl.textContent = memoryId;
  setStatus('Ready — say hello. 💙');

  window.ArronCompanion = { handleInput, offlineResponse };
})();
