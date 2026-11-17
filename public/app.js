// Muse AI CEO Command Center Frontend Application

let appConfig = null;
let chatMessages = [];
let boardTasks = [];
let currentMode = 'broadcast';
let activeConfigAgentId = 'muse-1';
let isSending = false;

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  await loadConfig();
  await loadMessages();
  await loadTasks();
  setupKeyboardEvents();
  lucide.createIcons();
});

// Setup Enter key to send command
function setupKeyboardEvents() {
  const input = document.getElementById('commandInput');
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendCommand();
    }
  });
}

// Fetch configuration
async function loadConfig() {
  try {
    const res = await fetch('/api/config');
    appConfig = await res.json();
    renderRoster();
    updateTelemetry();
  } catch (err) {
    console.error('Failed to load config:', err);
  }
}

// Fetch messages
async function loadMessages() {
  try {
    const res = await fetch('/api/messages');
    chatMessages = await res.json();
    renderMessages();
  } catch (err) {
    console.error('Failed to load messages:', err);
  }
}

// Fetch tasks
async function loadTasks() {
  try {
    const res = await fetch('/api/tasks');
    boardTasks = await res.json();
    renderTasks();
  } catch (err) {
    console.error('Failed to load tasks:', err);
  }
}

// Render the 4 Muse accounts in sidebar
function renderRoster() {
  if (!appConfig || !appConfig.accounts) return;
  const roster = document.getElementById('agentRoster');
  roster.innerHTML = '';

  appConfig.accounts.forEach(agent => {
    const card = document.createElement('div');
    card.className = "p-3 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 transition-all flex items-start gap-3 group relative";
    card.innerHTML = `
      <div class="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 shadow-md" style="background-color: ${agent.color}20; border: 1px solid ${agent.color}50; color: ${agent.color};">
        ${agent.avatar}
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">${agent.name}</span>
          <span class="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            ${agent.provider === 'simulation' ? 'SIM' : 'API'}
          </span>
        </div>
        <div class="text-[11px] font-medium text-slate-300 truncate">${agent.role}</div>
        <div class="text-[10px] text-slate-400 truncate mt-0.5">${agent.title}</div>
        <div class="mt-2 flex items-center gap-1.5">
          <button onclick="insertTag('@${agent.name}')" class="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors font-mono">
            Direct @${agent.name}
          </button>
          <button onclick="openConfigModal('${agent.id}')" class="text-[10px] p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white" title="Settings">
            <i data-lucide="settings" class="w-3 h-3"></i>
          </button>
        </div>
      </div>
    `;
    roster.appendChild(card);
  });
  lucide.createIcons();
}

