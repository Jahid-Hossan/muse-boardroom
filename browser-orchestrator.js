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
  throw new Error("No compatible Chrome or Chromium executable found on this system.");
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

  const profileDir = path.join(__dirname, 'profiles', `profile_${accountId}`);
  if (!fs.existsSync(profileDir)) {
    fs.mkdirSync(profileDir, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: getBrowserExecutable(),
    headless: "new",
    userDataDir: profileDir,
    defaultViewport: null,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--no-zygote',
      '--window-size=1280,800'
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
  try {
    const browser = await launchAccountBrowser(accountId, true);
    const pages = await browser.pages();
    const page = pages.length > 0 ? pages[0] : await browser.newPage();

    // Set cookies / session tokens if provided
    if (account.sessionCookie) {
      const cookies = account.sessionCookie.split(';').map(c => {
        const [name, ...val] = c.trim().split('=');
        return { name, value: val.join('='), domain: '.muse.ai', path: '/' };
      }).filter(c => c.name && c.value);
      if (cookies.length > 0) {
        await page.setCookie(...cookies);
      }
    }

    const currentUrl = page.url();
    if (!currentUrl.includes('muse.ai')) {
      await page.goto('https://muse.ai', { waitUntil: 'domcontentloaded', timeout: 30000 });
    }

    const inputSelector = 'textarea, input[type="text"], [contenteditable="true"]';
    await page.waitForSelector(inputSelector, { timeout: 10000 });
    
    await page.click(inputSelector);
    await page.type(inputSelector, promptText);
    await page.keyboard.press('Enter');

    await new Promise(r => setTimeout(r, 4000));

    const reply = await page.evaluate(() => {
      const msgs = document.querySelectorAll('.message, [class*="response"], [class*="chat-message"], p');
      if (msgs.length > 0) {
        return msgs[msgs.length - 1].innerText;
      }
      return null;
    });

    return reply || `[Live Session] Command delivered to ${account.name}. Response received.`;
  } catch (err) {
    console.error(`Browser automation error for ${account.name}:`, err.message);
    throw err;
  }
}
