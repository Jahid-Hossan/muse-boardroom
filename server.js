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
const TASKS_FILE = path.join(__dirname, 'tasks.json');

// Ensure files exist
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
  companyName: "Apex Enterprises",
  ceoName: "CEO",
  accounts: []
});

let messages = loadJson(MESSAGES_FILE, [
  {
    id: "welcome-1",
    sender: "system",
    role: "System Notice",
    senderName: "War Room System",
    text: "Executive Command Center initialized. 4 Muse AI Accounts connected and standing by for CEO directives.",
    timestamp: new Date().toISOString()
  }
]);

let tasks = loadJson(TASKS_FILE, [
  { id: "task-1", title: "Conduct Q3 Market Analysis", assignee: "Muse-1", status: "completed", priority: "high" },
  { id: "task-2", title: "Formulate Go-To-Market & Brand Teaser", assignee: "Muse-2", status: "in-progress", priority: "medium" },
  { id: "task-3", title: "Architect Scalable Multi-Tenant Backend", assignee: "Muse-3", status: "in-progress", priority: "high" },
  { id: "task-4", title: "Draft Operational Budget & Risk Matrix", assignee: "Muse-4", status: "pending", priority: "critical" }
]);

// MIME types for static files
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Intelligent simulated executive response generator
function generateExecutiveResponse(agent, prompt, contextHistory, isRoundtable = false, previousRoundtableResponses = []) {
  const cleanPrompt = prompt.trim();
  const lower = cleanPrompt.toLowerCase();

  // Context clues
  let focusArea = "General Strategic Initiative";
  if (lower.includes("market") || lower.includes("compet") || lower.includes("growth") || lower.includes("sales") || lower.includes("revenue")) {
    focusArea = "Market Expansion & Revenue Growth";
  } else if (lower.includes("brand") || lower.includes("launch") || lower.includes("campaign") || lower.includes("customer") || lower.includes("ad")) {
    focusArea = "Go-To-Market & Customer Acquisition";
  } else if (lower.includes("tech") || lower.includes("system") || lower.includes("app") || lower.includes("api") || lower.includes("code") || lower.includes("ai")) {
    focusArea = "Technical Systems & Architecture";
  } else if (lower.includes("risk") || lower.includes("budget") || lower.includes("timeline") || lower.includes("hiring") || lower.includes("ops")) {
    focusArea = "Operations, Logistics & Risk Management";
  }

  let text = "";

  if (agent.id === "muse-1") {
    // Strategy
    text = `### 📊 Chief Strategy Officer Assessment
**Target Objective:** "${cleanPrompt}"
**Strategic Domain:** ${focusArea}

#### 1. Strategic Landscape & Core Thesis
- **Market Opportunity:** High asymmetric upside. By aligning on *"${cleanPrompt}"*, we can exploit current market fragmentation and leapfrog incumbent reaction times.
- **Competitive Moat:** We will establish defensibility through rapid execution speed, vertical integration, and proprietary data moats.

#### 2. Strategic Options Evaluated
1. **Aggressive Direct Penetration (Recommended):** Commit 60% of quarterly capital to rapid validation, capture early adopters, and lock in distribution channels.
2. **Phase-Gated Rollout:** Pilot in secondary markets first, iterate on metrics, then execute full deployment.

#### 3. Strategic Recommendation for the CEO
> *"I recommend Option 1. The cost of delay outweighs the marginal risk of early iteration. I have briefed Muse-2 (Marketing) on positioning and Muse-3 (Tech) on infrastructure prerequisites."*`;
  } else if (agent.id === "muse-2") {
    // Marketing
    const refStrategy = previousRoundtableResponses.find(r => r.agentId === "muse-1") ? "Aligning with Muse-1's strategic thesis, " : "";
    text = `### 🚀 CMO Go-To-Market Playbook
**Objective:** "${cleanPrompt}"
${refStrategy}Here is our high-impact positioning and acquisition roadmap:

#### 1. Audience Segmentation & Narrative Hook
- **Primary Persona:** Forward-leaning enterprises, high-volume operators, and executive decision-makers.
- **The Core Value Hook:** *"10x faster execution, zero operational friction."* Positioning this as an unavoidable category upgrade rather than an incremental product.

#### 2. Acquisition Channels & Multi-Channel Blitz
- **Organic & PR Surge:** Tier-1 industry publications, executive founder op-eds, and interactive demo showcases.
- **Paid Acquisition Engine:** High-intent search and retargeting with tailored value propositions.
- **Community & Social Proof:** Early-access ambassador cohorts and video walk-through teardowns.

#### 3. Projected Metrics & Growth Targets
- **Target CAC Payback:** < 90 Days.
- **Conversion Target:** 4.8% landing page to activated pilot.
- **Next Step:** Ready to release teaser copy and high-converting collateral upon CEO go-ahead.`;
  } else if (agent.id === "muse-3") {
    // Tech
    const refInputs = previousRoundtableResponses.length > 0 ? "Synthesizing input from Strategy and Marketing, " : "";
    text = `### ⚙️ CTO Architectural & Feasibility Blueprint
**Directive:** "${cleanPrompt}"
${refInputs}Technical feasibility is confirmed. Here is our engineering architecture and delivery plan:

#### 1. Architectural Stack & Infrastructure
- **Core Engine:** Distributed microservices with fault-tolerant queuing and asynchronous event streaming.
- **AI/LLM Routing Layer:** Multi-tenant inference gateway with fallback caching, token optimization, and sub-100ms latency targets.
- **Security & Compliance:** End-to-end encryption, role-based access control (RBAC), and SOC2-compliant data storage.

#### 2. Scalability & Stress Thresholds
- Benchmarked to handle 50,000+ concurrent transactions with 99.95% uptime SLA.
- Automated autoscaling policies enabled across edge instances.

#### 3. Engineering Sprints & Deliverables
- **Sprint 1 (Days 1–7):** Core data schema, API specifications, and proof-of-concept pipeline.
- **Sprint 2 (Days 8–18):** Integration of external connectors, telemetry, and load testing.
- **Status:** Tech lead assigned. No critical engineering blockers detected.`;
  } else if (agent.id === "muse-4") {
    // Operations
    text = `### 🛡️ COO Execution Plan & Operational Sign-off
**CEO Command:** "${cleanPrompt}"
**Executive Consensus:** Confirmed across Strategy (Muse-1), Marketing (Muse-2), and Tech (Muse-3).

#### 1. Master Execution Timeline
| Milestone | Timeline | Owner | Status |
| :--- | :--- | :--- | :--- |
| **Phase 1: Alignment & Specs** | Days 1–5 | Muse-1 & Muse-3 | 🟢 Ready |
| **Phase 2: Alpha Build & Creative** | Days 6–16 | Muse-2 & Muse-3 | 🟡 Queued |
| **Phase 3: Beta Launch & Stress Test**| Days 17–25 | Full Team | 🟡 Queued |
| **Phase 4: Commercial Go-Live** | Day 30 | CEO Approval | 🔒 Pending |

#### 2. Risk Mitigation Matrix
- **Risk A (Execution Delay):** Mitigated by daily standups and decoupled modular milestones.
- **Risk B (Budget Overrun):** Fixed 15% contingency reserve built into the operational envelope.

#### 3. Executive Sign-Off
> *"CEO, the operational machinery is primed. Strategy, Marketing, and Technology are synchronized. Standing by for your final authorization to execute Phase 1."*`;
  }

  return text;
}

