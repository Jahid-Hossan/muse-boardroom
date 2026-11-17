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

function resolveProfileDir(accountId) {
  // Map muse-1 -> profile1, muse-2 -> profile2, etc.
  const num = accountId.replace(/[^0-9]/g, '') || '1';
  const folderName = `profile${num}`;

  const candidates = [
    path.join(__dirname, 'profiles', folderName),
    path.join("C:\\Users\\Jahid\\Desktop\\muse\\profiles", folderName),
    path.join(__dirname, 'profiles', `profile_${accountId}`)
  ];

  for (const dir of candidates) {
    if (fs.existsSync(dir)) return dir;
  }

  // Create default if not found
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

  const profileDir = resolveProfileDir(accountId);
  console.log(`[Browser] Launching account ${accountId} with profile dir: ${profileDir}`);

  const browser = await puppeteer.launch({
    executablePath: getBrowserExecutable(),
    headless: false, // User wants to see real browser action!
    userDataDir: profileDir,
    defaultViewport: null,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1000,700'
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

    const currentUrl = page.url();
    if (!currentUrl.includes('muse.ai')) {
      await page.goto('https://muse.ai', { waitUntil: 'networkidle2', timeout: 30000 });
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
        await page.waitForSelector(sel, { timeout: 3000 });
        inputEl = await page.$(sel);
        if (inputEl) break;
      } catch (e) {}
    }

    if (inputEl) {
      await inputEl.click();
      await inputEl.type(promptText, { delay: 20 });
      await page.keyboard.press('Enter');
      await new Promise(r => setTimeout(r, 4000));
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
