import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

function getBrowserExecutable() {
  if (fs.existsSync(CHROME_PATH)) return CHROME_PATH;
  if (fs.existsSync(EDGE_PATH)) return EDGE_PATH;
  throw new Error("Neither Google Chrome nor Microsoft Edge was found.");
}

const activeBrowsers = {};

/**
 * Launch an individual account's browser profile
 */
export async function launchAccountBrowser(accountId, headless = false) {
  if (activeBrowsers[accountId]) {
    return activeBrowsers[accountId];
  }

  const profileDir = path.join(__dirname, 'profiles', `profile_${accountId}`);
  if (!fs.existsSync(profileDir)) {
    fs.mkdirSync(profileDir, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: getBrowserExecutable(),
    headless: headless ? "new" : false,
    userDataDir: profileDir,
    defaultViewport: null,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-infobars',
      '--window-size=1280,800'
    ]
  });

  browser.on('disconnected', () => {
    delete activeBrowsers[accountId];
  });

  activeBrowsers[accountId] = browser;
  return browser;
}

/**
 * Send a prompt to an account's live Muse AI session
 */
export async function queryLiveMuseAccount(accountId, promptText) {
  try {
    const browser = await launchAccountBrowser(accountId, true);
    const pages = await browser.pages();
    const page = pages.length > 0 ? pages[0] : await browser.newPage();

    // Check if on muse.ai or needs navigation
    const currentUrl = page.url();
    if (!currentUrl.includes('muse.ai')) {
      await page.goto('https://muse.ai', { waitUntil: 'domcontentloaded', timeout: 30000 });
    }

    // Wait for text input/textarea
    const inputSelector = 'textarea, input[type="text"], [contenteditable="true"]';
    await page.waitForSelector(inputSelector, { timeout: 10000 });
    
    // Type prompt
    await page.type(inputSelector, promptText);
    await page.keyboard.press('Enter');

    // Wait for response stream
    await new Promise(r => setTimeout(r, 4000));

    // Extract latest response
    const reply = await page.evaluate(() => {
      const msgs = document.querySelectorAll('.message, [class*="response"], [class*="chat-message"], p');
      if (msgs.length > 0) {
        return msgs[msgs.length - 1].innerText;
      }
      return null;
    });

    return reply || "Command executed successfully in live browser session.";
  } catch (err) {
    console.error(`Browser automation error for ${accountId}:`, err.message);
    throw err;
  }
}