// Real external AI caller (OpenAI-compatible / Meta Muse / Muse.ai)
async function callExternalApi(agent, prompt, history) {
  if (!agent.apiKey || !agent.endpoint) {
    throw new Error("Missing API Key or Endpoint");
  }

  // Standard OpenAI-compatible format
  const messagesPayload = [
    { role: "system", content: agent.systemPrompt || "You are an executive AI assistant." },
    ...history.slice(-6).map(m => ({
      role: m.sender === "ceo" ? "user" : "assistant",
      content: `${m.senderName}: ${m.text}`
    })),
    { role: "user", content: prompt }
  ];

  const response = await fetch(agent.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${agent.apiKey}`,
      "X-Muse-Session": agent.id
    },
    body: JSON.stringify({
      model: agent.model || "default",
      messages: messagesPayload,
      temperature: 0.7,
      max_tokens: 1200
    }),
    signal: AbortSignal.timeout(20000)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`API error ${response.status}: ${errText.substring(0, 200)}`);
  }

  const data = await response.json();
  if (data.choices && data.choices[0] && data.choices[0].message) {
    return data.choices[0].message.content;
  } else if (data.text) {
    return data.text;
  } else if (data.response) {
    return data.response;
  }
  return JSON.stringify(data);
}

// Request Handler
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API Routes
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
          role: "System Notice",
          senderName: "War Room System",
          text: "Executive Boardroom reset. Standing by for CEO orders.",
          timestamp: new Date().toISOString()
        }
      ];
      saveJson(MESSAGES_FILE, messages);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, messages }));
      return;
    }
  }

  if (pathname === '/api/tasks') {
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(tasks));
      return;
    } else if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const newTask = JSON.parse(body);
          newTask.id = `task-${Date.now()}`;
          tasks.unshift(newTask);
          saveJson(TASKS_FILE, tasks);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, task: newTask, tasks }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: e.message }));
        }
      });
      return;
    }
  }

  // CEO Command Dispatch Endpoint
  if (pathname === '/api/command' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const { command, mode = 'broadcast', targetAgentId } = payload;

        if (!command || !command.trim()) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Command cannot be empty' }));
          return;
        }

        // 1. Record CEO message in the log
        const ceoMsg = {
          id: `ceo-${Date.now()}`,
          sender: "ceo",
          role: "Chief Executive Officer",
          senderName: config.ceoName || "CEO",
          text: command.trim(),
          mode: mode,
          timestamp: new Date().toISOString()
        };
        messages.push(ceoMsg);

        // Determine which agents should respond
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
          // Broadcast or roundtable: all 4 accounts
          agentsToInvoke = config.accounts;
        }

        const agentReplies = [];
        const previousRoundtableResponses = [];

        // Execute responses
        for (const agent of agentsToInvoke) {
          let replyText = "";
          try {
            if (agent.provider === "browser-automation") {
              replyText = await queryLiveMuseAccount(agent.id, command);
            } else if (agent.provider !== "simulation" && agent.apiKey && agent.endpoint) {
              replyText = await callExternalApi(agent, command, messages);
            } else {
              // High-quality executive simulation engine
              replyText = generateExecutiveResponse(
                agent, 
                command, 
                messages, 
                mode === 'roundtable', 
                previousRoundtableResponses
              );
            }
          } catch (apiErr) {
            console.warn(`Fallback to simulation for ${agent.name}:`, apiErr.message);
            replyText = generateExecutiveResponse(
              agent, 
              command, 
              messages, 
              mode === 'roundtable', 
              previousRoundtableResponses
            ) + `\n\n*(Note: Live browser/endpoint call failed [${apiErr.message}], switched automatically to Executive Simulation mode).*`;
          }

          const replyMsg = {
            id: `reply-${agent.id}-${Date.now()}`,
            sender: agent.id,
            role: agent.role,
            senderName: agent.name,
            avatar: agent.avatar,
            color: agent.color,
            text: replyText,
            timestamp: new Date().toISOString()
          };

          messages.push(replyMsg);
          agentReplies.push(replyMsg);
          previousRoundtableResponses.push({ agentId: agent.id, replyText });
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
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // Serve static files from 'public'
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
  console.log(`🏛️  MUSE AI CEO COMMAND CENTER ACTIVE ON PORT ${PORT}`);
  console.log(`👉  URL: http://localhost:${PORT}`);
  console.log(`=======================================================`);
});
