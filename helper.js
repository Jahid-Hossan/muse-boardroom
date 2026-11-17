import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG_FILE = path.join(__dirname, 'config.json');

console.log("=================================================");
console.log("👑 MUSE AI // সিইও কমান্ড সেন্টার অ্যাসিস্ট্যান্ট হেল্পার");
console.log("=================================================");

function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
  } catch (e) {
    return null;
  }
}

async function checkServer() {
  return new Promise((resolve) => {
    http.get('http://localhost:3000/api/config', (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => {
      resolve(false);
    });
  });
}

async function sendQuickCommand(cmd) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ command: cmd, mode: 'broadcast' });
    const req = http.request('http://localhost:3000/api/command', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve({ error: body });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function main() {
  const isOnline = await checkServer();
  const cfg = loadConfig();

  console.log(`\n📌 সার্ভার স্ট্যাটাস: ${isOnline ? "🟢 সচল (Online at http://localhost:3000)" : "🔴 বন্ধ (Offline)"}`);
  if (cfg && cfg.accounts) {
    console.log("📋 ৪টি সক্রিয় এক্সিকিউটিভ অ্যাকাউন্ট:");
    cfg.accounts.forEach(a => {
      console.log(`   ${a.avatar} ${a.name} - ${a.role} [${a.provider}]`);
    });
  }

  console.log("\nমেনু নির্বাচন করুন:");
  console.log("1. ব্রাউজারে ড্যাশবোর্ড চালু করুন (Open Dashboard)");
  console.log("2. সিইও হিসেবে একটি টেস্ট কমান্ড পাঠান (Send Test Directive)");
  console.log("3. চ্যাট হিস্ট্রি রিসেট করুন (Reset War Room)");
  console.log("4. প্রস্থান (Exit)");

  rl.question("\nআপনার পছন্দ (1-4): ", async (ans) => {
    const choice = ans.trim();
    if (choice === '1') {
      import('node:child_process').then(cp => {
        cp.exec('start http://localhost:3000');
        console.log("🌐 ব্রাউজারে ওপেন হচ্ছে...");
        rl.close();
      });
    } else if (choice === '2') {
      rl.question("\nসিইও হিসেবে আপনার নির্দেশ লিখুন: ", async (directive) => {
        console.log("\n⏳ ৪টি Muse অ্যাকাউন্টে নির্দেশ পাঠানো হচ্ছে...");
        try {
          const res = await sendQuickCommand(directive || "Q3 গ্রোথ স্ট্র্যাটেজি রিপোর্ট পেশ করুন");
          console.log("\n✅ উত্তর সফলভাবে পাওয়া গেছে!");
          if (res.replies) {
            res.replies.forEach(r => {
              console.log(`\n-----------------------------------`);
              console.log(`${r.senderName} (${r.role}):`);
              console.log(r.text.substring(0, 150) + "...\n");
            });
          }
        } catch (e) {
          console.error("ত্রুটি:", e.message);
        }
        rl.close();
      });
    } else if (choice === '3') {
      const req = http.request('http://localhost:3000/api/messages', { method: 'DELETE' }, (res) => {
        console.log("🧹 হিস্ট্রি সম্পূর্ণ পরিষ্কার করা হয়েছে।");
        rl.close();
      });
      req.end();
    } else {
      console.log("বিদায়!");
      rl.close();
    }
  });
}

main();