// Render messages in chat stream
function renderMessages() {
  const container = document.getElementById('chatFeed');
  container.innerHTML = '';

  chatMessages.forEach(msg => {
    const msgEl = document.createElement('div');
    msgEl.className = 'message-card';

    const timeFormatted = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (msg.sender === 'system') {
      msgEl.innerHTML = `
        <div class="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 text-center text-xs text-slate-400 max-w-xl mx-auto flex items-center justify-center gap-2">
          <i data-lucide="info" class="w-4 h-4 text-amber-400 shrink-0"></i>
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
            <div class="flex items-center gap-2">
              <span class="text-[11px] font-mono text-amber-300/60 uppercase">Mode: ${msg.mode || 'Broadcast'}</span>
              <span class="text-[11px] font-mono text-slate-400">${timeFormatted}</span>
            </div>
          </div>
          <div class="text-sm font-medium text-amber-50 whitespace-pre-wrap leading-relaxed">
            ${msg.text}
          </div>
        </div>
      `;
    } else {
      // Agent Message
      const parsedContent = marked.parse(msg.text);
      msgEl.innerHTML = `
        <div class="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 transition-all shadow-lg">
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
                <div class="text-[10px] text-slate-400 font-mono mt-0.5">Account Connected & Verified</div>
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

  lucide.createIcons();
  container.scrollTop = container.scrollHeight;
}

// Render task list in right sidebar
function renderTasks() {
  const container = document.getElementById('tasksList');
  container.innerHTML = '';

  boardTasks.forEach(task => {
    const isDone = task.status === 'completed';
    const taskCard = document.createElement('div');
    taskCard.className = `p-2.5 rounded-xl border ${isDone ? 'border-slate-800/50 bg-slate-900/30 opacity-60' : 'border-slate-800 bg-slate-900/60'} transition-all text-xs`;
    
    let priorityColor = 'text-blue-400 border-blue-500/30 bg-blue-500/10';
    if (task.priority === 'high' || task.priority === 'critical') {
      priorityColor = 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    }

    taskCard.innerHTML = `
      <div class="flex items-start justify-between gap-2">
        <span class="font-medium text-slate-200 ${isDone ? 'line-through' : ''}">${task.title}</span>
        <span class="text-[9px] uppercase px-1.5 py-0.5 rounded border ${priorityColor} font-mono shrink-0">${task.priority}</span>
      </div>
      <div class="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-800/60 text-[10px] text-slate-400">
        <span class="font-semibold text-slate-300">Assignee: ${task.assignee}</span>
        <button onclick="toggleTaskStatus('${task.id}')" class="text-xs hover:text-amber-300 transition-colors">
          ${isDone ? '↩️ Reopen' : '✓ Mark Done'}
        </button>
      </div>
    `;
    container.appendChild(taskCard);
  });
}

// Send CEO Command
async function sendCommand() {
  if (isSending) return;
  const input = document.getElementById('commandInput');
  const text = input.value.trim();
  if (!text) return;

  isSending = true;
  document.getElementById('sendBtn').disabled = true;
  document.getElementById('thinkingIndicator').classList.remove('hidden');

  // Dynamic status text
  const indicator = document.getElementById('thinkingText');
  if (currentMode === 'roundtable') {
    indicator.textContent = 'Conducting Autonomous Executive Roundtable across all 4 Muse accounts...';
  } else {
    indicator.textContent = '4 Muse AI accounts processing CEO directive simultaneously...';
  }

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
      updateTelemetry();
    } else {
      alert(`Command Error: ${data.error}`);
    }
  } catch (err) {
    console.error('Send error:', err);
    alert('Failed to send directive to Muse AI accounts');
  } finally {
    isSending = false;
    document.getElementById('sendBtn').disabled = false;
    document.getElementById('thinkingIndicator').classList.add('hidden');
    input.focus();
  }
}

// Quick mention tag
function insertTag(tag) {
  const input = document.getElementById('commandInput');
  input.value = tag + ' ' + input.value;
  input.focus();
}

// Mode switcher
function setMode(mode) {
  currentMode = mode;
  document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
  
  const text = document.getElementById('activeModeText');
  if (mode === 'broadcast') {
    document.getElementById('modeBroadcast').classList.add('active');
    text.textContent = 'Broadcast to All 4 Accounts — Command processed simultaneously by Strategy, Marketing, Tech, and Operations.';
  } else if (mode === 'roundtable') {
    document.getElementById('modeRoundtable').classList.add('active');
    text.textContent = 'Autonomous Roundtable Mode — All 4 accounts will debate, build upon each other, and deliver a consolidated executive solution.';
  } else if (mode === 'direct') {
    document.getElementById('modeDirect').classList.add('active');
    text.textContent = 'Targeted Directive Mode — Type @Muse-1, @Muse-2, @Muse-3, or @Muse-4 to command a single executive account directly.';
  }
}

// Executive Presets
function applyPreset(type) {
  const input = document.getElementById('commandInput');
  if (type === 'growth') {
    input.value = "Strategic Directive: Initiate 10X Revenue Blitz. Strategy: define high-yield customer segments. Marketing: blueprint viral campaign. Tech: scale architecture. Operations: deliver 30-day timeline.";
  } else if (type === 'crisis') {
    input.value = "Executive Emergency: Comprehensive Risk & Vulnerability Audit. Check systems bottlenecks, operational exposure, and churn risks immediately. Present mitigation plan.";
  } else if (type === 'product') {
    input.value = "Product Pivot Directive: We are launching an autonomous AI-driven workflow engine. Strategy: competitive moat analysis. Tech: API specifications. Marketing: narrative hook. Ops: sprint resource allocation.";
  }
  input.focus();
}

// Clear War Room
async function clearBoardroom() {
  if (!confirm("Are you sure you want to clear the War Room group chat history?")) return;
  try {
    await fetch('/api/messages', { method: 'DELETE' });
    await loadMessages();
    updateTelemetry();
  } catch (err) {
    console.error('Failed to clear messages:', err);
  }
}

// Export Minutes
function exportTranscript() {
  let md = `# MUSE AI // EXECUTIVE BOARDROOM MINUTES\n`;
  md += `**Date:** ${new Date().toLocaleString()}\n`;
  md += `**Participants:** CEO (Commander), Muse-1 (Strategy), Muse-2 (Marketing), Muse-3 (Technology), Muse-4 (Operations)\n\n`;
  md += `---\n\n`;

  chatMessages.forEach(m => {
    md += `### ${m.senderName} (${m.role}) [${new Date(m.timestamp).toLocaleTimeString()}]\n`;
    md += `${m.text}\n\n`;
  });

  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Muse_WarRoom_Minutes_${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

// Update telemetry stats
function updateTelemetry() {
  const directives = chatMessages.filter(m => m.sender === 'ceo').length;
  document.getElementById('statDirectives').textContent = directives;
}

// Toggle task status
function toggleTaskStatus(taskId) {
  const task = boardTasks.find(t => t.id === taskId);
  if (task) {
    task.status = task.status === 'completed' ? 'in-progress' : 'completed';
    renderTasks();
  }
}

// Add new task
function promptNewTask() {
  const title = prompt("Enter executive task deliverable:");
  if (!title) return;
  const assignee = prompt("Assignee (Muse-1, Muse-2, Muse-3, Muse-4):", "Muse-1") || "Muse-1";

  fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: title,
      assignee: assignee,
      priority: 'high',
      status: 'pending'
    })
  }).then(loadTasks);
}

// CONFIG MODAL LOGIC
function openConfigModal(agentId = 'muse-1') {
  activeConfigAgentId = agentId;
  renderConfigModalTabs();
  renderConfigModalForm();
  document.getElementById('configModal').classList.remove('hidden');
  lucide.createIcons();
}

function closeConfigModal() {
  document.getElementById('configModal').classList.add('hidden');
}

function renderConfigModalTabs() {
  const tabsContainer = document.getElementById('accountTabs');
  tabsContainer.innerHTML = '';

  appConfig.accounts.forEach(a => {
    const isActive = a.id === activeConfigAgentId;
    const tabBtn = document.createElement('button');
    tabBtn.className = `px-4 py-2 text-xs font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
      isActive 
        ? 'border-amber-400 text-amber-300 bg-slate-900/90' 
        : 'border-transparent text-slate-400 hover:text-slate-200'
    }`;
    tabBtn.innerHTML = `<span>${a.avatar}</span> <span>${a.name}</span>`;
    tabBtn.onclick = () => {
      activeConfigAgentId = a.id;
      renderConfigModalTabs();
      renderConfigModalForm();
    };
    tabsContainer.appendChild(tabBtn);
  });
}

function renderConfigModalForm() {
  const form = document.getElementById('accountConfigForm');
  const agent = appConfig.accounts.find(a => a.id === activeConfigAgentId);
  if (!agent) return;

  form.innerHTML = `
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Account Display Name</label>
        <input type="text" id="cfgName" value="${agent.name}" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400">
      </div>
      <div>
        <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Executive Title / Role</label>
        <input type="text" id="cfgRole" value="${agent.role}" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400">
      </div>
    </div>

    <div>
      <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Connection Provider</label>
      <select id="cfgProvider" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400" onchange="toggleProviderInputs()">
        <option value="browser-automation" ${agent.provider === 'browser-automation' ? 'selected' : ''}>🌐 Browser Automation (Free • Logged-in Chrome/Edge Account • No API Key)</option>
        <option value="simulation" ${agent.provider === 'simulation' ? 'selected' : ''}>⚡ Executive Simulation (Offline • Instant Test)</option>
        <option value="meta-muse" ${agent.provider === 'meta-muse' ? 'selected' : ''}>Meta Muse API / Gateway</option>
        <option value="muse-ai" ${agent.provider === 'muse-ai' ? 'selected' : ''}>muse.ai Video / Media API</option>
        <option value="openai-compatible" ${agent.provider === 'openai-compatible' ? 'selected' : ''}>OpenAI-Compatible Endpoint</option>
      </select>
    </div>

    <div id="apiFieldsGroup" class="${(agent.provider === 'simulation' || agent.provider === 'browser-automation') ? 'hidden' : ''} space-y-3">
      <div>
        <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">API Key / Bearer Token</label>
        <input type="password" id="cfgApiKey" value="${agent.apiKey || ''}" placeholder="Enter account token or API key" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400">
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Endpoint URL</label>
          <input type="text" id="cfgEndpoint" value="${agent.endpoint || ''}" placeholder="https://api.meta.com/v1/chat/completions" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400">
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Model Name / ID</label>
          <input type="text" id="cfgModel" value="${agent.model || ''}" placeholder="muse-spark-latest" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400">
        </div>
      </div>
    </div>

    <div>
      <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Specialized System Persona & Directives</label>
      <textarea id="cfgPrompt" rows="4" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 leading-relaxed">${agent.systemPrompt || ''}</textarea>
    </div>
  `;
}

function toggleProviderInputs() {
  const provider = document.getElementById('cfgProvider').value;
  const group = document.getElementById('apiFieldsGroup');
  if (provider === 'simulation' || provider === 'browser-automation') {
    group.classList.add('hidden');
  } else {
    group.classList.remove('hidden');
  }
}

// Save account config
async function saveAccountConfig() {
  const agent = appConfig.accounts.find(a => a.id === activeConfigAgentId);
  if (!agent) return;

  agent.name = document.getElementById('cfgName').value;
  agent.role = document.getElementById('cfgRole').value;
  agent.provider = document.getElementById('cfgProvider').value;
  agent.systemPrompt = document.getElementById('cfgPrompt').value;

  const apiKeyInput = document.getElementById('cfgApiKey');
  if (apiKeyInput) agent.apiKey = apiKeyInput.value;

  const endpointInput = document.getElementById('cfgEndpoint');
  if (endpointInput) agent.endpoint = endpointInput.value;

  const modelInput = document.getElementById('cfgModel');
  if (modelInput) agent.model = modelInput.value;

  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appConfig)
    });

    const data = await res.json();
    if (data.success) {
      closeConfigModal();
      renderRoster();
      alert(`Account ${agent.name} configuration saved successfully!`);
    }
  } catch (err) {
    console.error('Failed to save config:', err);
    alert('Failed to save account configuration.');
  }
}
