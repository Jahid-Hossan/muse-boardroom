import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getBrowserExecutable() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  const linuxPaths = [
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable'
  ];
  for (const p of linuxPaths) {
    if (fs.existsSync(p)) return p;
  }
  const winPaths = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"
  ];
  for (const p of winPaths) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error("No Chrome or Chromium browser executable found.");
}

function getPortForAccount(accountId) {
  let hash = 0;
  const str = String(accountId || 'muse-1');
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) & 0xFFFF;
  }
  return 9222 + (Math.abs(hash) % 500); // Always valid port between 9222 and 9721
}

function resolveProfileDir(accountId) {
  const str = String(accountId || 'muse-1');
  const m = str.match(/(?:profile|muse)[-_]?([1-4])/i);
  const folderName = m ? `profile${m[1]}` : `profile_${str.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  const candidates = [
    path.join(__dirname, 'profiles', folderName),
    path.join("C:\\Users\\Jahid\\Desktop\\muse\\profiles", folderName)
  ];

  for (const dir of candidates) {
    if (fs.existsSync(dir)) return dir;
  }

  const fallback = candidates[0];
  fs.mkdirSync(fallback, { recursive: true });
  return fallback;
}

const activeBrowsers = {};

export async function launchAccountBrowser(accountId, headless = true) {
  if (activeBrowsers[accountId]) {
    try {
      if (activeBrowsers[accountId].isConnected()) {
        return activeBrowsers[accountId];
      }
    } catch (e) {}
  }

  const port = getPortForAccount(accountId);

  // 1. First attempt to connect to already running instance via CDP
  try {
    const browser = await puppeteer.connect({ browserURL: `http://127.0.0.1:${port}` });
    activeBrowsers[accountId] = browser;
    console.log(`[Browser] Connected to active Chrome on port ${port} for ${accountId}`);
    return browser;
  } catch (e) {
    // Not running or cannot connect yet
  }

  const profileDir = resolveProfileDir(accountId);
  try {
    const lockfile = path.join(profileDir, 'lockfile');
    if (fs.existsSync(lockfile)) fs.unlinkSync(lockfile);
  } catch (e) {}

  console.log(`[Browser] Launching account ${accountId} on port ${port} with profile dir: ${profileDir}`);

  const browser = await puppeteer.launch({
    executablePath: getBrowserExecutable(),
    headless: false,
    userDataDir: profileDir,
    defaultViewport: null,
    timeout: 5000,
    args: [
      `--remote-debugging-port=${port}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1000,700',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run'
    ]
  });

  browser.on('disconnected', () => {
    delete activeBrowsers[accountId];
  });

  activeBrowsers[accountId] = browser;
  return browser;
}

export async function queryLiveMuseAccount(account, promptText) {
  const accountId = account.id || 'muse-1';
  console.log(`[Browser Engine] Sending live directive to ${account.name} (${accountId}): "${promptText}"`);
  
  try {
    const browser = await launchAccountBrowser(accountId, false);
    const pages = await browser.pages();
    const page = pages.length > 0 ? pages[0] : await browser.newPage();

    const targetUrl = account.customUrl && account.customUrl.trim() ? account.customUrl.trim() : 'https://muse.ai';
    const currentUrl = page.url();
    let hostname = 'muse.ai';
    try { hostname = new URL(targetUrl).hostname; } catch(e){}

    if (!currentUrl.includes(hostname)) {
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 5000 }).catch(() => {});
    }

    // Try multiple common input selectors
    const inputSelectors = [
      'textarea',
      'input[type="text"]',
      '[contenteditable="true"]',
      'div[role="textbox"]'
    ];

    let inputEl = null;
    for (const sel of inputSelectors) {
      try {
        await page.waitForSelector(sel, { timeout: 800 });
        inputEl = await page.$(sel);
        if (inputEl) break;
      } catch (e) {}
    }

    if (inputEl) {
      await inputEl.click();
      await inputEl.type(promptText, { delay: 0 });
      await page.keyboard.press('Enter');
      await new Promise(r => setTimeout(r, 600));
    }

    // Grab latest output
    const reply = await page.evaluate(() => {
      const elms = document.querySelectorAll('[class*="message"], [class*="chat"], [class*="response"], p');
      if (elms.length > 0) {
        return elms[elms.length - 1].innerText;
      }
      return null;
    });

    return reply || `Live command processed by ${account.name} (Active in session).`;
  } catch (err) {
    console.error(`Live browser execution error for ${account.name}:`, err.message);
    throw err;
  }
}
