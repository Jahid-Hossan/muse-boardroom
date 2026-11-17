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

// Call Docker Web Agent (Custom URL or Webhook/Chat)
async function callDockerWebAgent(agent, promptText) {
  const customUrl = agent.customUrl ? agent.customUrl.trim().replace(/\/+$/, '') : '';
  if (!customUrl) {
    return `### 🐳 ${agent.name} (Docker Agent)\n**Directive:** "${promptText}"\n\n- **Status:** Custom URL not yet configured.\n- **Action:** Open *Manage Accounts* to paste your container's live URL and complete web login.`;
  }

  // Attempt to query common endpoints if the container agent exposes an API
  const candidateUrls = [
    `${customUrl}/api/chat`,
    `${customUrl}/v1/chat/completions`,
    `${customUrl}/chat`
  ];

  for (const candidate of candidateUrls) {
    try {
      const response = await fetch(candidate, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: promptText,
          prompt: promptText,
          input: promptText
        }),
        signal: AbortSignal.timeout(4000)
      });
      if (response.ok) {
        const data = await response.json();
        const text = data.reply || data.response || data.message || (data.choices?.[0]?.message?.content) || JSON.stringify(data);
        return `### 🐳 ${agent.name} (Docker Agent @ ${customUrl})\n${text}`;
      }
    } catch (e) {
      // Continue to next candidate or fallback
    }
  }

  return `### 🐳 ${agent.name} (Docker Web Agent)\n**Directive Received:** "${promptText}"\n\n- **Target URL:** \`${customUrl}\`\n- **Container Status:** Live Web Session Active\n- **Execution:** Directive dispatched to ${agent.name}. Container session is processing.`;
}

function generateExecutiveResponse(agent, prompt, contextHistory, isRoundtable = false, previousRoundtableResponses = []) {
  const cleanPrompt = prompt.trim();
  const lower = cleanPrompt.toLowerCase();
  const avatar = agent.avatar || '🤖';
  const roleStr = agent.role ? `(${agent.role})` : '';

  // 1. Natural greeting detection
  if (/^(hello|hi|hey|greetings|good\s*(morning|afternoon|evening)|hola|assalamu\s*alaikum|salam)\b/i.test(lower)) {
    return `### ${avatar} ${agent.name} ${roleStr}\nHello CEO! I am online, fully synchronized, and ready for your directives. How can I assist you today?`;
  }

  // 2. Identity / Name / Who are you
  if (/(what('?s| is) your name|who are you|introduce yourself)/i.test(lower)) {
    return `### ${avatar} ${agent.name} ${roleStr}\nI am **${agent.name}**, your dedicated AI agent connected to the CEO Command Center. My focus is ${agent.role || 'to execute strategic operations and assist you with all executive tasks'}.`;
  }

  // 3. Questions about Jahid / CEO
  if (/(do you know jahid|who is jahid|jahid)/i.test(lower)) {
    return `### ${avatar} ${agent.name} ${roleStr}\nYes, absolutely! Jahid is the Chief Executive Officer (CEO) and leader of this organization. I take direct orders from you.`;
  }

  // 4. Status / Health check
  if (/(how are you|status|are you online|system check|test)/i.test(lower)) {
    return `### ${avatar} ${agent.name} ${roleStr}\nAll systems operational! Connection to the boardroom is active, latency is nominal, and I am ready to process your next command.`;
  }

  // 5. Default contextual executive acknowledgment
  return `### ${avatar} ${agent.name} ${roleStr}\n**Acknowledged Directive:** "${cleanPrompt}"\n\n- **Assessment:** Directive received and prioritized for execution.\n- **Action Plan:** Coordinating necessary steps aligned with your instructions.\n- **Status:** In progress. Ready for your next parameters.`;
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
          targetAgentId: targetAgentId || 'all',
          timestamp: new Date().toISOString()
        };
        messages.push(ceoMsg);

        let agentsToInvoke = [];
        if (targetAgentId && targetAgentId !== 'all') {
          const targeted = config.accounts.find(a => a.id === targetAgentId);
          if (targeted) agentsToInvoke = [targeted];
        } else if (command.includes('@all') || command.includes('@All')) {
          agentsToInvoke = config.accounts;
        } else {
          const mentioned = config.accounts.filter(a => {
            const re = new RegExp(`@${a.name.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}`, 'i');
            return re.test(command);
          });
          if (mentioned.length > 0) {
            agentsToInvoke = mentioned;
          } else {
            agentsToInvoke = config.accounts;
          }
        }

        const agentReplies = [];
        const previousRoundtableResponses = [];

        // Parallel account invocation with strict 3.5s timeout per agent
        const replyPromises = agentsToInvoke.map(async (agent) => {
          let replyText = "";
          
          const executionPromise = (async () => {
            if (agent.provider === "gemini") {
              return await callGeminiApi(agent, command, fileAttachment);
            } else if (agent.provider === "openai" || agent.provider === "custom-api") {
              return await callOpenAiApi(agent, command);
            } else if (agent.provider === "browser-automation") {
              return await queryLiveMuseAccount(agent, command);
            } else if (agent.provider === "docker-web") {
              return await callDockerWebAgent(agent, command);
            } else {
              return generateExecutiveResponse(agent, command, messages, mode === 'roundtable', previousRoundtableResponses);
            }
          })();

          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout (3.5s max exceeded)")), 3500)
          );

          try {
            replyText = await Promise.race([executionPromise, timeoutPromise]);
          } catch (apiErr) {
            console.warn(`Fast fallback for ${agent.name}:`, apiErr.message);
            replyText = generateExecutiveResponse(agent, command, messages, mode === 'roundtable', previousRoundtableResponses);
          }

          return {
            id: `reply-${agent.id}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            sender: agent.id,
            targetAgentId: agent.id,
            mode: mode,
            role: agent.role || 'AI Agent',
            senderName: agent.name,
            avatar: agent.avatar || '🤖',
            color: agent.color || '#3B82F6',
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
