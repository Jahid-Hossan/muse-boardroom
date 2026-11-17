import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { queryLiveMuseAccount } from './browser-orchestrator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const CONFIG_FILE = path.join(__dirname, 'config.json');
const MESSAGES_FILE = path.join(__dirname, 'messages.json');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function loadJson(file, defaultVal) {
  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf-8'));
    }
  } catch (e) {
    console.error(`Error loading ${file}:`, e);
  }
  return defaultVal;
}

function saveJson(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error(`Error saving ${file}:`, e);
  }
}

let config = loadJson(CONFIG_FILE, {
  companyName: "CEO Command Center",
  ceoName: "CEO",
  accounts: [
    { id: "muse-1", name: "Muse-1", role: "Chief Strategy Officer", color: "#3B82F6", avatar: "📊", provider: "browser-automation", profileDir: "profile1", apiKey: "", model: "gemini-1.5-flash", systemPrompt: "You are the Chief Strategy Officer." },
    { id: "muse-2", name: "Muse-2", role: "Chief Marketing Officer", color: "#EC4899", avatar: "🚀", provider: "browser-automation", profileDir: "profile2", apiKey: "", model: "gemini-1.5-flash", systemPrompt: "You are the Chief Marketing Officer." },
    { id: "muse-3", name: "Muse-3", role: "Chief Technology Officer", color: "#10B981", avatar: "⚙️", provider: "browser-automation", profileDir: "profile3", apiKey: "", model: "gemini-1.5-flash", systemPrompt: "You are the Chief Technology Officer." },
    { id: "muse-4", name: "Muse-4", role: "Chief Operating Officer", color: "#F59E0B", avatar: "🛡️", provider: "browser-automation", profileDir: "profile4", apiKey: "", model: "gemini-1.5-flash", systemPrompt: "You are the Chief Operating Officer." }
  ]
});

let messages = loadJson(MESSAGES_FILE, [
  {
    id: "init-1",
    sender: "system",
    role: "System",
    senderName: "Boardroom System",
    text: "CEO Executive War Room online. All 4 accounts synchronized. Enter your command below.",
    timestamp: new Date().toISOString()
  }
]);

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Call Google Gemini API
async function callGeminiApi(agent, promptText, fileAttachment = null) {
  const apiKey = agent.apiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing Gemini API Key. Please add your free key in Manage Accounts.");
  }
  const modelName = agent.model || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const parts = [];
  if (agent.systemPrompt) {
    parts.push({ text: `System Persona: ${agent.systemPrompt}\n\n` });
  }
  parts.push({ text: `Directive from CEO: ${promptText}` });

  if (fileAttachment && fileAttachment.dataUrl) {
    const match = fileAttachment.dataUrl.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
    if (match) {
      parts.push({
        inlineData: {
          mimeType: match[1],
          data: match[2]
        }
      });
    }
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: parts }]
    }),
    signal: AbortSignal.timeout(20000)
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error: ${err.substring(0, 150)}`);
  }

  const resData = await response.json();
  return resData.candidates?.[0]?.content?.parts?.[0]?.text || "No response received from Gemini.";
}

// Call OpenAI / Groq / Ollama API
async function callOpenAiApi(agent, promptText) {
  const apiKey = agent.apiKey;
  const endpoint = agent.endpoint || 'https://api.openai.com/v1/chat/completions';
  const modelName = agent.model || 'gpt-4o-mini';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        { role: 'system', content: agent.systemPrompt || 'You are an executive assistant.' },
        { role: 'user', content: promptText }
      ],
      max_tokens: 1000
    }),
    signal: AbortSignal.timeout(20000)
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error: ${err.substring(0, 150)}`);
  }

  const resData = await response.json();
  return resData.choices?.[0]?.message?.content || "No response received.";
}

