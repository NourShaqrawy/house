# النشر على Vercel + Supabase

## 1) تجهيز Supabase

- أنشئ مشروع Supabase.
- احصل على روابط الاتصال والمفاتيح (انظر جدول المتغيّرات في [README](./README.md)).
- طبّق المخطط أول مرة من جهازك:
  ```bash
  npx prisma migrate deploy
  ```
- نفّذ `prisma/supabase-trigger.sql` في SQL Editor.

## 2) رفع المشروع على GitHub

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin <repo-url>
git push -u origin main
```

## 3) ربط Vercel

- استورد الـ repo في Vercel — سيكتشف Nuxt تلقائياً.
- **Build Command** (لتطبيق أي migrations جديدة عند كل نشر):
  ```
  prisma migrate deploy && nuxt build
  ```
  (أو اترك الافتراضي `nuxt build` وطبّق الـ migrations يدوياً.)
- **Install Command**: `npm install` (الـ `postinstall` يشغّل `prisma generate`).

## 4) متغيّرات البيئة في Vercel

أضف في **Settings → Environment Variables**:

```
DATABASE_URL          # pooler (6543) + ?pgbouncer=true
DIRECT_URL            # direct (5432)
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_KEY  # سري
```

## 5) إعدادات Supabase Auth

في **Authentication → URL Configuration**:
- أضف دومين Vercel إلى **Site URL** و**Redirect URLs** (مثلاً `https://your-app.vercel.app/confirm`).

## 6) النشر

اضغط **Deploy**. الفرونت والباك يعملان من نفس الدومين.

---

## ملاحظة: النشر على خادم Node دائم (VPS) بدل Vercel

في هذه الحالة لا حاجة للـ pooler — الاتصال المباشر يكفي:
- اجعل `DATABASE_URL` = الاتصال المباشر (منفذ 5432) واحذف `?pgbouncer=true`.
- شغّل: `npm run build` ثم `node .output/server/index.mjs`.
