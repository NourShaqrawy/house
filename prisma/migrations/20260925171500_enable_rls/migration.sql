-- تفعيل Row Level Security على كل الجداول لمنع الوصول المباشر عبر
-- PostgREST بالمفتاح العام (anon/authenticated). بلا سياسات = لا وصول
-- مباشر إطلاقاً لهذه الأدوار. تطبيقنا يتصل بدور postgres (مالك الجداول)
-- الذي يتجاوز RLS، فيظل يعمل عبر Prisma كالمعتاد.
--
-- كل الوصول للبيانات يمرّ حصراً عبر server routes المحمية بـ getAuthUser
-- والمقيّدة بـ household_id.

alter table "public"."profiles"            enable row level security;
alter table "public"."households"          enable row level security;
alter table "public"."expenses"            enable row level security;
alter table "public"."expense_shares"      enable row level security;
alter table "public"."recipes"             enable row level security;
alter table "public"."recipe_ingredients"  enable row level security;
alter table "public"."settlements"         enable row level security;
