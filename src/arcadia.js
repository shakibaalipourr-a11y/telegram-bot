import { getJson, putJson } from './kv.js';
import { entityKey, allEntities } from './storage.js';
import { sendToUser, tgApi } from './bot-api.js';

const appKey = (id) => entityKey('arcadia:application', String(id));
const EVENT_PREFIX = 'arcadia:event:';
const HOUSES = {
  gryffindor: 'گریفیندور',
  slytherin: 'اسلیترین',
  ravenclaw: 'ریونکلا',
  hufflepuff: 'هافلپاف',
};
const QUESTIONS = [
  { q: 'در راهرویی تاریک صدایی می‌شنوی. نخستین واکنشت چیست؟', a: [
    ['به‌سوی صدا می‌روم؛ شاید کسی به کمک نیاز داشته باشد.', 'gryffindor'],
    ['اول اطراف را بررسی می‌کنم و بعد تصمیم می‌گیرم.', 'ravenclaw'],
    ['راهی پیدا می‌کنم که بدون جلب توجه حقیقت را بفهمم.', 'slytherin'],
    ['مطمئن می‌شوم هیچ‌کس تنها یا در خطر نمانده باشد.', 'hufflepuff'],
  ]},
  { q: 'کدام ویژگی را در یک دوست ارزشمندتر می‌دانی؟', a: [
    ['شجاعت و ایستادگی در لحظه‌های سخت.', 'gryffindor'],
    ['هوش، کنجکاوی و گفت‌وگوی عمیق.', 'ravenclaw'],
    ['وفاداری، اعتماد و ارادهٔ قوی.', 'slytherin'],
    ['مهربانی، انصاف و قابل‌اعتماد بودن.', 'hufflepuff'],
  ]},
  { q: 'اگر قانونی ناعادلانه باشد، چه می‌کنی؟', a: [
    ['آشکارا در برابرش می‌ایستم.', 'gryffindor'],
    ['دلیل نادرستی‌اش را پیدا و اثبات می‌کنم.', 'ravenclaw'],
    ['هوشمندانه راهی برای تغییرش پیدا می‌کنم.', 'slytherin'],
    ['از کسانی که آسیب می‌بینند حمایت می‌کنم.', 'hufflepuff'],
  ]},
  { q: 'در یک گروه تازه، معمولاً چه نقشی می‌گیری؟', a: [
    ['پیش‌قدم می‌شوم و مسئولیت می‌پذیرم.', 'gryffindor'],
    ['ایده‌ها و راه‌حل‌های تازه مطرح می‌کنم.', 'ravenclaw'],
    ['هدف را مشخص می‌کنم و مسیر رسیدن را می‌چینم.', 'slytherin'],
    ['همه را همراه می‌کنم و هماهنگی می‌سازم.', 'hufflepuff'],
  ]},
  { q: 'کدام پاداش برایت جذاب‌تر است؟', a: [
    ['افتخارِ انجام کاری دشوار و درست.', 'gryffindor'],
    ['کشف حقیقتی که دیگران ندیده‌اند.', 'ravenclaw'],
    ['رسیدن به هدفی بزرگ با اراده و تدبیر.', 'slytherin'],
    ['ساختن چیزی ماندگار در کنار دیگران.', 'hufflepuff'],
  ]},
  { q: 'وقتی شکست می‌خوری، چه چیزی تو را دوباره بلند می‌کند؟', a: [
    ['این فکر که نباید تسلیم شوم.', 'gryffindor'],
    ['فهمیدن اشتباه و یادگرفتن از آن.', 'ravenclaw'],
    ['تصویر هدفی که هنوز به آن نرسیده‌ام.', 'slytherin'],
    ['تعهدی که نسبت به خودم و دیگران دارم.', 'hufflepuff'],
  ]},
  { q: 'در کتابخانهٔ ممنوعه، کدام بخش توجهت را جلب می‌کند؟', a: [
    ['شرح ماجراجویی‌ها و نبردهای تاریخی.', 'gryffindor'],
    ['رازهای باستانی، نظریه‌ها و دانش ناشناخته.', 'ravenclaw'],
    ['جادوهای پیچیده و تاریخ خاندان‌های قدرتمند.', 'slytherin'],
    ['گیاهان جادویی، درمان و دانش زندگی.', 'hufflepuff'],
  ]},
  { q: 'اگر رازی مهم به تو سپرده شود...', a: [
    ['برای محافظت از دیگران هر خطری را می‌پذیرم.', 'gryffindor'],
    ['با دقت می‌سنجم چه زمانی گفتنش درست است.', 'ravenclaw'],
    ['آن را حفظ می‌کنم و بی‌گدار به آب نمی‌زنم.', 'slytherin'],
    ['تا وقتی به کسی آسیب نزند، امانت‌دار می‌مانم.', 'hufflepuff'],
  ]},
  { q: 'کدام محیط را برای زندگی در هاگوارتز انتخاب می‌کنی؟', a: [
    ['تالاری پرشور با پنجره‌هایی رو به برج‌ها.', 'gryffindor'],
    ['کتابخانه‌ای آرام با آسمانی پرستاره.', 'ravenclaw'],
    ['تالاری اسرارآمیز در ژرفای قلعه.', 'slytherin'],
    ['اتاقی گرم و صمیمی نزدیک باغ‌ها.', 'hufflepuff'],
  ]},
  { q: 'بزرگ‌ترین انگیزه‌ات چیست؟', a: [
    ['شجاعانه از چیزی که درست است دفاع کنم.', 'gryffindor'],
    ['تا جای ممکن بیاموزم و رشد فکری داشته باشم.', 'ravenclaw'],
    ['به جایگاهی برسم که بتوانم سرنوشت خودم را بسازم.', 'slytherin'],
    ['جهانی منصفانه‌تر و امن‌تر برای اطرافیان بسازم.', 'hufflepuff'],
  ]},
  { q: 'در تصمیمی دشوار، بیشتر به چه تکیه می‌کنی؟', a: [
    ['وجدان و شهامت.', 'gryffindor'],
    ['منطق و شواهد.', 'ravenclaw'],
    ['استراتژی و آینده‌نگری.', 'slytherin'],
    ['همدلی و انصاف.', 'hufflepuff'],
  ]},
  { q: 'دوست داری کدام جمله درباره‌ات گفته شود؟', a: [
    ['«وقتی دیگران عقب نشستند، او ایستاد.»', 'gryffindor'],
    ['«همیشه پرسشی داشت که دری تازه باز می‌کرد.»', 'ravenclaw'],
    ['«می‌دانست چه می‌خواهد و برایش می‌جنگید.»', 'slytherin'],
    ['«حضورش باعث می‌شد هیچ‌کس تنها نماند.»', 'hufflepuff'],
  ]},
];

