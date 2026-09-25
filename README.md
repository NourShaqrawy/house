# مصاريف البيت + بنك الطبخات 🏠🍲

تطبيق ويب لإدارة المصاريف المشتركة بين سكان بيت واحد، مع بنك وصفات يمكن تحويلها إلى مصاريف.
مبني على **Nuxt 3 + Prisma + Supabase**، بواجهة عربية (RTL) ووضع فاتح.

---

## المزايا

- **مصاريف مشتركة** بثلاثة أنواع تقسيم: بالتساوي / مخصّص / نِسَب مئوية، مع توزيع دقيق لباقي القروش.
- **الرصيد الصافي** لكل شخص (يدمج الديون القديمة تلقائياً).
- **تبسيط الديون**: أقل عدد تحويلات لتصفية الجميع (خوارزمية Greedy).
- **بنك الطبخات**: وصفات بمكوناتها وأسعارها، وزر "طبخ الآن" ينشئ مصروفاً.
- **التسوية**: تسجيل التحويلات الفعلية وسجلّها.
- **إحصائيات**: إجمالي، متوسط أسبوعي، الأكثر/الأقل دفعاً.

---

## المتطلبات

- Node.js ≥ 18 (مُختبَر على 24)
- مشروع Supabase (قاعدة PostgreSQL + Auth)

---

## الإعداد المحلي

### 1) متغيّرات البيئة

انسخ `.env.example` إلى `.env` واملأ القيم من لوحة Supabase:

```bash
cp .env.example .env
```

| المتغيّر | من أين | ملاحظة |
|---------|--------|--------|
| `DATABASE_URL` | Settings → Database → Connection Pooling (منفذ **6543**) | للتطبيق، أضف `?pgbouncer=true` |
| `DIRECT_URL` | Settings → Database → direct (منفذ **5432**) | للـ migrations فقط |
| `SUPABASE_URL` | Settings → API → Project URL | |
| `SUPABASE_ANON_KEY` | Settings → API → anon public | للفرونت |
| `SUPABASE_SERVICE_KEY` | Settings → API → service_role | **سري — للخادم فقط** |

> ⚠️ ملف `.env` الحالي يحتوي قيماً **مؤقتة** للبناء فقط — استبدلها بمفاتيحك الحقيقية.

### 2) تثبيت الاعتماديات

```bash
npm install
```

### 3) تطبيق المخطط على قاعدة البيانات

```bash
npx prisma migrate dev --name init
```

### 4) تفعيل trigger إنشاء الـ profiles

في لوحة Supabase → **SQL Editor**، نفّذ محتوى الملف:

```
prisma/supabase-trigger.sql
```

هذا يُنشئ سطر `profiles` تلقائياً عند تسجيل أي مستخدم جديد.

### 5) التشغيل

```bash
npm run dev
```

افتح http://localhost:3000

---

## الأوامر

| الأمر | الوظيفة |
|------|---------|
| `npm run dev` | تشغيل التطوير |
| `npm run build` | بناء الإنتاج |
| `npm test` | اختبارات المنطق (Vitest) |
| `npm run db:migrate` | migration جديد (تطوير) |
| `npm run db:deploy` | تطبيق migrations (إنتاج) |
| `npm run db:studio` | Prisma Studio |
| `npx nuxi typecheck` | فحص الأنواع |

---

## البنية

```
server/
  api/            مسارات الـ API (Nitro)
  utils/
    money.ts          حساب بالقروش (دقة تامة)
    splitShares.ts    تقسيم الحصص (نقي، مُختبَر)
    balance.ts        الرصيد الصافي (نقي، مُختبَر)
    settlement.ts     تبسيط الديون (نقي، مُختبَر)
    getAuthUser.ts    التحقق من JWT + جلب profile
    prisma.ts         عميل Prisma (singleton)
pages/            الشاشات (Vue)
composables/      حالة مشتركة (useMe, useFormat)
prisma/schema.prisma  مخطط قاعدة البيانات
tests/            اختبارات Vitest
```

منطق الأعمال الحسّاس معزول في دوال **نقية** ومُختبَرة (17 اختباراً).

---

## النشر على Vercel

راجع [DEPLOY.md](./DEPLOY.md).
