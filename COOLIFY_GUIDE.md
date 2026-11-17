# 🚀 Coolify Deployment Guide (কুলাইফাই দিয়ে ভিপিএস-এ ডিপ্লয়মেন্ট)

আপনার ভিপিএস-এ **Coolify** থাকা মানে আপনার কাজ এখন সবচেয়ে সহজ! Coolify স্বয়ংক্রিয়ভাবে ডকার কন্টেইনার, ফ্রি এসএসএল (HTTPS) এবং অটোমেটিক রিস্টার্ট হ্যান্ডেল করে।

---

### ধাপ ১: প্রজেক্টটি GitHub-এ পুশ করুন (অথবা ভিপিএস-এ রাখুন)
এই `muse-ceo-command` ফোল্ডারটিতে আমরা ইতোমধ্যে [Dockerfile](file:///C:/Users/Jahid/.gemini/antigravity/scratch/muse-ceo-command/Dockerfile) এবং [docker-compose.yml](file:///C:/Users/Jahid/.gemini/antigravity/scratch/muse-ceo-command/docker-compose.yml) প্রস্তুত করে দিয়েছি।
এটি আপনার GitHub-এ একটি প্রাইভেট রিপোজিটরি হিসেবে পুশ করুন।

---

### ধাপ ২: Coolify ড্যাশবোর্ড থেকে ৩ ক্লিকে ডিপ্লয় করুন
1. আপনার ব্রাউজারে Coolify ড্যাশবোর্ডে লগইন করুন।
2. **Project** বা **Production Environment**-এ যান।
3. **+ New Resource** বাটনে ক্লিক করুন -> নির্বাচন করুন **Application**।
4. **Public/Private Repository** সিলেক্ট করে আপনার GitHub রিপোজিটরি লিংকটি দিন।
5. Coolify স্বয়ংক্রিয়ভাবে ভেতরের `Dockerfile` ডিটেক্ট করে নেবে:
   - **Port:** `3000`
   - **Domain:** আপনার যেকোনো ডোমেন বা সাবডোমেন দিন (যেমন: `https://ceo.yourdomain.com`) অথবা ভিপিএস-এর র আইপি রাখুন। Coolify নিজে থেকেই ফ্রি **Let's Encrypt SSL (HTTPS)** সেট করে দেবে!
6. **Deploy** বাটনে ক্লিক করুন!

---

### 🎉 ফলাফল
কয়েক সেকেন্ডের ভেতর আপনার Muse AI CEO Command Center ভিপিএস-এ ২৪/৭ চালু হয়ে যাবে। আপনি আপনার ফোন থেকে যেকোনো সময় `https://ceo.yourdomain.com` লিংকে ঢুকে সিইও হিসেবে ৪টি অ্যাকাউন্ট পরিচালনা করতে পারবেন!
