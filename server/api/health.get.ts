/** نقطة فحص خفيفة (بلا مصادقة/قاعدة بيانات) — تُستخدم لإبقاء الخادم مستيقظاً
 *  ولمراقبة التشغيل عبر منبّه خارجي مثل UptimeRobot. */
export default defineEventHandler(() => {
  return { ok: true, ts: Date.now() }
})
