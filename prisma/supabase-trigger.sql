-- ============================================================
--  Supabase trigger: إنشاء سطر في public.profiles تلقائياً
--  عند تسجيل مستخدم جديد في auth.users.
--
--  نفّذ هذا في: Supabase Dashboard → SQL Editor
--  بعد تشغيل `prisma migrate deploy` (حتى يكون جدول profiles موجوداً).
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, created_at, updated_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    now(),
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