const isAdmin = (env, settings, user) =>
  !!user && ((settings.adminId && String(user.id) === String(settings.adminId)) ||
    (env.ADMIN_ID && String(user.id) === String(env.ADMIN_ID)));

const eventKey = (id, stamp) => EVENT_PREFIX + String(id) + ':' + String(stamp);

async function recordEvent(env, user, type, details = {}) {
  const at = Date.now();
  await putJson(env, eventKey(user.id, at), {
    userId: String(user.id), type, at, firstName: user.firstName || '',
    username: user.username || '', ...details,
  }, { ttl: 180 * 86400 });
}

function displayName(user) {
  return [user.firstName, user.username ? '@' + user.username : ''].filter(Boolean).join(' · ') || String(user.id);
}

async function home(env, token, user) {
  let app = await getJson(env, appKey(user.id), null);
  const status = app?.status === 'pending_review' ? 'آزمون شما ثبت شده و در انتظار بررسی مدیران است.' :
    app?.status === 'approved' ? 'پذیرش شما تأیید شده است. به آرکادیا خوش آمدید.' :
    app?.status === 'rejected' ? 'درخواست قبلی شما پذیرفته نشده است. برای بررسی دوباره با مدیران تماس بگیرید.' :
    app?.status === 'in_progress' ? 'آزمون شما نیمه‌تمام مانده است؛ می‌توانید از همان‌جا ادامه دهید.' :
    'برای ورود به آکادمی جادوگری آرکادیا، آزمون شخصیت‌شناسی را کامل کنید.';
  const rows = [];
  if (!app || ['not_started', 'in_progress'].includes(app.status)) rows.push([{ text: app?.status === 'in_progress' ? '▶️ ادامه آزمون' : '🪄 آغاز آزمون شخصیت‌شناسی', callback_data: 'arc:begin' }]);
  rows.push([{ text: '📜 وضعیت درخواست من', callback_data: 'arc:status' }]);
  rows.push([{ text: '🏰 دربارهٔ آرکادیا', callback_data: 'arc:about' }]);
  return sendToUser(token, user.id,
    '🏰 آکادمی جادوگری آرکادیا\n\n' +
    'به آستانهٔ قلعه خوش آمدی، ' + (user.firstName || 'جادوگر جوان') + '.\n' +
    'پذیرش بر پایهٔ آزمون شخصیت‌شناسی و بررسی نهایی مدیران انجام می‌شود.\n\n' + status,
    { reply_markup: { inline_keyboard: rows } });
}

