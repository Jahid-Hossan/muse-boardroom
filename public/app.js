// Muse AI CEO Command Center - Clean & Interactive Controller

let appConfig = null;
let chatMessages = [];
let currentMode = 'broadcast';
let activeConfigAgentId = 'muse-1';
let isSending = false;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadConfig();
    await loadMessages();
    setupEvents();
    if (window.lucide) lucide.createIcons();
  } catch (e) {
    console.error("Initialization error:", e);
  }
});

function setupEvents() {
  const input = document.getElementById('commandInput');
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendCommand();
      }
    });
  }
}

async function loadConfig() {
  try {
    const res = await fetch('/api/config');
    appConfig = await res.json();
    renderRoster();
  } catch (err) {
    console.error('Config load failed:', err);
  }
}

async function loadMessages() {
  try {
    const res = await fetch('/api/messages');
    chatMessages = await res.json();
    renderMessages();
  } catch (err) {
    console.error('Messages load failed:', err);
  }
}

function renderRoster() {
  const roster = document.getElementById('agentRoster');
  if (!roster || !appConfig || !appConfig.accounts) return;

  roster.innerHTML = '';
  appConfig.accounts.forEach(agent => {
    const card = document.createElement('div');
    card.className = "p-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 transition-all flex items-start gap-3";
    card.innerHTML = `
      <div class="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 shadow-md" style="background-color: ${agent.color}20; border: 1px solid ${agent.color}50; color: ${agent.color};">
        ${agent.avatar}
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-white">${agent.name}</span>
          <span class="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            LIVE
          </span>
        </div>
        <div class="text-[11px] font-medium text-slate-300 truncate">${agent.role}</div>
        <div class="text-[10px] text-slate-400 font-mono mt-0.5">${agent.profileDir || 'profile'} connected</div>
        <div class="mt-2 flex items-center gap-1.5">
          <button onclick="insertTag('@${agent.name}')" class="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono">
            Direct @${agent.name}
          </button>
        </div>
      </div>
    `;
    roster.appendChild(card);
  });
  if (window.lucide) lucide.createIcons();
}

function renderMessages() {
  const container = document.getElementById('chatFeed');
  if (!container) return;
  container.innerHTML = '';

  chatMessages.forEach(msg => {
    const msgEl = document.createElement('div');
    msgEl.className = 'message-card';
    const timeFormatted = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (msg.sender === 'system') {
      msgEl.innerHTML = `
        <div class="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 text-center text-xs text-slate-400 max-w-xl mx-auto flex items-center justify-center gap-2">
          <span>ℹ️</span>
          <span>${msg.text}</span>
        </div>
      `;
    } else if (msg.sender === 'ceo') {
      msgEl.innerHTML = `
        <div class="ceo-message p-5 rounded-2xl border border-amber-500/40 relative">
          <div class="flex items-center justify-between mb-2 pb-2 border-b border-amber-500/20">
            <div class="flex items-center gap-2.5">
              <span class="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm shadow">👑</span>
              <div>
                <span class="text-xs font-black uppercase tracking-wider text-amber-400">${msg.senderName}</span>
                <span class="text-[10px] text-amber-200/60 ml-1.5 font-medium px-1.5 py-0.2 rounded bg-amber-400/10 border border-amber-400/20 uppercase tracking-widest">EXECUTIVE ORDER</span>
              </div>
            </div>
            <span class="text-[11px] font-mono text-slate-400">${timeFormatted}</span>
          </div>
          <div class="text-sm font-medium text-amber-50 whitespace-pre-wrap leading-relaxed">
            ${msg.text}
          </div>
        </div>
      `;
    } else {
      const parsedContent = window.marked ? marked.parse(msg.text) : msg.text;
      msgEl.innerHTML = `
        <div class="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all shadow-lg">
          <div class="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-800">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-xl flex items-center justify-center text-base shadow" style="background-color: ${msg.color || '#3B82F6'}20; border: 1px solid ${msg.color || '#3B82F6'}50; color: ${msg.color || '#3B82F6'};">
                ${msg.avatar || '🤖'}
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold text-white">${msg.senderName}</span>
                  <span class="text-[10px] px-2 py-0.5 rounded-full font-semibold" style="background-color: ${msg.color || '#3B82F6'}20; color: ${msg.color || '#3B82F6'}; border: 1px solid ${msg.color || '#3B82F6'}40;">
                    ${msg.role}
                  </span>
                </div>
                <div class="text-[10px] text-emerald-400 font-mono mt-0.5">● Live Browser Account Verified</div>
              </div>
            </div>
            <span class="text-[11px] font-mono text-slate-400">${timeFormatted}</span>
          </div>
          <div class="markdown-content">
            ${parsedContent}
          </div>
        </div>
      `;
    }
    container.appendChild(msgEl);
  });

  if (window.lucide) lucide.createIcons();
  container.scrollTop = container.scrollHeight;
}

async function sendCommand() {
  if (isSending) return;
  const input = document.getElementById('commandInput');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  isSending = true;
  const sendBtn = document.getElementById('sendBtn');
  const indicator = document.getElementById('thinkingIndicator');
  if (sendBtn) sendBtn.disabled = true;
  if (indicator) indicator.classList.remove('hidden');

  try {
    const res = await fetch('/api/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command: text,
        mode: currentMode
      })
    });

    const data = await res.json();
    if (data.success) {
      input.value = '';
      await loadMessages();
    } else {
      alert(`Command Error: ${data.error}`);
    }
  } catch (err) {
    console.error('Send error:', err);
    alert('Failed to send command to accounts');
  } finally {
    isSending = false;
    if (sendBtn) sendBtn.disabled = false;
    if (indicator) indicator.classList.add('hidden');
    input.focus();
  }
}

function insertTag(tag) {
  const input = document.getElementById('commandInput');
  if (!input) return;
  input.value = tag + ' ' + input.value;
  input.focus();
}

function setMode(mode) {
  currentMode = mode;
  document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
  const text = document.getElementById('activeModeText');

  if (mode === 'broadcast') {
    const b = document.getElementById('modeBroadcast');
    if (b) b.classList.add('active');
    if (text) text.textContent = 'Broadcast Mode: Your command will be sent simultaneously to all 4 Muse AI accounts.';
  } else if (mode === 'roundtable') {
    const r = document.getElementById('modeRoundtable');
    if (r) r.classList.add('active');
    if (text) text.textContent = 'Roundtable Mode: All 4 accounts will debate and deliver a consolidated executive solution.';
  } else if (mode === 'direct') {
    const d = document.getElementById('modeDirect');
    if (d) d.classList.add('active');
    if (text) text.textContent = 'Direct Mode: Direct your command to a specific account (@Muse-1, @Muse-2, etc.).';
  }
}

async function clearBoardroom() {
  if (!confirm("Clear boardroom chat?")) return;
  try {
    await fetch('/api/messages', { method: 'DELETE' });
    await loadMessages();
  } catch (e) {
    console.error(e);
  }
}

function openConfigModal(agentId = 'muse-1') {
  activeConfigAgentId = agentId;
  const modal = document.getElementById('configModal');
  if (modal) {
    modal.style.display = 'flex';
    modal.style.removeProperty('display');
    modal.style.display = 'flex';
  }
}

function closeConfigModal() {
  const modal = document.getElementById('configModal');
  if (modal) {
    modal.style.display = 'none';
  }
}
