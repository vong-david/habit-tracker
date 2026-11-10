# 📊 Habit Tracker & Wellness Dashboard (Dark Mode)

A modern, spreadsheet-style habit tracker and wellness dashboard designed for seamless deployment on **Vercel**. Built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Recharts**.

## ✨ Features (លក្ខណៈពិសេស)

- **📈 Daily Progress Bar Chart**: ក្រាហ្វរបារ 0% - 100% គណនាភាគរយទម្លាប់ដែលបានបំពេញរាល់ថ្ងៃ (Day 1 - 31) ស្វ័យប្រវត្តិ។
- **📊 Weekly Progress Bar Chart**: ក្រាហ្វរបារតាមដានភាគរយសរុបតាមសប្តាហ៍ (Week 1 ដល់ Week 5)។
- **📅 Interactive Habit Grid**:
  - Sticky Habit Titles (អាច Scroll មើលថ្ងៃទាំងអស់ដោយមិនបាត់ឈ្មោះទម្លាប់)។
  - ចុច Checkbox ដើម្បីធីកទម្លាប់ដែលបានធ្វើ។
  - Highlight ថ្ងៃនេះ (Today) ដោយស្វ័យប្រវត្តិ។
  - គណនាចំនួន និង % ប្រចាំខែសម្រាប់ទម្លាប់នីមួយៗ។
  - ជួរ Daily Completed សរុបខាងក្រោម។
- **🧘 Overall Wellness Tracker**:
  - តាមដានអារម្មណ៍ (Mood 1-5)។
  - តាមដានម៉ោងគេង (Hours of Sleep 4h-10h)។
  - គណនា Avg Mood និង Avg Sleep ប្រចាំខែ។
- **💾 LocalStorage & Backup**:
  - រក្សាទុកទិន្នន័យស្វ័យប្រវត្តិលើ Browser (មិនបាត់ទិន្នន័យពេល Refresh)។
  - ប៊ូតុង **Export JSON** សម្រាប់ទាញយកទិន្នន័យទុកជាឯកសារ Backup។
  - ប៊ូតុង **Import JSON** សម្រាប់ផ្ទេរទិន្នន័យទៅឧបករណ៍ផ្សេង។
- **➕ Add Custom Habits**: បន្ថែមទម្លាប់ថ្មីជាមួយ Emoji និង Category តាមចិត្ត។

---

## 🚀 របៀបដំណើរការលើកុំព្យូទ័រជាមួយ Bun (Run Locally with Bun)

1. បើក Terminal ក្នុង folder នេះ៖
   ```bash
   bun run dev
   ```
2. បើក Browser ទៅកាន់ [http://localhost:3000](http://localhost:3000)

---

## 🌐 របៀបបង្ហោះលើ Vercel ដោយឥតគិតថ្លៃ (Deploy to Vercel for Free)

Vercel គាំទ្រ **Bun** ដោយស្វ័យប្រវត្តិតាមរយៈឯកសារ `bun.lock` / `bun.lockb`។

1. **បង្កើត Repository លើ GitHub:**
   - ចូលទៅកាន់ [github.com/new](https://github.com/new) ហើយបង្កើត Repository ថ្មី (ឧ. `my-habit-tracker`)។
   - វាយបញ្ជាខាងក្រោមក្នុង Terminal ដើម្បី Push កូដឡើង GitHub៖
     ```bash
     git remote add origin https://github.com/YOUR_USERNAME/my-habit-tracker.git
     git branch -M main
     git push -u origin main
     ```

2. **ភ្ជាប់ជាមួយ Vercel:**
   - ចូលទៅកាន់ [vercel.com](https://vercel.com) (Login ដោយប្រើ GitHub)។
   - ចុច **"Add New..."** -> **"Project"**។
   - ជ្រើសរើស repository `my-habit-tracker` រួចចុច **"Import"**។
   - ចុច **"Deploy"** (Vercel នឹងប្រើប្រាស់ Bun ដើម្បី Build យ៉ាងលឿនក្រោម 20 វិនាទី)។
   - អ្នកនឹងទទួលបាន Link គេហទំព័រផ្ទាល់ខ្លួន (ឧ. `https://my-habit-tracker.vercel.app`) សម្រាប់ប្រើប្រាស់បានជារៀងរហូតដោយឥតគិតថ្លៃ!