async function showQuestion(env, token, user, index, app) {
  const q = QUESTIONS[index];
  if (!q) return finishApplication(env, token, user, app, {});
  const rows = q.a.map((answer, i) => [{ text: answer[0], callback_data: 'arc:q:' + index + ':' + i }]);
  rows.push([{ text: '⏸ ذخیره و خروج', callback_data: 'arc:pause' }]);
  return sendToUser(token, user.id,
    '🪄 آزمون شخصیت‌شناسی آرکادیا\n' +
    'پرسش ' + (index + 1) + ' از ' + QUESTIONS.length + '\n\n' + q.q,
    { reply_markup: { inline_keyboard: rows } });
}

async function begin(env, token, user) {
  let app = await getJson(env, appKey(user.id), null);
  if (!app || app.status === 'not_started' || app.status === 'rejected') {
    app = {
      userId: String(user.id), status: 'in_progress', answers: [], scores: {},
      createdAt: Date.now(), updatedAt: Date.now(), submittedAt: 0, reviewedAt: 0,
    };
  } else if (app.status === 'pending_review' || app.status === 'approved') {
    return home(env, token, user);
  } else {
    app.status = 'in_progress';
  }
  app.updatedAt = Date.now();
  await putJson(env, appKey(user.id), app);
  await recordEvent(env, user, 'quiz_started', { questionIndex: app.answers.length });
  return showQuestion(env, token, user, app.answers.length, app);
}

async function chooseAnswer(env, token, user, settings, index, option) {
  const app = await getJson(env, appKey(user.id), null);
  if (!app || app.status !== 'in_progress' || index !== app.answers.length) return sendToUser(token, user.id, 'این مرحله دیگر فعال نیست. از منوی آرکادیا آزمون را ادامه دهید.');
  const question = QUESTIONS[index], answer = question?.a[option];
  if (!answer) return;
  app.answers.push({ questionIndex: index, question: question.q, optionIndex: option, answer: answer[0], house: answer[1], at: Date.now() });
  app.scores[answer[1]] = (app.scores[answer[1]] || 0) + 1;
  app.updatedAt = Date.now();
  await putJson(env, appKey(user.id), app);
  await recordEvent(env, user, 'quiz_answer', { questionIndex: index, optionIndex: option, house: answer[1] });
  return index + 1 >= QUESTIONS.length ? finishApplication(env, token, user, app, settings) : showQuestion(env, token, user, index + 1, app);
}