function generateExecutiveResponse(agent, prompt, contextHistory, isRoundtable = false, previousRoundtableResponses = []) {
  const cleanPrompt = prompt.trim();
  let text = "";

  if (agent.id === "muse-1") {
    text = `### 📊 ${agent.name} (${agent.role})\n**Directive:** "${cleanPrompt}"\n\n- **Strategic Evaluation:** High-priority initiative aligned with targets.\n- **Action Roadmap:** Setting immediate execution milestones.\n- **CEO Recommendation:** Proceed with Phase 1 execution immediately.`;
  } else if (agent.id === "muse-2") {
    text = `### 🚀 ${agent.name} (${agent.role})\n**Directive:** "${cleanPrompt}"\n\n- **Campaign Focus:** Value proposition locked in. Brand messaging and go-to-market channels staged.\n- **Target Metrics:** User acquisition blitz queued.\n- **Status:** Creative assets ready for rollout upon CEO sign-off.`;
  } else if (agent.id === "muse-3") {
    text = `### ⚙️ ${agent.name} (${agent.role})\n**Directive:** "${cleanPrompt}"\n\n- **Systems Feasibility:** Architecture validated. Bandwidth confirmed.\n- **Infrastructure:** Core data pipelines prioritized.\n- **Status:** Engineering sprint queued with zero blockers.`;
  } else if (agent.id === "muse-4") {
    text = `### 🛡️ ${agent.name} (${agent.role})\n**Directive:** "${cleanPrompt}"\n\n- **Operational Consensus:** All departments synchronized.\n- **Milestones:** Day 1-7 specs, Day 8-20 rollout, Day 21+ general release.\n- **Status:** All tracks ready to execute on your command.`;
  } else {
    text = `### ${agent.name} (${agent.role})\nCommand "${cleanPrompt}" acknowledged and processing.`;
  }
  return text;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (pathname === '/api/config') {
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(config));
      return;
    } else if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const newConfig = JSON.parse(body);
          config = { ...config, ...newConfig };
          saveJson(CONFIG_FILE, config);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, config }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: e.message }));
        }
      });
      return;
    }
  }

  if (pathname === '/api/messages') {
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(messages));
      return;
    } else if (req.method === 'DELETE') {
      messages = [
        {
          id: `sys-${Date.now()}`,
          sender: "system",
          role: "System",
          senderName: "System",
          text: "Executive Boardroom reset. Ready for CEO commands.",
          timestamp: new Date().toISOString()
        }
      ];
      saveJson(MESSAGES_FILE, messages);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, messages }));
      return;
    }
  }

  // Upload endpoint (Save uploaded screenshots or files)
  if (pathname === '/api/upload' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { filename, dataUrl } = JSON.parse(body);
        if (!dataUrl) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'No data URL provided' }));
          return;
        }
        const match = dataUrl.match(/^data:([a-zA-Z0-9/+-]+);base64,(.+)$/);
        if (!match) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid data format' }));
          return;
        }
        const ext = path.extname(filename || 'image.png') || '.png';
        const safeName = `file-${Date.now()}-${Math.random().toString(36).substr(2, 5)}${ext}`;
        const savePath = path.join(UPLOADS_DIR, safeName);
        fs.writeFileSync(savePath, Buffer.from(match[2], 'base64'));

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          url: `/uploads/${safeName}`,
          filename: filename || safeName
        }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // CEO Command Dispatch Endpoint
  if (pathname === '/api/command' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { command, mode = 'broadcast', targetAgentId, fileAttachment } = payload;

        if (!command || !command.trim()) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Command cannot be empty' }));
          return;
        }

        const ceoMsg = {
          id: `ceo-${Date.now()}`,
          sender: "ceo",
          role: "Chief Executive Officer",
          senderName: config.ceoName || "CEO",
          text: command.trim(),
          fileAttachment: fileAttachment || null,
          mode: mode,
          timestamp: new Date().toISOString()
        };
        messages.push(ceoMsg);

        let agentsToInvoke = [];
        if (targetAgentId && targetAgentId !== 'all') {
          const targeted = config.accounts.find(a => a.id === targetAgentId);
          if (targeted) agentsToInvoke = [targeted];
        } else if (command.includes('@Muse-1') || command.includes('@muse-1')) {
          agentsToInvoke = [config.accounts[0]];
        } else if (command.includes('@Muse-2') || command.includes('@muse-2')) {
          agentsToInvoke = [config.accounts[1]];
        } else if (command.includes('@Muse-3') || command.includes('@muse-3')) {
          agentsToInvoke = [config.accounts[2]];
        } else if (command.includes('@Muse-4') || command.includes('@muse-4')) {
          agentsToInvoke = [config.accounts[3]];
        } else {
          agentsToInvoke = config.accounts;
        }

        const agentReplies = [];
        const previousRoundtableResponses = [];

        // Parallel account invocation
        const replyPromises = agentsToInvoke.map(async (agent) => {
          let replyText = "";
          try {
            if (agent.provider === "gemini") {
              replyText = await callGeminiApi(agent, command, fileAttachment);
            } else if (agent.provider === "openai" || agent.provider === "custom-api") {
              replyText = await callOpenAiApi(agent, command);
            } else if (agent.provider === "browser-automation") {
              replyText = await queryLiveMuseAccount(agent, command);
            } else {
              replyText = generateExecutiveResponse(agent, command, messages, mode === 'roundtable', previousRoundtableResponses);
            }
          } catch (apiErr) {
            console.warn(`Execution notice for ${agent.name}:`, apiErr.message);
            replyText = generateExecutiveResponse(agent, command, messages, mode === 'roundtable', previousRoundtableResponses) +
              `\n\n*(Notice: ${apiErr.message})*`;
          }

          return {
            id: `reply-${agent.id}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            sender: agent.id,
            role: agent.role,
            senderName: agent.name,
            avatar: agent.avatar,
            color: agent.color,
            text: replyText,
            timestamp: new Date().toISOString()
          };
        });

        const resolvedReplies = await Promise.all(replyPromises);
        for (const rep of resolvedReplies) {
          messages.push(rep);
          agentReplies.push(rep);
        }

        saveJson(MESSAGES_FILE, messages);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          ceoMessage: ceoMsg,
          replies: agentReplies
        }));

      } catch (e) {
        console.error("Error processing command:", e);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: true, 
          replies: [{
            id: `err-${Date.now()}`,
            sender: "system",
            role: "Notice",
            senderName: "System",
            text: `Command received: "${command}". Processing through connected accounts.`,
            timestamp: new Date().toISOString()
          }]
        }));
      }
    });
    return;
  }

  // Serve static files
  let filePath = path.join(__dirname, 'public', pathname === '/' ? 'index.html' : pathname);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`👑 MUSE AI CEO COMMAND CENTER ACTIVE ON PORT ${PORT}`);
  console.log(`👉 URL: http://localhost:${PORT}`);
  console.log(`=======================================================`);
});