async function finishApplication(env, token, user, app, settings = {}) {
  const ranked = Object.entries(app.scores || {}).sort((a, b) => b[1] - a[1] || ['gryffindor','slytherin','ravenclaw','hufflepuff'].indexOf(a[0]) - ['gryffindor','slytherin','ravenclaw','hufflepuff'].indexOf(b[0]));
  app.suggestedHouse = ranked[0]?.[0] || '';
  app.status = 'pending_review';
  app.submittedAt = Date.now();
  app.updatedAt = Date.now();
  await putJson(env, appKey(user.id), app);
  await recordEvent(env, user, 'application_submitted', { suggestedHouse: app.suggestedHouse });
  await sendToUser(token, user.id,
    '📜 آزمون با موفقیت ثبت شد.\n\n' +
    'گروه پیشنهادی آزمون: ' + (HOUSES[app.suggestedHouse] || 'نامشخص') + '\n' +
    'نتیجهٔ نهایی پس از بررسی مدیران اعلام می‌شود.\n\n' +
    'شناسهٔ درخواست: ' + user.id);
  const adminId = settings.adminId || settingsAdminId(env);
  if (adminId) await sendToUser(token, adminId,
    '🔔 درخواست پذیرش جدید آرکادیا\n\n' + displayName(user) + '\nشناسه: ' + user.id +
    '\nگروه پیشنهادی: ' + (HOUSES[app.suggestedHouse] || 'نامشخص') +
    '\nپاسخ‌ها: ' + app.answers.length + '/' + QUESTIONS.length +
    '\n\nبرای بررسی: /arcadia',
  );
}

function settingsAdminId(env) { return env.ARCADIA_ADMIN_ID || env.ADMIN_ID || ''; }

async function applicationDetails(env, token, admin, userId) {
  const app = await getJson(env, appKey(userId), null);
  const user = await getJson(env, 'user:' + String(userId), null);
  if (!app || !user) return sendToUser(token, admin.id, 'درخواست پیدا نشد.');
  const lines = [
    '📋 پروندهٔ پذیرش آرکادیا',
    'نام: ' + displayName(user),
    'شناسه تلگرام: ' + user.id,
    'وضعیت: ' + app.status,
    'گروه پیشنهادی: ' + (HOUSES[app.suggestedHouse] || 'هنوز تعیین نشده'),
    'پاسخ‌ها: ' + app.answers.length + '/' + QUESTIONS.length,
    '',
    ...app.answers.map((a, i) => (i + 1) + ') ' + a.question + '\n↳ ' + a.answer),
  ];
  const rows = [];
  if (app.status === 'pending_review') {
    rows.push([{ text: '✅ تأیید پذیرش', callback_data: 'arc:admin:approve:' + userId }]);
    rows.push([{ text: '❌ رد درخواست', callback_data: 'arc:admin:reject:' + userId }]);
  }
  rows.push([{ text: '⬅️ فهرست درخواست‌ها', callback_data: 'arc:admin:list' }]);
  return sendToUser(token, admin.id, lines.join('\n'), { reply_markup: { inline_keyboard: rows } });
}

async function adminList(env, token, admin) {
  const apps = (await allEntities(env, 'arcadia:application')).filter(a => ['pending_review','approved','rejected'].includes(a.status)).sort((a,b) => (b.submittedAt || 0) - (a.submittedAt || 0)).slice(0, 20);
  if (!apps.length) return sendToUser(token, admin.id, 'هنوز پرونده‌ای ثبت نشده است.');
  const rows = apps.map(a => [{ text: (HOUSES[a.suggestedHouse] || 'بدون گروه') + ' · ' + a.userId + ' · ' + a.status, callback_data: 'arc:admin:view:' + a.userId }]);
  rows.push([{ text: '🔄 تازه‌سازی', callback_data: 'arc:admin:list' }]);
  return sendToUser(token, admin.id, '🏰 پرونده‌های پذیرش آرکادیا\nبرای مشاهدهٔ پاسخ‌ها، یک پرونده را انتخاب کن:', { reply_markup: { inline_keyboard: rows } });
}

async function review(env, token, admin, userId, action) {
  const app = await getJson(env, appKey(userId), null);
  const target = await getJson(env, 'user:' + String(userId), null);
  if (!app || !target || app.status !== 'pending_review') return sendToUser(token, admin.id, 'این پرونده در انتظار بررسی نیست.');
  app.status = action === 'approve' ? 'approved' : 'rejected';
  app.reviewedAt = Date.now();
  app.reviewedBy = String(admin.id);
  await putJson(env, appKey(userId), app);
  await recordEvent(env, target, action === 'approve' ? 'application_approved' : 'application_rejected', { reviewedBy: String(admin.id) });
  await sendToUser(token, target.id, action === 'approve'
    ? '🏰 پذیرش تو در آکادمی آرکادیا تأیید شد! گروه تو: ' + (HOUSES[app.suggestedHouse] || 'در انتظار تعیین گروه') + '.'
    : 'درخواست پذیرش تو در این مرحله تأیید نشد. برای اطلاعات بیشتر با مدیران آرکادیا تماس بگیر.');
  await sendToUser(token, admin.id, '✅ نتیجهٔ بررسی ثبت شد.');
  return adminList(env, token, admin);
}

export async function arcadiaMessage(env, token, user, settings, lang, msg) {
  if (settings.botPurpose !== 'arcadia') return false;
  const text = String(msg.text || '').trim();
  const cmd = text.startsWith('/') ? text.split(/\\s+/)[0].split('@')[0].toLowerCase() : '';
  if (cmd === '/arcadia' || cmd === '/admissions') {
    if (!isAdmin(env, settings, user)) return sendToUser(token, user.id, '⛔ این فرمان مخصوص مدیران پذیرش است.');
    return adminList(env, token, user);
  }
  if (cmd === '/start') {
    const now = Date.now();
    const first = !user.arcadiaFirstStartAt;
    user.arcadiaFirstStartAt = user.arcadiaFirstStartAt || now;
    user.arcadiaStartCount = (user.arcadiaStartCount || 0) + 1;
    user.arcadiaLastStartAt = now;
    await putJson(env, 'user:' + String(user.id), user);
    await recordEvent(env, user, 'start', { firstStart: first });
    if (first) {
      const adminId = settings.adminId || settingsAdminId(env);
      if (adminId) await sendToUser(token, adminId, '👤 ورود داوطلب جدید به آرکادیا\n' + displayName(user) + '\nشناسه: ' + user.id + '\nزمان: ' + new Date(now).toISOString());
    }
    return home(env, token, user);
  }
  return false;
}

export async function arcadiaCallback(env, token, user, settings, cb, { adminOnly = false } = {}) {
  const data = String(cb.data || '');
  if (!data.startsWith('arc:')) return false;
  const answer = (message = '', alert = false) => tgApi(token, 'answerCallbackQuery', { callback_query_id: cb.id, text: message, show_alert: alert });
  if (data.startsWith('arc:admin:')) {
    if (!isAdmin(env, settings, user)) { await answer('دسترسی غیرمجاز', true); return true; }
    const [, , action, id] = data.split(':');
    if (action === 'list') await adminList(env, token, user);
    else if (action === 'view') await applicationDetails(env, token, user, id);
    else if (action === 'approve' || action === 'reject') await review(env, token, user, id, action);
    await answer();
    return true;
  }
  if (adminOnly) return false;
  const chatId = cb.message?.chat?.id;
  if (!chatId || Number(chatId) < 0) { await answer('این بخش را در گفتگوی خصوصی باز کنید.', true); return true; }
  if (data === 'arc:begin') await begin(env, token, user);
  else if (data === 'arc:status') {
    const app = await getJson(env, appKey(user.id), null);
    await sendToUser(token, user.id, app
      ? 'وضعیت درخواست: ' + app.status + '\nگروه پیشنهادی: ' + (HOUSES[app.suggestedHouse] || 'هنوز تعیین نشده')
      : 'هنوز آزمونی برای شما ثبت نشده است.');
  } else if (data === 'arc:about') {
    await sendToUser(token, user.id, 'آرکادیا یک جهان جادویی با چهار گروه اصلی هاگوارتز است: گریفیندور، اسلیترین، ریونکلا و هافلپاف. خاندان‌ها ساختاری جدا از گروه‌های اصلی دارند. پذیرش با آزمون شخصیت‌شناسی و تأیید مدیر انجام می‌شود.');
  } else if (data === 'arc:pause') {
    const app = await getJson(env, appKey(user.id), null);
    if (app?.status === 'in_progress') await putJson(env, appKey(user.id), { ...app, updatedAt: Date.now() });
    await home(env, token, user);
  } else if (data.startsWith('arc:q:')) {
    const [, , q, a] = data.split(':');
    await chooseAnswer(env, token, user, settings, Number(q), Number(a));
  } else { await answer('گزینه نامعتبر است.', true); return true; }
  await answer();
  return true;
}
