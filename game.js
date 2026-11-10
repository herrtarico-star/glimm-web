/* Glimm 2.0 — game, meta systems, audio, UI */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const stage = $('stage'), cv = $('c'), ctx = cv.getContext('2d');
  const lm = document.createElement('canvas'), lctx = lm.getContext('2d');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
  function mulberry(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  const todayUTC = () => new Date().toISOString().slice(0, 10);
  const yesterdayUTC = () => new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const dayBeforeUTC = () => new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10);
  const dayNum = () => Math.floor(Date.now() / 86400000);
  const SPARK_SVG = '<svg class="spark-ico" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2c.6 3.6 2.6 5.6 6 6-3.4.4-5.4 2.4-6 6-.6-3.6-2.6-5.6-6-6 3.4-.4 5.4-2.4 6-6z"/></svg>';

  /* ================= content ================= */
  const WORLDS = [
    { id: 'grotto', unlock: null, emoji: '✨',
      bg: ['#1b0f4a', '#3d1b85', '#2c1166', '#140838'], haze: '255,110,220',
      layers: [[78, 38, 150], [58, 26, 120], [38, 16, 88]],
      rock: ['#7ff6e8', '#2cc4d2', '#1d7cb8', '#283f8c'], rim: '210,255,250', moss: ['255,110,205', '235,80,185'],
      decoA: '#ff7ad9', decoAGlow: [255, 110, 220], decoB: '#ffe066', decoBGlow: [255, 220, 90],
      worm: [110, 255, 230], floor: 'water', water: ['70,24,140', '24,8,60'], amb: [[118, 86, 180], [185, 150, 240]],
      particles: 'dust', root: 50, scale: [0, 2, 3, 7, 9], mod: { gap: 1, speed: 1, drain: 1, spark: 1, move: 0 } },
    { id: 'ice', unlock: { best: 15, cost: 500 }, emoji: '❄️',
      bg: ['#0b2a73', '#2269e0', '#1a4fb8', '#0a1f5a'], haze: '170,245,255',
      layers: [[44, 120, 225], [32, 92, 190], [22, 64, 150]],
      rock: ['#ffffff', '#c4f5ff', '#71ccff', '#3d80e6'], rim: '255,255,255', moss: ['215,190,255', '190,160,255'],
      decoA: '#c9a8ff', decoAGlow: [200, 160, 255], decoB: '#7ff0ff', decoBGlow: [120, 240, 255],
      worm: [170, 245, 255], floor: 'ice', water: ['90,170,250', '24,70,160'], amb: [[110, 150, 220], [170, 210, 255]],
      particles: 'snow', root: 52, scale: [0, 2, 4, 7, 11], mod: { gap: .9, speed: .9, drain: 1, spark: 1, move: 0 } },
    { id: 'crystal', unlock: { best: 30, cost: 1200 }, emoji: '💎',
      bg: ['#3d0749', '#951c99', '#651072', '#24042e'], haze: '255,110,235',
      layers: [[128, 32, 148], [98, 22, 118], [66, 14, 86]],
      rock: ['#ffa8f2', '#e64fdb', '#a02dbd', '#5e1b85'], rim: '255,225,255', moss: ['110,255,215', '80,235,195'],
      decoA: '#5fffd0', decoAGlow: [90, 255, 200], decoB: '#7df9ff', decoBGlow: [120, 240, 255],
      worm: [255, 170, 250], floor: 'water', water: ['100,22,120', '38,6,50'], amb: [[140, 78, 160], [210, 150, 230]],
      particles: 'dust', root: 45, scale: [0, 3, 5, 7, 10], mod: { gap: 1, speed: 1, drain: 1, spark: 1, move: 1 } },
    { id: 'lava', unlock: { best: 45, cost: 2500 }, emoji: '🌋',
      bg: ['#4d0a14', '#bf2a1f', '#821616', '#2c0509'], haze: '255,190,60',
      layers: [[160, 44, 32], [126, 32, 26], [86, 22, 18]],
      rock: ['#c79bff', '#8a52e6', '#56299e', '#2e1263'], rim: '255,215,140', moss: ['255,200,60', '255,150,40'],
      decoA: '#ffe45c', decoAGlow: [255, 225, 80], decoB: '#ff5ca8', decoBGlow: [255, 90, 170],
      worm: [255, 210, 100], floor: 'lava', water: ['210,64,20', '110,20,10'], amb: [[160, 90, 80], [230, 160, 140]],
      particles: 'embers', root: 48, scale: [0, 1, 5, 7, 8], mod: { gap: 1, speed: 1.05, drain: 1.4, spark: 1.3, move: .5 } },
  ];
  const SPECIES = [
    { id: 'glimm', light: [255, 200, 110], abd: '#f6d873', body: '#2a2232', head: '#f08a4b', wing: '220,240,255', how: { t: 'free' } },
    { id: 'moth', light: [175, 205, 255], abd: '#e2eaff', body: '#3a3f55', head: '#b9c4e6', wing: '232,238,255', how: { t: 'buy', n: 400 } },
    { id: 'ruby', light: [255, 115, 145], abd: '#ff94ad', body: '#3a1f2a', head: '#ff5577', wing: '255,222,236', how: { t: 'buy', n: 800 } },
    { id: 'emerald', light: [120, 255, 150], abd: '#a8ffba', body: '#1f3326', head: '#4fd17a', wing: '222,255,232', how: { t: 'buy', n: 1200 } },
    { id: 'aurora', light: 'hue', abd: '#c4fff0', body: '#252040', head: '#9b7bff', wing: '226,240,255', how: { t: 'buy', n: 3000 } },
    { id: 'frost', light: [150, 235, 255], abd: '#cdf6ff', body: '#24384a', head: '#7fd6f2', wing: '236,250,255', how: { t: 'best', n: 50 } },
    { id: 'sun', light: [255, 240, 185], abd: '#fff3bd', body: '#4a3520', head: '#ffb23f', wing: '255,246,218', how: { t: 'daily' } },
    { id: 'lantern', light: [255, 152, 72], abd: '#ffb274', body: '#3a2418', head: '#e8563a', wing: '255,232,212', how: { t: 'event', e: 'lantern' } },
    { id: 'comet', light: [205, 222, 255], abd: '#f0f4ff', body: '#1d2340', head: '#7aa2ff', wing: '232,240,255', how: { t: 'event', e: 'comet' } },
    { id: 'mist', light: [190, 255, 236], abd: '#dcfff3', body: '#2c3a3a', head: '#9fe0cf', wing: '236,255,250', how: { t: 'event', e: 'mist' } },
    { id: 'bloom', light: [255, 172, 230], abd: '#ffc8ec', body: '#3a2238', head: '#ff7fcf', wing: '255,232,246', how: { t: 'event', e: 'bloom' } },
    { id: 'regal', light: [255, 215, 120], abd: '#ffe08a', body: '#3b2a10', head: '#d9a520', wing: '255,240,200', how: { t: 'pass' } },
    { id: 'vip', light: [190, 170, 255], abd: '#d9ceff', body: '#1c1640', head: '#ffd36b', wing: '235,230,255', how: { t: 'vip' } },
    { id: 'prism', light: 'hue', abd: '#ffffff', body: '#2a2a3a', head: '#ff8ad8', wing: '245,245,255', how: { t: 'capsule' } },
  ];
  const EVENTS = [
    { id: 'lantern', color: [255, 160, 80], shape: 'lantern', goal: 50, reward: 'lantern', emoji: '🏮' },
    { id: 'comet', color: [200, 220, 255], shape: 'star', goal: 50, reward: 'comet', emoji: '🌠' },
    { id: 'mist', color: [170, 255, 225], shape: 'orb', goal: 50, reward: 'mist', emoji: '☁️' },
    { id: 'bloom', color: [255, 160, 220], shape: 'flower', goal: 50, reward: 'bloom', emoji: '🌸' },
  ];
  const UPGRADES = [
    { id: 'magnet', ic: '🧲', costs: [200, 400, 700, 1100, 1600], val: l => 5 + l * 1.5 },
    { id: 'beacon', ic: '☀️', costs: [200, 400, 700, 1100, 1600], val: l => 4 + l },
    { id: 'keeper', ic: '🕯️', costs: [300, 600, 1000, 1500, 2200], val: l => l * 4 },
  ];
  const MISSION_POOL = [
    { type: 'runScore', n: [6, 12, 20], r: [40, 70, 120] },
    { type: 'sparks', n: [15, 30, 55], r: [40, 70, 110] },
    { type: 'rocks', n: [25, 50, 90], r: [40, 70, 110] },
    { type: 'runs', n: [3, 5, 8], r: [30, 50, 80] },
    { type: 'streak', n: [3, 5, 8], r: [50, 80, 130] },
    { type: 'perfect', n: [2, 4, 7], r: [50, 80, 130] },
  ];
  const DAILY_REWARDS = [50, 80, 120, 160, 220, 300, 'sun'];
  const ACH = [
    { id: 'first', r: 20, ok: s => s.runs >= 1 },
    { id: 's10', r: 50, ok: s => s.best >= 10 },
    { id: 's25', r: 100, ok: s => s.best >= 25 },
    { id: 's50', r: 250, ok: s => s.best >= 50 },
    { id: 's100', r: 600, ok: s => s.best >= 100 },
    { id: 'sp100', r: 50, ok: s => s.totalSparks >= 100 },
    { id: 'sp1000', r: 250, ok: s => s.totalSparks >= 1000 },
    { id: 'streak10', r: 150, ok: s => s.stats.maxStreak >= 10 },
    { id: 'perf10', r: 150, ok: s => s.stats.maxPerf >= 10 },
    { id: 'daily', r: 50, ok: s => s.stats.dailyRuns >= 1 },
    { id: 'worlds', r: 400, ok: s => s.worlds.length >= WORLDS.length },
    { id: 'coll5', r: 300, ok: s => s.owned.length >= 5 },
    { id: 'runs50', r: 250, ok: s => s.runs >= 50 },
  ];
  const PREMIUM = [
    { id: 'starter', ic: '🎁', price: 1.99 },
    { id: 'piggy', ic: '🐷', price: 2.99 },
    { id: 'vip', ic: '👑', price: 2.99, sub: true },
    { id: 'pass', ic: '🎟️', price: 4.99 },
    { id: 'noads', ic: '🚫', price: 3.99 },
    { id: 'small', ic: '👝', price: 1.99 },
    { id: 'big', ic: '🧰', price: 4.99 },
    { id: 'supp', ic: '💛', price: 9.99 },
  ];
  let CONT_PRICES = [100, 200, 500];
  let LIVES_MAX = 5, LIFE_MS = 30 * 60000;
  const PASS_LEVELS = 20, PASS_XP = 60;
  const PIGGY_CAP = 3000, PIGGY_MIN = 600;
  let CAPSULE_COST = 300;
  let STARTER_MS = 48 * 3600000;
  const TAILWIND_ROCKS = 8;
  const byId = (list, id) => list.find(x => x.id === id);


  /* ================= journey levels + light village ================= */
  // Levels are fixed (seeded) so players can learn them; same rules for everyone.
  const GOAL_IC = { rocks: '🎯', sparks: '✨', perfect: '💫' };
  const BOOST_COST = 60, VILLAGE_REWARD = 25, AREA_REWARD = 500;
  function levelDef(n) {
    const wi = Math.floor((n - 1) / 15) % 4, cycle = Math.floor((n - 1) / 60), i = (n - 1) % 15;
    const hard = n >= 10 && n % 5 === 0;
    const kinds = ['rocks', 'sparks', 'rocks', 'perfect', 'rocks', 'sparks'];
    const kind = n <= 3 ? 'rocks' : kinds[n % kinds.length];
    const base = n + cycle * 10;
    let target = kind === 'rocks' ? Math.min(60, 6 + Math.round(base * .55)) : kind === 'sparks' ? Math.min(40, 4 + Math.round(base * .35)) : Math.min(14, 2 + Math.floor(base / 9));
    if (hard) target = Math.round(target * 1.3);
    const k = n <= 3 ? .6 : Math.max(.7, Math.min(1.35, .72 + i * .025 + cycle * .08 + (hard ? .1 : 0)));
    return { n, wi, kind, target, hard, k, seed: 'glimm-lvl-' + n };
  }
  const VILLAGE = [
    { id: 'shore', sky: ['#2a0f5c', '#6a2a9a'], hill: '#3b2a7a', ground: '#2d6b5a', water: '#3a5fd0', items: [
      ['lantern', .1, .74, 1], ['path', .3, .76, 1], ['house', .24, .62, 2], ['flowers', .44, .74, 1], ['mushroom', .08, .6, 2], ['well', .45, .63, 2],
      ['bridge', .68, .84, 2], ['lantern', .86, .74, 1], ['tree', .62, .58, 2], ['house', .82, .6, 3], ['garland', .5, .3, 2], ['mill', .93, .5, 3]] },
    { id: 'market', sky: ['#0f2a5c', '#4a1a80'], hill: '#2a3f8a', ground: '#4a2a7a', water: null, items: [
      ['lantern', .1, .76, 1], ['stall', .3, .74, 2], ['crystal', .08, .6, 2], ['stall', .72, .74, 2], ['lantern', .52, .82, 1], ['fountain', .52, .66, 2],
      ['crystal', .92, .62, 2], ['house', .26, .56, 2], ['tower', .8, .56, 3], ['flowers', .64, .82, 1], ['garland', .5, .3, 2], ['tree', .4, .5, 3]] },
  ];
  const VI_ICON = { lantern: '🏮', path: '✨', house: '🏠', flowers: '🌸', mushroom: '🍄', well: '💧', bridge: '🌉', tree: '🌳', garland: '🎊', mill: '⚙️', stall: '🎪', crystal: '💎', tower: '🗼', fountain: '⛲' };

  /* ================= save ================= */
  const SAVE_KEY = 'glimm-save-v2';
  const DEFAULT = () => ({
    v: 2, lang: null, sound: true, music: true, vib: true, quality: 'auto',
    sparks: 0, totalSparks: 0, best: 0, bestByWorld: {}, runs: 0,
    owned: ['glimm'], selected: 'glimm', upgrades: { magnet: 0, beacon: 0, keeper: 0 },
    worlds: ['grotto'], world: 'grotto', missions: null, daily: { last: null, streak: 0 }, ach: {}, events: {},
    noAds: false, dailyRun: { date: null, best: 0, ghost: null }, top: [], tutorial: false,
    stats: { perfects: 0, dailyRuns: 0, continues: 0, maxStreak: 0, maxPerf: 0, rocks: 0, adsWatched: 0 }, analytics: {}, adRuns: 0,
    recent: [], tailwind: true, ab: {},
    musicVol: .5, level: 1, lvlStars: {}, stars: 0, village: { a: 0, done: 0 },
    freezes: 0, bandit: {}, notifPending: {}, league: { id: null, name: '', joined: false, tier: 0, week: null, xp: 0, seen: null },
    consent: null, playStreak: { days: 0, last: null }, playHours: [], sessions: [], lastSession: null, skill: 0, pushAsk: { n: 0, at: 0, granted: false },
    firstSeen: Date.now(), lives: 5, livesT: Date.now(), piggy: 0, pass: null, vip: false, payer: false, starterBought: false, vipClaim: null,
  });
  function load() {
    const d = DEFAULT(); let s = null;
    try { s = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch {}
    if (!s) {
      try {
        const old = +localStorage.getItem('glimm-best');
        if (old) { d.best = old; d.bestByWorld.grotto = old; }
        if (localStorage.getItem('glimm-mute') === '1') { d.sound = false; d.music = false; }
      } catch {}
      return d;
    }
    return Object.assign(d, s, {
      upgrades: Object.assign(d.upgrades, s.upgrades || {}), stats: Object.assign(d.stats, s.stats || {}),
      daily: Object.assign(d.daily, s.daily || {}), dailyRun: Object.assign(d.dailyRun, s.dailyRun || {}),
    });
  }
  let SV = load();
  function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(SV)); } catch {} }

  /* ================= i18n ================= */
  const L = window.GLIMM_I18N || { en: {} };
  const LANGS = Object.keys(L);
  const detectLang = () => (navigator.languages || [navigator.language || 'en']).map(x => String(x).slice(0, 2).toLowerCase()).find(x => LANGS.includes(x)) || 'en';
  let lang = SV.lang && LANGS.includes(SV.lang) ? SV.lang : detectLang();
  function t(k, v) {
    let s = (L[lang] && L[lang][k]) ?? (L.en && L.en[k]) ?? (L.de && L.de[k]) ?? k;
    if (v) for (const key in v) s = s.split('{' + key + '}').join(v[key]);
    return s;
  }
  let nfCache = null;
  const fmt = n => { if (!nfCache || nfCache.l !== lang) nfCache = { l: lang, f: new Intl.NumberFormat(lang) }; return nfCache.f.format(n); };
  const money = p => { try { return new Intl.NumberFormat(lang, { style: 'currency', currency: 'EUR' }).format(p); } catch { return p + ' €'; } };
  function applyI18n() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  }

  /* ================= analytics & native bridge ================= */
  // In the app, window.GlimmNative can provide: track(name, props), showRewarded(placement) -> Promise<bool>,
  // showInterstitial(), purchase(productId) -> Promise<bool>, share({text, image}).
  const Native = () => window.GlimmNative || null;
  // A/B tests: each install gets a fixed variant per experiment. Variants change pacing only, never fairness.
  const EXPERIMENTS = { interEvery: [1, 2], contSecs: [6, 8], firstInterRun: [3, 5], energy: [0, 1] };
  function ab(key) {
    if (!SV.ab) SV.ab = {};
    const v = EXPERIMENTS[key];
    if (SV.ab[key] === undefined || SV.ab[key] >= v.length) { SV.ab[key] = Math.floor(Math.random() * v.length); save(); }
    return v[SV.ab[key]];
  }
  // Live-ops (like server-side rules in top games): a JSON config can retune the game without an app update.
  // It is cached and applied on the next start so a session never changes mid-play.
  const TUNE = { gapBase: 218, gapShrink: 62, speedBase: 172, speedRamp: 1.3, drain: .05, interCooldownSec: 45, offers: true, freezeCost: 200 };
  let RC_VERSION = 'default', LEAGUE_URL = window.GLIMM_LEAGUE_URL || null;
  function applyConfig(c) {
    if (!c || typeof c !== 'object') return;
    const LIM = { gapBase: [150, 320], gapShrink: [0, 120], speedBase: [100, 300], speedRamp: [0, 3], drain: [0, .2], interCooldownSec: [20, 600], freezeCost: [0, 5000] };
    for (const k of Object.keys(TUNE)) if (typeof c[k] === typeof TUNE[k] && (typeof c[k] !== 'number' || Number.isFinite(c[k]))) TUNE[k] = LIM[k] ? clamp(c[k], LIM[k][0], LIM[k][1]) : c[k];
    if (Array.isArray(c.contPrices) && c.contPrices.length && c.contPrices.every(Number.isFinite)) CONT_PRICES = c.contPrices.slice(0, 5);
    if (Number.isFinite(c.livesMax)) LIVES_MAX = clamp(c.livesMax, 1, 20);
    if (Number.isFinite(c.lifeMinutes)) LIFE_MS = clamp(c.lifeMinutes, 1, 240) * 60000;
    if (Number.isFinite(c.capsuleCost)) CAPSULE_COST = clamp(c.capsuleCost, 50, 5000);
    if (Number.isFinite(c.starterHours)) STARTER_MS = clamp(c.starterHours, 1, 168) * 3600000;
    if (c.experiments && typeof c.experiments === 'object') for (const [k, v] of Object.entries(c.experiments)) if (Array.isArray(v) && v.length) EXPERIMENTS[k] = v;
    if (typeof c.leagueUrl === 'string' && /^https:\/\//.test(c.leagueUrl)) LEAGUE_URL = c.leagueUrl.replace(/\/$/, '');
    if (c.version) RC_VERSION = String(c.version);
  }
  function loadConfig() {
    try { applyConfig(JSON.parse(localStorage.getItem('glimm-rc') || 'null')); } catch {}
    const keep = c => { if (!c || typeof c !== 'object') return; try { localStorage.setItem('glimm-rc', JSON.stringify(c)); } catch {} Analytics.track('config_loaded', { v: c.version || '?' }); };
    const n = Native();
    if (n && n.remoteConfig) { Promise.resolve(n.remoteConfig()).then(keep).catch(() => {}); return; }
    if (window.GLIMM_CONFIG_URL) fetch(window.GLIMM_CONFIG_URL, { cache: 'no-store' }).then(x => x.ok ? x.json() : null).then(keep).catch(() => {});
  }
  loadConfig();
  Object.keys(EXPERIMENTS).forEach(ab);
  const abTag = () => Object.keys(EXPERIMENTS).map(k => k + ':' + SV.ab[k]).join(',');
  const Analytics = {
    log: [],
    track(name, props = {}) {
      props = Object.assign({ ab: abTag() }, props);
      const e = Object.assign({ name, t: Date.now() }, props);
      this.log.push(e); if (this.log.length > 300) this.log.shift();
      SV.analytics[name] = (SV.analytics[name] || 0) + 1;
      if (SV.consent && SV.consent.analytics) { try { Native()?.track?.(name, props); } catch {} }
    },
  };
  window.glimmAnalytics = Analytics;

  const Ads = {
    lastInter: 0,
    rewarded(placement) {
      Analytics.track('ad_rewarded', { placement });
      const n = Native();
      const done = ok => { if (ok) { SV.stats.adsWatched = (SV.stats.adsWatched || 0) + 1; save(); } return ok; };
      if (n && n.showRewarded) return Promise.resolve(n.showRewarded(placement)).then(Boolean).catch(() => false).then(done);
      return new Promise(res => {
        const o = $('adO'); o.hidden = false; duck(true);
        let k = 3; $('adCount').textContent = t('adSkip', { n: k });
        const iv = setInterval(() => {
          k--; if (k > 0) { $('adCount').textContent = t('adSkip', { n: k }); return; }
          clearInterval(iv); o.hidden = true; duck(false); res(done(true));
        }, 1000);
      });
    },
    maybeInterstitial() {
      if (SV.noAds || SV.vip) return;
      SV.adRuns = (SV.adRuns || 0) + 1;
      const now = Date.now(), pv = playerValue();
      let every = SV.payer ? 4 : ab('interEvery'), first = SV.payer ? 9 : ab('firstInterRun');
      if (pv && !SV.payer) { if (pv.buy > .5) { every = Math.max(every, 2); first = Math.max(first, 5); } else if (pv.ad > .5) every = 1; }
      if (SV.runs < first || SV.adRuns < every || now - this.lastInter < TUNE.interCooldownSec * 1000) return;
      SV.adRuns = 0; this.lastInter = now;
      Analytics.track('ad_interstitial');
      try { Native()?.showInterstitial?.(); } catch {}
    },
    banner(on) {
      if (SV.noAds || SV.vip) on = false;
      try { const n = Native(); document.body.classList.toggle('has-banner', !!(on && n && n.showBanner)); if (n) on ? n.showBanner?.() : n.hideBanner?.(); } catch {}
    },
  };
  const IAP = {
    buy(id) {
      Analytics.track('iap_click', { id });
      const n = Native();
      if (n && n.purchase) { Promise.resolve(n.purchase(id)).then(ok => { if (ok === true) grantPurchase(id); else if (ok === 'unavailable') toast(t('iapSoon')); }).catch(() => {}); return; }
      toast(t('iapOnly'));
    },
  };
  function grantPurchase(id) {
    SV.payer = true;
    if (id === 'noads') { SV.noAds = true; Ads.banner(false); }
    if (id === 'small') addWallet(1500);
    if (id === 'big') { addWallet(5000); own('moth'); }
    if (id === 'supp') { SV.noAds = true; addWallet(8000); Ads.banner(false); }
    if (id === 'starter') { SV.starterBought = true; addWallet(2000); own('moth'); own('ruby'); }
    if (id === 'piggy') { addWallet(SV.piggy); SV.piggy = 0; }
    if (id === 'vip') { SV.vip = true; own('vip'); Ads.banner(false); }
    if (id === 'pass') passState().premium = true;
    Analytics.track('iap_success', { id }); save(); sfx.unlock(); toast('✓ ' + t('thanks')); refreshAll();
  }

  /* ================= glow sprites ================= */
  const glowCache = new Map();
  function getGlow(rgb, soft) {
    const key = rgb.join(',') + (soft ? 's' : 'h');
    let c = glowCache.get(key); if (c) return c;
    c = mk(128, 128); const x = c.getContext('2d'), gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    const stops = soft ? [[0, 1], [.3, .72], [.62, .26], [1, 0]] : [[0, 1], [.12, .75], [.35, .22], [.7, .05], [1, 0]];
    for (const [o, a] of stops) gr.addColorStop(o, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`);
    x.fillStyle = gr; x.fillRect(0, 0, 128, 128); glowCache.set(key, c); return c;
  }
  const WHITE = [255, 252, 235], GOLD = [255, 215, 70], WARM = [255, 200, 110];
  const CONFETTI = [[255, 215, 70], [255, 80, 165], [70, 230, 255], [110, 255, 120], [190, 120, 255]];
  const glow = (c, spr, x, y, r, a = 1) => { if (a <= 0 || r <= 0) return; c.globalAlpha = Math.min(1, a); c.drawImage(spr, x - r, y - r, r * 2, r * 2); };
  function hsl(h, s, l) {
    s /= 100; l /= 100; const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
  }
  const lightOf = (s, time) => s.light === 'hue' ? hsl(Math.round(((time * 40) % 360) / 15) * 15, 100, 74) : s.light;

  /* ================= noise ================= */
  function pnoise(P, r = Math.random) {
    const v = Array.from({ length: P }, r);
    return x => { const i = Math.floor(x), f = x - i, a = v[((i % P) + P) % P], b = v[(((i + 1) % P) + P) % P], u = f * f * (3 - 2 * f); return a + (b - a) * u; };
  }
  function fbm(P) { const n = [pnoise(P), pnoise(P * 2), pnoise(P * 4), pnoise(P * 8)]; return u => n[0](u) * .5 + n[1](u * 2) * .27 + n[2](u * 4) * .15 + n[3](u * 8) * .08; }
  function smoothPath(x, pts) {
    x.lineTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length - 1; i++) x.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
    x.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
  }

  /* ================= view / quality ================= */
  let W = 0, H = 0, S = 1, dpr = 1, lowQ = false, autoLow = false;
  const FLOOR = () => H - 50 * S;
  let world = byId(WORLDS, SV.world) || WORLDS[0];
  let menuWi = Math.max(0, WORLDS.indexOf(world));
  let sp = byId(SPECIES, SV.selected) || SPECIES[0];

  let bgC, vigC, layers = [], ambient = [];
  function buildBackdrops() {
    const w = world;
    bgC = mk(W * dpr, H * dpr); let x = bgC.getContext('2d'); x.scale(dpr, dpr);
    let g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, w.bg[0]); g.addColorStop(.45, w.bg[1]); g.addColorStop(.8, w.bg[2]); g.addColorStop(1, w.bg[3]);
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    g = x.createRadialGradient(W * .78, H * .38, 0, W * .78, H * .38, H * .55);
    g.addColorStop(0, `rgba(${w.haze},.38)`); g.addColorStop(1, `rgba(${w.haze},0)`);
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    vigC = mk(W * dpr, H * dpr); x = vigC.getContext('2d'); x.scale(dpr, dpr);
    g = x.createRadialGradient(W / 2, H * .48, Math.min(W, H) * .35, W / 2, H * .48, Math.hypot(W, H) * .62);
    g.addColorStop(0, 'rgba(20,4,45,0)'); g.addColorStop(1, 'rgba(20,4,45,.55)');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    const defs = [
      { speed: .06, ceil: [.10, .16], floor: [.10, .14], spikes: 6, sl: [.08, .22], P: 6, worms: 0 },
      { speed: .16, ceil: [.05, .13], floor: [.07, .11], spikes: 9, sl: [.06, .18], P: 8, worms: lowQ ? 10 : 22 },
      { speed: .32, ceil: [.02, .09], floor: [.03, .07], spikes: 12, sl: [.05, .14], P: 10, worms: lowQ ? 6 : 14 },
    ];
    layers = defs.map((d, i) => buildLayer(d, w.layers[i]));
    const n = lowQ ? 30 : 70;
    ambient = Array.from({ length: n }, () => ({ x: Math.random(), y: Math.random(), z: rand(.3, 1), s: rand(.6, 1.8), ph: rand(0, 6) }));
  }
  function buildLayer(d, colRGB) {
    const TW = Math.ceil(Math.max(W * 1.4, 620 * S)), c = mk(TW * dpr, H * dpr), x = c.getContext('2d'); x.scale(dpr, dpr);
    const nC = fbm(d.P), nF = fbm(d.P), wy = FLOOR();
    const spk = n => Array.from({ length: n }, () => ({ u: Math.random(), w: rand(.012, .035), len: rand(d.sl[0], d.sl[1]) * H }));
    const sC = spk(d.spikes), sF = spk(Math.round(d.spikes * .7));
    const spike = (list, u) => { let s = 0; for (const k of list) { let q = Math.abs(u - k.u); q = Math.min(q, 1 - q); const tt = 1 - q / k.w; if (tt > 0) s += k.len * Math.pow(tt, 1.7); } return s; };
    const ceilY = u => H * d.ceil[0] + nC(u * d.P) * H * d.ceil[1] + spike(sC, u);
    const floorY = u => wy - (H * d.floor[0] + nF(u * d.P) * H * d.floor[1] + spike(sF, u));
    const [r, g, b] = colRGB, col = (k, a = 1) => `rgba(${Math.min(255, r * k) | 0},${Math.min(255, g * k) | 0},${Math.min(255, b * k) | 0},${a})`;
    const step = 3;
    x.beginPath(); x.moveTo(0, -2); for (let px = 0; px <= TW; px += step) x.lineTo(px, ceilY(px / TW)); x.lineTo(TW, -2); x.closePath();
    let gr = x.createLinearGradient(0, 0, 0, H * .45); gr.addColorStop(0, col(.55)); gr.addColorStop(1, col(1.05)); x.fillStyle = gr; x.fill();
    x.beginPath(); for (let px = 0; px <= TW; px += step) x.lineTo(px, ceilY(px / TW)); x.strokeStyle = col(2.1, .55); x.lineWidth = 1.2 * S; x.stroke();
    x.beginPath(); x.moveTo(0, H + 2); for (let px = 0; px <= TW; px += step) x.lineTo(px, floorY(px / TW)); x.lineTo(TW, H + 2); x.closePath();
    gr = x.createLinearGradient(0, H * .55, 0, H); gr.addColorStop(0, col(1.05)); gr.addColorStop(1, col(.55)); x.fillStyle = gr; x.fill();
    x.beginPath(); for (let px = 0; px <= TW; px += step) x.lineTo(px, floorY(px / TW)); x.strokeStyle = col(2.1, .45); x.lineWidth = 1.2 * S; x.stroke();
    const worms = [];
    for (let i = 0; i < d.worms; i++) {
      const u = Math.random(), top = ceilY(u), len = rand(8, 46) * S, px = u * TW;
      x.beginPath(); x.moveTo(px, top - 2); x.lineTo(px + rand(-1, 1), top + len);
      x.strokeStyle = 'rgba(190,230,240,.22)'; x.lineWidth = .7 * S; x.stroke();
      worms.push({ u, y: top + len, ph: rand(0, 6), sz: rand(.7, 1.2) });
    }
    return { speed: d.speed, c, TW, worms };
  }

  /* ================= rocks ================= */
  const halfAt = (w, d, len) => (w / 2) * (1 - .8 * Math.pow(clamp(d / len, 0, 1), 1.25));
  function rockSprite(w, len, top) {
    const p = world, pad = 12 * S, cw = w + pad * 2, ch = len + 18 * S, c = mk(cw * dpr, ch * dpr), x = c.getContext('2d'); x.scale(dpr, dpr);
    const cx = cw / 2, N = Math.max(8, Math.round(len / (16 * S))), nl = pnoise(64), nr = pnoise(64), Lp = [], Rp = [];
    for (let i = 0; i <= N; i++) {
      const d = len * i / N, hw = halfAt(w, d, len), amp = 6 * S * (1 - .6 * i / N);
      Lp.push([cx - hw + (nl(i * 1.3) - .5) * amp * 2, d]); Rp.push([cx + hw + (nr(i * 1.3) - .5) * amp * 2, d]);
    }
    const path = () => {
      x.beginPath(); x.moveTo(cx - w / 2 - pad * .7, -4); smoothPath(x, Lp);
      x.quadraticCurveTo(cx, len + 12 * S, Rp[N][0], Rp[N][1]); smoothPath(x, [...Rp].reverse());
      x.lineTo(cx + w / 2 + pad * .7, -4); x.closePath();
    };
    path();
    const g = x.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0);
    g.addColorStop(0, p.rock[0]); g.addColorStop(.28, p.rock[1]); g.addColorStop(.68, p.rock[2]); g.addColorStop(1, p.rock[3]);
    x.fillStyle = g; x.fill();
    x.save(); path(); x.clip();
    const b = x.createLinearGradient(0, 0, 0, Math.min(len, 90 * S));
    b.addColorStop(0, 'rgba(30,8,60,.55)'); b.addColorStop(1, 'rgba(30,8,60,0)');
    x.fillStyle = b; x.fillRect(0, 0, cw, ch);
    let k = 0;
    for (let y = 9 * S; y < len; y += 11 * S * rand(.6, 1.5)) {
      k++; x.beginPath(); x.moveTo(0, y); x.quadraticCurveTo(cx, y + rand(3, 9) * S, cw, y + rand(-2, 2) * S);
      x.lineWidth = rand(.8, 1.8) * S; x.strokeStyle = k % 2 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.2)'; x.stroke();
    }
    const nSpeck = Math.min(lowQ ? 300 : 900, (cw * len) / (55 * S * S));
    for (let i = 0; i < nSpeck; i++) {
      x.fillStyle = Math.random() < .45 ? `rgba(255,255,255,${rand(.03, .1)})` : `rgba(0,0,0,${rand(.08, .22)})`;
      const s = rand(.8, 2.4) * S; x.fillRect(rand(0, cw), rand(0, len), s, s);
    }
    for (let i = 0; i < 5; i++) {
      const d = rand(.08, .85) * len, hw = halfAt(w, d, len);
      x.fillStyle = 'rgba(205,240,255,.11)'; x.beginPath(); x.ellipse(cx - hw * .45, d, 1.3 * S, rand(10, 32) * S, 0, 0, 7); x.fill();
    }
    const mc = top ? p.moss[0] : p.moss[1];
    for (let i = 0; i < 46; i++) {
      const yy = Math.pow(Math.random(), 2.2) * 26 * S;
      x.fillStyle = `rgba(${mc},${rand(.25, .7)})`;
      x.beginPath(); x.arc(rand(cx - w / 2 - pad, cx + w / 2 + pad), yy, rand(1.4, 5) * S, 0, 7); x.fill();
    }
    x.restore();
    x.beginPath(); x.moveTo(Lp[1][0], Lp[1][1]); smoothPath(x, Lp.slice(1));
    x.strokeStyle = `rgba(${p.rim},.32)`; x.lineWidth = 1.3 * S; x.stroke();
    x.fillStyle = 'rgba(215,248,255,.55)'; x.beginPath(); x.ellipse(cx - 1.5 * S, len + 3.5 * S, 1.4 * S, 3 * S, 0, 0, 7); x.fill();
    return { c, cw, ch };
  }

  /* ================= state ================= */
  const bug = { x: 120, y: 300, vy: 0, r: 10, rot: 0, wing: 0, sunk: false, face: 1, spin: 0, size: 1 };
  const playX = () => Math.min(W * .3, 190 * S);
  let state = 'menu', mode = 'normal', rng = Math.random, ghost = null;
  let contMax = 6, offerShown = false;
  let T = 0, scroll = 0, speed = 0, nextRock = 0, ts = 1, light = 1, lightMul = 1, amb = 1, shake = 0, flash = 0, dieT = 0, contT = 0;
  let rocks = [], sparks = [], pickups = [], tokens = [], parts = [], drops = [], rings = [], ripples = [], popups = [], bubbles = [];
  let power = { shield: false, magnet: 0, beacon: 0, invuln: 0 };
  let run = newRun();
  function newRun() {
    return { score: 0, sparks: 0, perfects: 0, streak: 0, maxStreak: 0, rockIdx: 0, continues: 0, doubled: false,
      tailwind: false, k: 1, rescueNext: false, rescueCd: 0, t0: performance.now(), dist: 0, ghostRec: [], nextGhost: 0, tokens: 0, cause: '', hints: {}, frames: 0, frameSum: 0, got: 0, lvl: null, lvlShown: -1 };
  }
  const upgVal = id => byId(UPGRADES, id).val(SV.upgrades[id] || 0);

  function resize() {
    lowQ = SV.quality === 'low' || (SV.quality === 'auto' && autoLow);
    dpr = Math.min(window.devicePixelRatio || 1, lowQ ? 1 : 2);
    W = stage.clientWidth; H = stage.clientHeight; S = H / 720;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    const ls = lowQ ? 1 / 3 : 1 / 2;
    lm.width = Math.ceil(W * dpr * ls); lm.height = Math.ceil(H * dpr * ls);
    if (state !== 'menu') bug.x = playX(); bug.r = 10 * S;
    buildBackdrops();
    for (const r of rocks) buildRock(r);
  }
  function setWorld(w) { if (world === w && layers.length) return; world = w; buildBackdrops(); }

  function buildRock(r) {
    const baseTop = r.gapY - r.gap / 2, baseBot = r.gapY + r.gap / 2;
    r.Lt = baseTop + r.amp; r.Lb = FLOOR() - baseBot + r.amp + 4 * S;
    r.top = rockSprite(r.w, r.Lt, true); r.bot = rockSprite(r.w, r.Lb, false);
  }
  const rockDy = r => r.amp ? Math.sin(T * r.spd + r.ph) * r.amp : 0;
  function rockGeo(r) {
    const dy = rockDy(r), topTip = r.gapY - r.gap / 2 + dy, botTip = r.gapY + r.gap / 2 + dy;
    return { cx: r.x + r.w / 2, topTip, botTip, sTop: topTip - r.Lt, sBase: botTip + r.Lb };
  }
  function makeRock(x) {
    const R = Array.from({ length: 12 }, rng);
    const i = run.rockIdx++;
    const lvl = clamp(i * run.k / 50, 0, 1);
    let gap = (TUNE.gapBase - lvl * TUNE.gapShrink) * S * world.mod.gap;
    if (!SV.tutorial && mode === 'normal' && i < 4) gap += 40 * S;
    if (run.tailwind && i < TAILWIND_ROCKS) gap += 34 * S;
    const margin = 78 * S;
    const gapY = lerp(margin + gap / 2, FLOOR() - margin - gap / 2, R[0]);
    const w = lerp(64, 94, R[1]) * S;
    let amp = 0;
    if (world.mod.move > 0 && i >= 3 && R[2] < .2 + .5 * world.mod.move) {
      amp = lerp(18, 44, R[3]) * S * Math.min(1, (i - 2) / 10);
      amp = Math.min(amp, gapY - gap / 2 - 36 * S, FLOOR() - (gapY + gap / 2) - 36 * S);
      amp = Math.max(0, amp);
    }
    const r = { x, w, gapY, gap, amp, ph: R[4] * 6.28, spd: lerp(.8, 1.5, R[5]), passed: false, drip: rand(.5, 3), decos: [], minClear: 1e9 };
    buildRock(r);
    if (Math.random() < .45) {
      const lo = Math.max(2 * amp + 12 * S, r.Lb * .28), hi = r.Lb * .75;
      if (hi > lo) r.decos.push({ kind: 'shroom', top: false, d: rand(lo, hi), side: Math.random() < .5 ? -1 : 1, n: 2 + (Math.random() * 2 | 0), ph: rand(0, 6) });
    }
    if (Math.random() < .4) r.decos.push({ kind: 'crystal', top: true, d: rand(.4, .75) * r.Lt, side: Math.random() < .5 ? -1 : 1, ph: rand(0, 6) });
    rocks.push(r);
    const px = x + w / 2 + (R[6] - .5) * 36 * S, py = gapY + (R[7] - .5) * .44 * gap;
    if (i >= 4 && R[8] < .1) pickups.push({ kind: ['shield', 'magnet', 'beacon'][Math.floor(R[9] * 3)], x: px, y: py, ph: R[10] * 6, got: false });
    else if (R[8] < .1 + .62 * world.mod.spark) sparks.push({ x: px, y: py, ph: R[10] * 6, got: false, missed: false });
    if (run.rescueNext) { run.rescueNext = false; run.rescueCd = 8; sparks.push({ x: x + w / 2, y: gapY, ph: 0, got: false, missed: false, rescue: true }); }
    if (R[11] < .24) tokens.push({ x: x + w / 2 + 118 * S, y: gapY + (R[9] - .5) * gap * .7, ph: R[10] * 6, got: false });
  }
  function hitRock(r) {
    const g = rockGeo(r), rr = bug.r * .78;
    if (Math.abs(bug.x - g.cx) > r.w / 2 + rr + 8 * S) return false;
    for (const oy of [-1, -.6, 0, .6, 1]) {
      const y = bug.y + oy * rr, ox = Math.sqrt(Math.max(0, 1 - oy * oy)) * rr;
      if (y < g.topTip + 5 * S && Math.abs(bug.x - g.cx) < halfAt(r.w, y - g.sTop, r.Lt) + ox) return true;
      if (y > g.botTip - 5 * S && Math.abs(bug.x - g.cx) < halfAt(r.w, g.sBase - y, r.Lb) + ox) return true;
    }
    return false;
  }

  /* ================= audio ================= */
  const A = { c: null };
  const Music = { step: 0, next: 0, bpm: 78, intensity: 0 };
  const midi = n => 440 * Math.pow(2, (n - 69) / 12);
  function audioInit() {
    if (A.c) { if (A.c.state === 'suspended' && !document.hidden) A.c.resume?.(); return; }
    try {
      const c = new (window.AudioContext || window.webkitAudioContext)(); A.c = c;
      A.master = c.createGain(); A.master.gain.value = .9; A.master.connect(c.destination);
      A.sfx = c.createGain(); A.mus = c.createGain(); A.sfx.connect(A.master); A.mus.connect(A.master);
      const conv = c.createConvolver(), len = c.sampleRate * 2.6 | 0, ir = c.createBuffer(2, len, c.sampleRate);
      for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
      conv.buffer = ir; conv.connect(A.master);
      A.sendS = c.createGain(); A.sendM = c.createGain(); A.sendS.connect(conv); A.sendM.connect(conv);
      A.noise = c.createBuffer(1, c.sampleRate / 2 | 0, c.sampleRate);
      const nd = A.noise.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
      setBusGains(true);
      Music.next = c.currentTime + .25;
      setInterval(musicTick, 60);
      dripLoop();
    } catch { A.c = null; }
  }
  function setBusGains(now) {
    if (!A.c) return;
    const tt = A.c.currentTime, k = now ? 0.001 : .08;
    A.sfx.gain.setTargetAtTime(SV.sound ? 1 : 0, tt, k); A.sendS.gain.setTargetAtTime(SV.sound ? .5 : 0, tt, k);
    const mv = SV.music ? (SV.musicVol ?? .5) : 0; A.mus.gain.setTargetAtTime(.55 * mv, tt, k); A.sendM.gain.setTargetAtTime(.45 * mv, tt, k);
  }
  function duck(on) { if (A.c) A.master.gain.setTargetAtTime(on ? .15 : .9, A.c.currentTime, .1); }
  function voice(type, f, dur, vol, o = {}) {
    const c = A.c; if (!c) return;
    const at = o.at ?? (c.currentTime + (o.delay || 0)), osc = c.createOscillator(), g = c.createGain();
    osc.type = type; osc.frequency.setValueAtTime(f, at); if (o.slide) osc.frequency.exponentialRampToValueAtTime(f * o.slide, at + dur);
    g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(vol, at + (o.attack || .006)); g.gain.exponentialRampToValueAtTime(.0001, at + dur);
    osc.connect(g); g.connect(o.bus === 'm' ? A.mus : A.sfx);
    if (o.wet) { const s = c.createGain(); s.gain.value = o.wet; g.connect(s); s.connect(o.bus === 'm' ? A.sendM : A.sendS); }
    osc.start(at); osc.stop(at + dur + .05);
  }
  function noise(freq, q, dur, vol, type = 'bandpass', wet = .1) {
    const c = A.c; if (!c) return;
    const at = c.currentTime, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = A.noise; f.type = type; f.frequency.value = freq; f.Q.value = q;
    g.gain.setValueAtTime(vol, at); g.gain.exponentialRampToValueAtTime(.0001, at + dur);
    s.connect(f).connect(g).connect(A.sfx);
    if (wet) { const w = c.createGain(); w.gain.value = wet; g.connect(w).connect(A.sendS); }
    s.start(at); s.stop(at + dur);
  }
  function pad(freq, at, dur, vol) {
    const c = A.c, f = c.createBiquadFilter(), g = c.createGain(), s = c.createGain();
    f.type = 'lowpass'; f.frequency.value = 850;
    g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(vol, at + dur * .35); g.gain.linearRampToValueAtTime(0, at + dur);
    f.connect(g); g.connect(A.mus); s.gain.value = .6; g.connect(s); s.connect(A.sendM);
    for (const det of [-7, 7]) { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = freq; o.detune.value = det; o.connect(f); o.start(at); o.stop(at + dur + .1); }
  }
  const PROG = [0, 3, 1, 4];
  // theme song (song.js); transposed per world, drums only while flying
  const SONG_TRANS = { grotto: 0, ice: 2, crystal: -2, lava: -4 };
  let songTrans = 0;
  function scheduleStep(s, at) {
    if (window.GlimmSong) {
      if (s % 16 === 0) songTrans = SONG_TRANS[world.id] || 0;
      const drums = state === 'play' ? 1 : (state === 'ready' || state === 'win') ? .45 : 0;
      const calm = !(state === 'play' || state === 'ready' || state === 'win');
      window.GlimmSong.step(A.c, A.mus, A.sendM, s, at, 60 / Music.bpm / 4, { trans: songTrans, drums, energy: Music.intensity, calm });
      return;
    }
    const sc = world.scale, root = world.root, beat = 60 / Music.bpm / 4;
    const cr = sc[PROG[Math.floor(s / 32) % 4] % sc.length];
    if (s % 32 === 0) for (const iv of [0, 7, 12]) pad(midi(root + cr + iv), at, beat * 32, .026);
    if (s % 16 === 0) voice('sine', midi(root - 12 + cr), beat * 14, .1, { bus: 'm', at, wet: .2 });
    const playing = state === 'play';
    const dens = playing ? .36 + Music.intensity * .45 : .18;
    if (s % 2 === 0 && Math.random() < dens) {
      const n = root + 24 + sc[Math.floor(Math.random() * sc.length)] + (Math.random() < .3 ? 12 : 0);
      voice('triangle', midi(n), .55, .04, { bus: 'm', at, wet: .7 });
    }
    if (playing && run.streak >= 4 && s % 4 === 2) voice('sine', midi(root + 36 + sc[(s >> 2) % sc.length]), .25, .018, { bus: 'm', at, wet: .8 });
  }
  function musicTick() {
    const c = A.c; if (!c || c.state !== 'running') return;
    if (Music.next < c.currentTime) Music.next = c.currentTime + .05;
    while (Music.next < c.currentTime + .25) { scheduleStep(Music.step, Music.next); Music.next += 60 / Music.bpm / 4; Music.step++; }
  }
  function dripLoop() { setTimeout(() => { if (A.c && !document.hidden && state !== 'pause') voice('sine', rand(1300, 2100), .11, .04, { slide: .45, wet: 1 }); dripLoop(); }, rand(1500, 4500)); }
  const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
  const sfx = {
    flap: () => noise(rand(650, 950), 1.1, .1, .15, 'bandpass', .05),
    spark: () => { const f = 784 * Math.pow(2, PENTA[Math.min(run.streak, PENTA.length - 1)] / 12); voice('triangle', f, .4, .07, { wet: .7 }); voice('sine', f * 2, .28, .03, { wet: .7, delay: .05 }); },
    score: () => voice('sine', 1320, .06, .02, { wet: .25 }),
    perfect: () => { voice('triangle', 1175, .3, .06, { wet: .6 }); voice('triangle', 1760, .4, .05, { wet: .6, delay: .07 }); },
    near: () => noise(2400, .6, .18, .08, 'highpass', .2),
    power: () => [0, 4, 7, 12].forEach((n, i) => voice('triangle', midi(72 + n), .3, .06, { wet: .6, delay: i * .06 })),
    shield: () => { voice('sine', 900, .5, .08, { slide: .3, wet: .6 }); noise(3000, .5, .3, .1, 'highpass', .4); },
    token: () => { voice('sine', 1568, .5, .05, { wet: .8 }); voice('sine', 2093, .6, .03, { wet: .8, delay: .04 }); },
    hit: () => { voice('sine', 170, .6, .26, { slide: .25, wet: .4 }); noise(380, .7, .25, .3, 'lowpass', .3); },
    splash: () => { noise(1400, .4, .55, .2, 'lowpass', .7); voice('sine', 420, .25, .05, { slide: .4, wet: .8 }); },
    start: () => { voice('triangle', 587, .35, .06, { wet: .7 }); voice('triangle', 880, .5, .05, { wet: .7, delay: .09 }); },
    claim: () => [0, 4, 7, 12, 16].forEach((n, i) => voice('triangle', midi(76 + n), .35, .05, { wet: .6, delay: i * .05 })),
    unlock: () => [0, 7, 12, 16, 19, 24].forEach((n, i) => voice('triangle', midi(67 + n), .5, .06, { wet: .7, delay: i * .07 })),
    click: () => voice('sine', 1100, .04, .03),
  };
  const vib = p => { if (!SV.vib) return; try { navigator.vibrate?.(p); } catch {} };

  /* ================= economy helpers ================= */
  function addWallet(n) { SV.sparks += n; updateWallets(); }
  function own(id) {
    if (SV.owned.includes(id)) return false;
    SV.owned.push(id); Analytics.track('unlock_firefly', { id });
    toast(t('fireflyUnlocked', { f: t('f_' + id) })); sfx.unlock();
    return true;
  }
  function addRunSparks(n) {
    SV.sparks += n; SV.totalSparks += n; run.sparks += n; mission('sparks', n);
    SV.piggy = Math.min(PIGGY_CAP, (SV.piggy || 0) + n * 2);
    $('runSparks').innerHTML = SPARK_SVG + ' ' + fmt(run.sparks);
  }
  function updateWallets() { document.querySelectorAll('.walletN').forEach(el => { el.textContent = fmt(SV.sparks); }); }

  /* ================= missions / daily / events / achievements ================= */
  function ensureMissions() {
    const d = todayUTC();
    if (SV.missions && SV.missions.date === d) return;
    const r = mulberry(hashStr('m-' + d)), pool = MISSION_POOL.slice(), list = [];
    const tierMax = SV.best >= 25 ? 2 : SV.best >= 8 ? 1 : 0;
    for (let i = 0; i < 3; i++) {
      const m = pool.splice(Math.floor(r() * pool.length), 1)[0];
      const tier = Math.min(tierMax, Math.floor(r() * 3));
      list.push({ type: m.type, n: m.n[tier], r: m.r[tier], p: 0, done: false, claimed: false });
    }
    SV.missions = { date: d, list, bonus: false }; save();
  }
  const missionText = m => t('m_' + m.type, { n: fmt(m.n) });
  function mission(type, v, how) {
    ensureMissions();
    for (const m of SV.missions.list) {
      if (m.type !== type || m.done) continue;
      m.p = how === 'max' ? Math.max(m.p, v) : m.p + v;
      if (m.p >= m.n) { m.p = m.n; m.done = true; toast('✓ ' + t('missionDone') + ' · ' + missionText(m)); Analytics.track('mission_done', { type }); }
    }
  }
  function claimMission(i) {
    const m = SV.missions.list[i]; if (!m || !m.done || m.claimed) return;
    m.claimed = true; addWallet(m.r); sfx.claim();
    if (!SV.missions.bonus && SV.missions.list.every(x => x.claimed)) { SV.missions.bonus = true; addWallet(150); toast(t('allDone', { n: 150 })); }
    save(); refreshAll();
  }
  const dailyAvailable = () => SV.daily.last !== todayUTC();
  function dailyNextIdx() { const cont = SV.daily.last === yesterdayUTC(); return cont ? SV.daily.streak % 7 : 0; }
  function claimDaily() {
    if (!dailyAvailable()) return;
    const cont = SV.daily.last === yesterdayUTC();
    SV.daily.streak = cont ? SV.daily.streak + 1 : 1; SV.daily.last = todayUTC();
    const rw = DAILY_REWARDS[(SV.daily.streak - 1) % 7];
    if (rw === 'sun') { if (!own('sun')) addWallet(600); } else addWallet(rw);
    sfx.claim(); Analytics.track('daily_claim', { day: SV.daily.streak }); save(); refreshAll();
  }
  function currentEvent() {
    const d = dayNum(), period = Math.floor(d / 14), ev = EVENTS[period % EVENTS.length], key = ev.id + '-' + period;
    if (!SV.events[key]) {
      SV.events[key] = { p: 0, done: false };
      const keys = Object.keys(SV.events); if (keys.length > 3) for (const k of keys.slice(0, keys.length - 3)) delete SV.events[k];
    }
    return { ev, left: 14 - (d % 14), st: SV.events[key], key };
  }
  function collectToken() {
    const { ev, st } = currentEvent(); if (st.done) return;
    st.p++; run.tokens++; passXP(3);
    if (st.p >= ev.goal) {
      st.done = true; st.p = ev.goal;
      if (!own(ev.reward)) addWallet(1000);
      toast(t('eventDone')); Analytics.track('event_done', { id: ev.id });
    }
  }
  function checkAch() {
    for (const a of ACH) {
      if (SV.ach[a.id] || !a.ok(SV)) continue;
      SV.ach[a.id] = Date.now(); addWallet(a.r);
      toast('🏆 ' + t('achDone') + ' · ' + t('a_' + a.id)); Analytics.track('achievement', { id: a.id });
    }
  }
  function checkUnlocks() {
    for (const w of WORLDS) if (w.unlock && !SV.worlds.includes(w.id) && SV.best >= w.unlock.best) unlockWorld(w);
    for (const s of SPECIES) if (s.how.t === 'best' && SV.best >= s.how.n) own(s.id);
  }
  function unlockWorld(w) {
    if (SV.worlds.includes(w.id)) return;
    SV.worlds.push(w.id); toast(w.emoji + ' ' + t('worldUnlocked', { w: t('w_' + w.id) })); sfx.unlock();
    Analytics.track('unlock_world', { id: w.id });
  }

  /* ================= flow ================= */
  const show = (id, on) => { $(id).hidden = !on; };
  function hideOverlays() { for (const id of ['menu', 'ready', 'paused', 'cont', 'over', 'win', 'levelM', 'sheet', 'dailyM', 'shareM', 'livesM', 'capM', 'consentM', 'welcomeM', 'pushM']) show(id, false); }

  function resetRun() {
    rocks = []; sparks = []; pickups = []; tokens = []; drops = []; rings = []; ripples = []; parts = []; popups = []; bubbles = [];
    run = newRun(); light = 1; lightMul = 1; ts = 1; dieT = 0;
    power = { shield: false, magnet: 0, beacon: 0, invuln: 0 };
    bug.y = H * .44; bug.vy = 0; bug.rot = 0; bug.sunk = false;
    nextRock = W * .6 + 60 * S;
    $('score').textContent = '0'; $('light').style.width = '100%'; $('meter').classList.remove('low');
    $('runSparks').innerHTML = SPARK_SVG + ' 0'; $('puRow').innerHTML = ''; puKey = '';
  }
  function startRun(m) {
    audioInit();
    if (energyOn()) {
      regenLives();
      if (SV.lives <= 0) { openLives(); return; }
      if (SV.lives >= LIVES_MAX) SV.livesT = Date.now();
      SV.lives--; save();
    }
    Ads.banner(false);
    mode = m;
    let lv = null, boost = null;
    if (m === 'level') {
      lv = levelDef(SV.level); setWorld(WORLDS[lv.wi]); rng = mulberry(hashStr(lv.seed)); ghost = null;
      const cost = ((pendingBoost.shield ? 1 : 0) + (pendingBoost.magnet ? 1 : 0)) * BOOST_COST;
      if (cost && SV.sparks >= cost) { SV.sparks -= cost; updateWallets(); boost = pendingBoost; Analytics.track('boost_use', { shield: !!boost.shield, magnet: !!boost.magnet }); }
      pendingBoost = { shield: false, magnet: false };
    } else if (m === 'daily') {
      setWorld(WORLDS[dayNum() % WORLDS.length]);
      rng = mulberry(hashStr('glimm-daily-' + todayUTC()));
      ghost = SV.dailyRun.date === todayUTC() && SV.dailyRun.ghost && SV.dailyRun.ghost.length > 4 ? SV.dailyRun.ghost : null;
    } else {
      setWorld(WORLDS[menuWi]); rng = Math.random; ghost = null;
      SV.world = world.id;
    }
    sp = byId(SPECIES, SV.selected) || SPECIES[0];
    resetRun();
    run.lvl = lv;
    if (boost) { if (boost.shield) power.shield = true; if (boost.magnet) power.magnet = 8; }
    show('goalHud', !!lv); if (lv) setGoalHud();
    const rec = SV.recent || [];
    run.tailwind = m === 'normal' && SV.tailwind && SV.tutorial && rec.length >= 3 && rec.slice(-3).every(s => s < 3);
    show('tailwindNote', run.tailwind);
    if (run.tailwind) Analytics.track('tailwind_on');
    state = 'ready'; hideOverlays(); show('ready', true); show('hud', true); show('pause', true); updateCorners();
    run.k = m === 'normal' ? clamp(.75 + (SV.skill || 0) / 50, .75, 1.3) : lv ? lv.k : 1;
    SV.playHours = SV.playHours && SV.playHours.length === 24 ? SV.playHours : Array(24).fill(0); SV.playHours[new Date().getHours()]++;
    sfx.start(); Analytics.track('run_start', { world: world.id, mode, k: Math.round(run.k * 100), level: lv ? lv.n : undefined });
    if (!SV.tutorial) showHint('hint1', 2.5);
  }

  let villageHi = null;
  let pendingBoost = { shield: false, magnet: false };
  function lvlProg() { const d = run.lvl; return !d ? 0 : d.kind === 'rocks' ? run.score : d.kind === 'sparks' ? run.got : run.perfects; }
  function setGoalHud() {
    const d = run.lvl; if (!d) return; const p = Math.min(lvlProg(), d.target); run.lvlShown = lvlProg();
    $('goalHud').innerHTML = `<span>${GOAL_IC[d.kind]}</span><b>${fmt(p)}/${fmt(d.target)}</b>`;
    $('goalHud').classList.toggle('done', p >= d.target);
  }
  function goalText(d) { return t('lvlGoal_' + d.kind, { n: d.target }); }
  function lvlLabel(d) { return t('level', { n: d.n }) + (d.hard ? ` <em class="hard-tag">${t('hard')}</em>` : ''); }
  function openLevel() {
    const d = levelDef(SV.level); pendingBoost = { shield: false, magnet: false };
    hideOverlays(); show('menu', state === 'menu');
    $('lvlBadge').innerHTML = lvlLabel(d);
    $('lvlWorld').textContent = WORLDS[d.wi].emoji + ' ' + t('w_' + WORLDS[d.wi].id);
    $('lvlGoal').innerHTML = `<span class="gi">${GOAL_IC[d.kind]}</span><b>${goalText(d)}</b>`;
    renderBoosts(); show('levelM', true); Analytics.track('level_open', { n: d.n });
  }
  function renderBoosts() {
    const sel = (pendingBoost.shield ? 1 : 0) + (pendingBoost.magnet ? 1 : 0);
    $('lvlBoosts').innerHTML = ['shield', 'magnet'].map(b => `<button class="boost ${pendingBoost[b] ? 'on' : ''}" data-b="${b}" ${!pendingBoost[b] && SV.sparks < BOOST_COST * (sel + 1) ? 'disabled' : ''}><span class="bi">${b === 'shield' ? '🛡️' : '🧲'}</span><small>${t('bst_' + b)}</small><em>${pendingBoost[b] ? '✓' : SPARK_SVG + ' ' + BOOST_COST}</em></button>`).join('');
  }
  function winLevel() {
    const d = run.lvl, stars = light >= .6 ? 3 : light >= .3 ? 2 : 1;
    state = 'win'; show('pause', false); sfx.perfect(); vib([20, 40, 20]);
    for (let i = 0; i < (lowQ ? 30 : 70); i++) { const a = rand(0, 7), v = rand(120, 420) * S; parts.push({ x: bug.x, y: bug.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120 * S, life: 1.4, max: 1.4, r: rand(6, 12) * S, rgb: CONFETTI[i % CONFETTI.length] }); }
    const prev = SV.lvlStars[d.n] || 0, gain = Math.max(0, stars - prev);
    SV.lvlStars[d.n] = Math.max(prev, stars); SV.stars = (SV.stars || 0) + gain;
    const reward = (10 + stars * 5) * (d.hard ? 2 : 1); addWallet(reward); SV.totalSparks += reward;
    if (d.n === SV.level) SV.level++;
    if (d.n % 15 === 0 && WORLDS[(d.n / 15) % 4] && d.n <= 45) unlockWorld(WORLDS[d.n / 15]);
    if (energyOn()) addLife(1);
    SV.runs++; SV.tutorial = true; mission('runs', 1); bumpPlayStreak(); leagueXP(run.score + run.perfects);
    SV.stats.maxStreak = Math.max(SV.stats.maxStreak, run.maxStreak); SV.stats.maxPerf = Math.max(SV.stats.maxPerf, run.perfects);
    checkUnlocks(); checkAch(); save();
    Analytics.track('level_win', { n: d.n, stars, gain, secs: Math.round((performance.now() - run.t0) / 1000), cont: run.continues });
    scheduleNotifs(); if (SV.league.joined && LEAGUE_URL) leagueSubmit();
    setTimeout(() => { if (state === 'win') showWin(d, stars, gain, reward + run.sparks); }, 950);
  }
  function showWin(d, stars, gain, total) {
    $('winTitle').textContent = t('lvlWin', { n: d.n });
    [...$('winStars').children].forEach((el, i) => { el.className = ''; setTimeout(() => { if (i < stars) { el.className = 'on'; sfx.spark(); } }, 300 + i * 300); });
    $('winSparks').innerHTML = SPARK_SVG + ' +' + fmt(total);
    $('winStarGain').textContent = '⭐ +' + gain;
    $('winNote').textContent = stars < 3 ? t('starsHint') : t('allStars');
    $('winNext').innerHTML = t('nextLevel', { n: SV.level });
    $('winVillage').hidden = !canBuild();
    show('hud', false); show('win', true);
  }
  function canBuild() { const V = SV.village, A = VILLAGE[V.a]; if (!A) return false; return V.done >= A.items.length || SV.stars >= A.items[V.done][3]; }
  function updateStarChip() { $('starN').textContent = fmt(SV.stars || 0); $('dotVillage').hidden = $('dotVillageNav').hidden = !canBuild(); }
  function renderVillage() {
    const V = SV.village, A = VILLAGE[V.a];
    if (!A) return `<div class="item"><div class="ic">🏡</div><div class="txt"><b>${t('village')}</b><small>${t('villageSoon')}</small></div></div>`;
    const tot = A.items.length, it = A.items[V.done];
    let html = `<div class="village"><canvas id="villageCv"></canvas></div>`;
    html += `<div class="item"><div class="ic">🏡</div><div class="txt"><b>${t('vi_' + A.id)}</b><small>${t('vi_' + A.id + '_s')}</small><div class="vbar"><i style="width:${Math.round(V.done / tot * 100)}%"></i></div><small>${t('vi_progress', { d: V.done, n: tot })}</small></div></div>`;
    if (!it) html += `<div class="item"><div class="ic">🎉</div><div class="txt"><b>${t('vi_done', { a: t('vi_' + A.id), n: AREA_REWARD })}</b></div><button class="sbtn" data-act="villageNext">${t('villageNext')}</button></div>`;
    else {
      html += `<div class="item"><div class="ic">${VI_ICON[it[0]]}</div><div class="txt"><b>${t('vo_' + it[0])}</b><small>${SPARK_SVG} +${VILLAGE_REWARD}</small></div><button class="sbtn" data-act="build" ${SV.stars < it[3] ? 'disabled' : ''}>⭐ ${it[3]}</button></div>`;
      if (SV.stars < it[3]) html += `<p class="note">${t('needStars', { n: SV.level })}</p>`;
    }
    return html;
  }
  function drawVillage(hi, k) {
    const cv = $('villageCv'), A = VILLAGE[SV.village.a]; if (!cv || !A) return;
    const w = cv.clientWidth || 320, h = Math.round(w * .62), dpr = Math.min(2, devicePixelRatio || 1);
    if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.height = h + 'px'; }
    const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
    const done = SV.village.done, tot = A.items.length, s = h / 185;
    let gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, A.sky[0]); gr.addColorStop(1, A.sky[1]); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    const r = mulberry(11 + SV.village.a); c.fillStyle = '#fff';
    for (let i = 0; i < 46; i++) { c.globalAlpha = .25 + r() * .6; const sz = r() < .15 ? 2.2 : 1.3; c.fillRect(r() * w, r() * h * .5, sz, sz); }
    c.globalAlpha = 1;
    c.fillStyle = 'rgba(255,240,200,.9)'; c.beginPath(); c.arc(w * .86, h * .16, 13 * s, 0, 7); c.fill();
    c.fillStyle = A.sky[0]; c.beginPath(); c.arc(w * .86 + 6 * s, h * .16 - 3 * s, 11 * s, 0, 7); c.fill();
    c.fillStyle = A.hill; c.beginPath(); c.moveTo(0, h * .52); c.quadraticCurveTo(w * .3, h * .38, w * .55, h * .52); c.quadraticCurveTo(w * .8, h * .62, w, h * .46); c.lineTo(w, h); c.lineTo(0, h); c.fill();
    c.fillStyle = A.ground; c.beginPath(); c.moveTo(0, h * .6); c.quadraticCurveTo(w * .5, h * .54, w, h * .62); c.lineTo(w, h); c.lineTo(0, h); c.fill();
    if (A.water) { gr = c.createLinearGradient(0, h * .8, 0, h); gr.addColorStop(0, A.water); gr.addColorStop(1, '#1a1060'); c.fillStyle = gr; c.fillRect(0, h * .82, w, h * .18); }
    c.fillStyle = `rgba(12,4,34,${(.5 * (1 - done / tot)).toFixed(3)})`; c.fillRect(0, 0, w, h);
    A.items.forEach((it, i) => drawVItem(c, it[0], it[1] * w, it[2] * h, s, i < done, i === done));
    if (hi != null && k < 1) {
      const it = A.items[hi], x = it[1] * w, y = it[2] * h - 22 * s;
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = `rgba(255,230,120,${1 - k})`; c.lineWidth = 3 * s; c.beginPath(); c.arc(x, y, (10 + 70 * k) * s, 0, 7); c.stroke();
      for (let j = 0; j < 10; j++) { const a = j / 10 * 6.283, d = (8 + 60 * k) * s; c.fillStyle = `rgba(${CONFETTI[j % 5].join(',')},${1 - k})`; c.beginPath(); c.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, 3 * s, 0, 7); c.fill(); }
      c.globalCompositeOperation = 'source-over';
    }
  }
  function drawVItem(c, type, x, y, s, on, next) {
    const paint = col => {
      if (on) { c.fillStyle = col; c.fill(); }
      else { c.fillStyle = 'rgba(255,255,255,.07)'; c.fill(); c.setLineDash([3, 3]); c.strokeStyle = next ? 'rgba(255,224,102,.95)' : 'rgba(255,255,255,.3)'; c.lineWidth = next ? 1.6 : 1.1; c.stroke(); c.setLineDash([]); }
    };
    const glow = (gx, gy, rad, rgb) => {
      if (!on) return; c.globalCompositeOperation = 'lighter';
      const gg = c.createRadialGradient(gx, gy, 0, gx, gy, rad); gg.addColorStop(0, `rgba(${rgb},.75)`); gg.addColorStop(1, `rgba(${rgb},0)`);
      c.fillStyle = gg; c.beginPath(); c.arc(gx, gy, rad, 0, 7); c.fill(); c.globalCompositeOperation = 'source-over';
    };
    const rect = (rx, ry, rw, rh) => { c.beginPath(); c.rect(rx, ry, rw, rh); };
    const tri = (ax, ay, bx, by, cx, cy) => { c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.lineTo(cx, cy); c.closePath(); };
    const circ = (cx, cy, rr) => { c.beginPath(); c.arc(cx, cy, rr, 0, 7); };
    switch (type) {
      case 'lantern': rect(x - 1.5 * s, y - 34 * s, 3 * s, 34 * s); paint('#5a3b7a'); rect(x - 6 * s, y - 46 * s, 12 * s, 14 * s); paint('#ffd23f'); glow(x, y - 39 * s, 28 * s, '255,210,63'); break;
      case 'house': rect(x - 18 * s, y - 26 * s, 36 * s, 26 * s); paint('#8a4fd8'); tri(x - 23 * s, y - 25 * s, x, y - 46 * s, x + 23 * s, y - 25 * s); paint('#ff4fa3');
        rect(x - 4 * s, y - 14 * s, 8 * s, 14 * s); paint('#3a1670'); rect(x + 7 * s, y - 20 * s, 7 * s, 7 * s); paint('#ffe066'); rect(x - 14 * s, y - 20 * s, 7 * s, 7 * s); paint('#ffe066'); glow(x, y - 16 * s, 26 * s, '255,224,102'); break;
      case 'mushroom': rect(x - 5 * s, y - 24 * s, 10 * s, 24 * s); paint('#f3e6ff'); c.beginPath(); c.ellipse(x, y - 23 * s, 22 * s, 17 * s, 0, Math.PI, 0); c.closePath(); paint('#ff3b5c');
        if (on) { c.fillStyle = '#fff'; [[-10, -30, 3], [3, -35, 3.5], [12, -28, 2.5]].forEach(([dx, dy, rr]) => { circ(x + dx * s, y + dy * s, rr * s); c.fill(); }); } glow(x, y - 30 * s, 36 * s, '255,80,140'); break;
      case 'well': rect(x - 12 * s, y - 14 * s, 24 * s, 14 * s); paint('#7a6aa8'); rect(x - 11 * s, y - 32 * s, 2.5 * s, 18 * s); paint('#6b3d2a'); rect(x + 8.5 * s, y - 32 * s, 2.5 * s, 18 * s); paint('#6b3d2a');
        tri(x - 16 * s, y - 31 * s, x, y - 42 * s, x + 16 * s, y - 31 * s); paint('#2ee6c5'); glow(x, y - 12 * s, 20 * s, '120,220,255'); break;
      case 'bridge': c.beginPath(); c.moveTo(x - 36 * s, y); c.quadraticCurveTo(x, y - 28 * s, x + 36 * s, y); c.lineTo(x + 36 * s, y + 5 * s); c.quadraticCurveTo(x, y - 21 * s, x - 36 * s, y + 5 * s); c.closePath(); paint('#c07a3a');
        rect(x - 30 * s, y - 16 * s, 2 * s, 12 * s); paint('#6b3d2a'); rect(x + 28 * s, y - 16 * s, 2 * s, 12 * s); paint('#6b3d2a'); circ(x - 29 * s, y - 18 * s, 3 * s); paint('#ffd23f'); circ(x + 29 * s, y - 18 * s, 3 * s); paint('#ffd23f');
        glow(x - 29 * s, y - 18 * s, 14 * s, '255,210,63'); glow(x + 29 * s, y - 18 * s, 14 * s, '255,210,63'); break;
      case 'flowers': [[-14, '#ff4fa3'], [-5, '#ffd23f'], [4, '#6ee7ff'], [13, '#a4ff7f'], [21, '#c48cff']].forEach(([dx, col], j) => { rect(x + dx * s - .7 * s, y - (8 + j % 2 * 4) * s, 1.4 * s, (8 + j % 2 * 4) * s); paint('#2fbf71'); circ(x + dx * s, y - (10 + j % 2 * 4) * s, 4 * s); paint(col); }); glow(x + 3 * s, y - 10 * s, 24 * s, '255,140,220'); break;
      case 'path': for (let j = 0; j < 6; j++) { c.beginPath(); c.ellipse(x + (j - 2.5) * 13 * s, y - (j % 2) * 3 * s, 5 * s, 2.6 * s, 0, 0, 7); paint('#ffe9a8'); glow(x + (j - 2.5) * 13 * s, y - (j % 2) * 3 * s, 9 * s, '255,233,168'); } break;
      case 'tree': rect(x - 3.5 * s, y - 30 * s, 7 * s, 30 * s); paint('#6b3d2a'); circ(x, y - 46 * s, 22 * s); paint('#2fbf71'); circ(x - 14 * s, y - 36 * s, 13 * s); paint('#27a862'); circ(x + 14 * s, y - 37 * s, 13 * s); paint('#27a862');
        if (on) [[-10, -50, '#ffd23f'], [8, -56, '#ff4fa3'], [12, -40, '#6ee7ff'], [-4, -38, '#ffd23f'], [2, -62, '#a4ff7f']].forEach(([dx, dy, col]) => { c.fillStyle = col; circ(x + dx * s, y + dy * s, 2.6 * s); c.fill(); });
        glow(x, y - 46 * s, 40 * s, '255,224,120'); break;
      case 'garland': {
        const cols = ['#ff4fa3', '#ffd23f', '#6ee7ff', '#a4ff7f', '#c48cff'], x0 = x - 70 * s, x1 = x + 70 * s;
        c.beginPath(); c.moveTo(x0, y); c.quadraticCurveTo(x, y + 26 * s, x1, y);
        if (on) { c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 1; c.stroke(); } else { c.setLineDash([3, 3]); c.strokeStyle = next ? 'rgba(255,224,102,.95)' : 'rgba(255,255,255,.3)'; c.lineWidth = 1.2; c.stroke(); c.setLineDash([]); }
        for (let j = 1; j < 12; j++) { const tt = j / 12, bx = x0 + (x1 - x0) * tt, by = y + 26 * s * 2 * tt * (1 - tt); circ(bx, by + 3 * s, 2.8 * s); paint(cols[j % 5]); if (on) { const rgb = cols[j % 5].match(/\w\w/g).map(v => parseInt(v, 16)).join(','); glow(bx, by + 3 * s, 9 * s, rgb); } }
        break; }
      case 'mill': c.beginPath(); c.moveTo(x - 11 * s, y); c.lineTo(x - 7 * s, y - 40 * s); c.lineTo(x + 7 * s, y - 40 * s); c.lineTo(x + 11 * s, y); c.closePath(); paint('#e9d8ff');
        for (let j = 0; j < 4; j++) { c.save(); c.translate(x, y - 40 * s); c.rotate(j * Math.PI / 2 + .4); c.beginPath(); c.rect(-2.5 * s, -26 * s, 5 * s, 24 * s); c.restore(); paint('#ffb347'); }
        circ(x, y - 40 * s, 3 * s); paint('#6b3d2a'); rect(x - 3 * s, y - 22 * s, 6 * s, 7 * s); paint('#ffe066'); glow(x, y - 19 * s, 20 * s, '255,224,102'); break;
      case 'stall': rect(x - 18 * s, y - 14 * s, 36 * s, 14 * s); paint('#a0622d'); rect(x - 16 * s, y - 34 * s, 2 * s, 20 * s); paint('#6b3d2a'); rect(x + 14 * s, y - 34 * s, 2 * s, 20 * s); paint('#6b3d2a');
        for (let j = 0; j < 5; j++) { c.beginPath(); c.moveTo(x - 20 * s + j * 8 * s, y - 34 * s); c.lineTo(x - 12 * s + j * 8 * s, y - 34 * s); c.lineTo(x - 12 * s + j * 8 * s, y - 28 * s); c.quadraticCurveTo(x - 16 * s + j * 8 * s, y - 24 * s, x - 20 * s + j * 8 * s, y - 28 * s); c.closePath(); paint(j % 2 ? '#fff' : '#ff4fa3'); }
        [[-10, '#ffd23f'], [-1, '#6ee7ff'], [8, '#a4ff7f']].forEach(([dx, col]) => { circ(x + dx * s, y - 17 * s, 3.5 * s); paint(col); }); glow(x, y - 18 * s, 26 * s, '255,200,120'); break;
      case 'crystal': [[-8, 0, 7, 30], [3, 0, 9, 42], [13, 0, 6, 24]].forEach(([dx, , cw, ch]) => { c.beginPath(); c.moveTo(x + dx * s - cw * s / 2, y); c.lineTo(x + dx * s, y - ch * s); c.lineTo(x + dx * s + cw * s / 2, y); c.closePath(); paint('#6ee7ff'); });
        glow(x + 3 * s, y - 22 * s, 34 * s, '110,231,255'); break;
      case 'tower': rect(x - 8 * s, y - 62 * s, 16 * s, 62 * s); paint('#b892ff'); [-48, -30].forEach(dy => { rect(x - 8 * s, y + dy * s, 16 * s, 4 * s); paint('#ff4fa3'); });
        rect(x - 6 * s, y - 72 * s, 12 * s, 10 * s); paint('#ffe066'); tri(x - 9 * s, y - 72 * s, x, y - 84 * s, x + 9 * s, y - 72 * s); paint('#ff4fa3'); glow(x, y - 67 * s, 50 * s, '255,230,120'); break;
      case 'fountain': c.beginPath(); c.ellipse(x, y - 5 * s, 24 * s, 7 * s, 0, 0, 7); paint('#7a6aa8'); rect(x - 2.5 * s, y - 26 * s, 5 * s, 20 * s); paint('#b892ff');
        if (on) { c.strokeStyle = 'rgba(160,230,255,.9)'; c.lineWidth = 1.6 * s; [-1, 1].forEach(dir => { c.beginPath(); c.moveTo(x, y - 26 * s); c.quadraticCurveTo(x + dir * 14 * s, y - 40 * s, x + dir * 20 * s, y - 8 * s); c.stroke(); }); }
        glow(x, y - 20 * s, 30 * s, '120,220,255'); break;
    }
    if (next) { const by = y - (type === 'tower' ? 92 : type === 'garland' ? -36 : 62) * s + Math.sin(performance.now() / 260) * 3 * s; tri(x - 6 * s, by - 8 * s, x + 6 * s, by - 8 * s, x, by); c.fillStyle = '#ffe066'; c.fill(); }
  }
  let villageRaf = 0;
  function animVillage(hi) {
    cancelAnimationFrame(villageRaf); const t0 = performance.now();
    const step = now => { if (!$('villageCv')) return; const k = (now - t0) / 1000; drawVillage(hi, k); villageRaf = requestAnimationFrame(step); };
    villageRaf = requestAnimationFrame(step);
  }
  function goMenu() {
    state = 'menu'; mode = 'normal'; resetRun();
    hideOverlays(); show('hud', false); show('pause', false); show('menu', true); updateCorners();
    setWorld(WORLDS[menuWi]); refreshMenu();
    Ads.banner(SV.runs >= 3);
    if (!SV.consent) openConsent(); else afterConsent();
  }
  function flap() {
    bug.vy = -400 * S; sfx.flap();
    const lc = lightOf(sp, T);
    for (let i = 0; i < 5; i++) parts.push({ x: bug.x - 8 * S, y: bug.y + 4 * S, vx: rand(-90, -30) * S, vy: rand(20, 90) * S, life: .5, max: .5, r: rand(5, 9) * S, rgb: lc });
  }
  function tap() {
    if (state === 'ready') { state = 'play'; bug.x = playX(); bug.face = 1; show('ready', false); flap(); }
    else if (state === 'play') flap();
  }
  function die(cause) {
    if (state !== 'play' || power.invuln > 0) return;
    if (power.shield) {
      power.shield = false; power.invuln = 1.3; sfx.shield(); vib(30);
      burst(bug.x, bug.y, [110, 240, 225], 20); popup(t('shieldBroke'), bug.x, bug.y - 30 * S, '#7fe9d9');
      if (cause === 'water') { bug.y = FLOOR() - 14 * S; bug.vy = -440 * S; }
      return;
    }
    run.cause = cause; state = 'dying'; dieT = 0; ts = .25; shake = reducedMotion ? 0 : .45; flash = reducedMotion ? 0 : .35;
    sfx.hit(); show('pause', false); vib([40, 30, 60]);
    bug.vy = cause === 'water' ? 0 : -160 * S;
    burst(bug.x, bug.y, lightOf(sp, T), 30);
    if (cause === 'water') splash(bug.x);
  }
  function burst(x, y, rgb, n) {
    if (lowQ) n = Math.ceil(n / 2);
    for (let i = 0; i < n; i++) { const a = rand(0, 7), v = rand(60, 260) * S; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(.6, 1.2), max: 1.2, r: rand(5, 12) * S, rgb }); }
  }
  function splash(x) {
    bug.sunk = true; sfx.splash();
    const wy = FLOOR();
    for (let i = 0; i < 22; i++) drops.push({ x: x + rand(-8, 8) * S, y: wy, vx: rand(-90, 90) * S, vy: rand(-320, -120) * S, life: 1.2 });
    ripples.push({ x, t: 0, big: true }); ripples.push({ x, t: -.15, big: true });
  }
  function popup(text, x, y, color = '#fff4cf', size = 20) { popups.push({ text, x, y, color, size, life: 1, max: 1 }); }

  function openContinue() {
    state = 'continue'; contMax = ab('contSecs'); contT = contMax; show('cont', true);
    const price = CONT_PRICES[run.continues];
    $('contVideo').hidden = run.continues > 0;
    const b = $('contSparks'); b.innerHTML = SPARK_SVG + ' ' + t('paySparks', { n: fmt(price) }); b.disabled = SV.sparks < price;
    Analytics.track('continue_offer', { n: run.continues + 1 });
  }
  function acceptContinue(via) {
    if (state !== 'continue') return;
    const price = CONT_PRICES[run.continues];
    if (via === 'sparks') { if (SV.sparks < price) return; SV.sparks -= price; updateWallets(); }
    run.continues++; SV.stats.continues++; Analytics.track('continue_used', { via, n: run.continues });
    show('cont', false); revive();
  }
  function declineContinue() { if (state !== 'continue') return; show('cont', false); finishRun(); }
  function revive() {
    rocks = rocks.filter(r => r.x + r.w < bug.x - 40 * S);
    sparks = sparks.filter(s => s.x < bug.x - 40 * S); pickups = []; tokens = tokens.filter(k => k.x < bug.x);
    nextRock = 230 * S;
    bug.y = H * .44; bug.vy = 0; bug.rot = 0; bug.sunk = false;
    lightMul = 1; light = Math.max(light, .7); power.invuln = 2; ts = 1; dieT = 0;
    state = 'ready'; show('ready', true); show('hud', true); show('pause', true); sfx.power();
  }
  function finishRun() {
    state = 'over';
    const score = run.score, today = todayUTC();
    SV.runs++; mission('runs', 1); bumpPlayStreak(); leagueXP(score + run.perfects);
    if (mode === 'normal') SV.skill = SV.skill ? SV.skill * .8 + score * .2 : score;
    if (mode === 'normal') { SV.recent = (SV.recent || []).concat(score).slice(-5); } mission('runScore', score, 'max');
    SV.stats.maxStreak = Math.max(SV.stats.maxStreak, run.maxStreak);
    SV.stats.maxPerf = Math.max(SV.stats.maxPerf, run.perfects);
    const isBest = mode !== 'level' && score > SV.best;
    if (isBest) SV.best = score;
    if (mode !== 'level') SV.bestByWorld[world.id] = Math.max(SV.bestByWorld[world.id] || 0, score);
    if (run.lvl) Analytics.track('level_fail', { n: run.lvl.n, prog: lvlProg(), target: run.lvl.target });
    if (mode === 'daily') {
      SV.stats.dailyRuns++;
      if (SV.dailyRun.date !== today) SV.dailyRun = { date: today, best: 0, ghost: null };
      if (score > SV.dailyRun.best) { SV.dailyRun.best = score; SV.dailyRun.ghost = run.ghostRec.slice(0, 5000); }
    }
    if (mode !== 'level') { SV.top.push({ s: score, w: world.id, d: today, m: mode, f: sp.id }); SV.top.sort((a, b) => b.s - a.s); SV.top = SV.top.slice(0, 10); }
    if (score >= 2) SV.tutorial = true;
    checkUnlocks(); checkAch(); save();
    Analytics.track('run_end', { score, sparks: run.sparks, world: world.id, mode, cause: run.cause, secs: Math.round((performance.now() - run.t0) / 1000) });
    Ads.maybeInterstitial();
    scheduleNotifs();
    if (SV.league.joined && LEAGUE_URL) leagueSubmit();

    showOver(isBest);
  }
  const RANKS = [
    [100, 'rank4', '🌌', 'linear-gradient(135deg,#2ee6c5,#8b5cf6,#ff4fa3)', 'rgba(180,120,255,.8)'],
    [50, 'rank3', '🗼', 'linear-gradient(135deg,#fff17a,#ffb300)', 'rgba(255,200,0,.8)'],
    [25, 'rank2', '🏮', 'linear-gradient(135deg,#ff9a5a,#ff3f6e)', 'rgba(255,90,110,.7)'],
    [10, 'rank1', '🕯️', 'linear-gradient(135deg,#8fd3ff,#2f80ed)', 'rgba(60,160,255,.7)'],
    [0, 'rank0', '✨', 'linear-gradient(135deg,#c9a6ff,#7c3aed)', 'rgba(160,100,255,.6)'],
  ];
  function showOver(isBest) {
    const score = run.score, ri = RANKS.findIndex(r => score >= r[0]), [, key, icon, bg, gl] = RANKS[ri];
    const m = $('medal'); m.textContent = icon; m.style.setProperty('--medal', bg); m.style.setProperty('--medal-glow', gl);
    const next = ri > 0 ? RANKS[ri - 1] : null;
    $('rankLine').textContent = t('rank') + ': ' + t(key) + (next ? ' · ' + t('nextRank', { n: next[0] }) : '');
    const best = mode === 'daily' ? SV.dailyRun.best : SV.best;
    $('bestN').textContent = fmt(best); show('newbest', isBest && score > 0);
    $('earnN').textContent = '+' + fmt(run.sparks);
    $('doubleBtn').hidden = run.sparks <= 0 || run.doubled;
    let offer = null;
    const pvo = playerValue();
    if (offerShown || !TUNE.offers) offer = null;
    else if (pvo && pvo.buy > .5 && starterActive()) offer = 'starter';
    else if (!SV.vip && SV.runs >= 30 && (SV.stats.adsWatched || 0) >= 10) offer = 'vip';
    else if (!SV.noAds && !SV.vip && SV.runs >= 12 && (SV.stats.adsWatched || 0) >= 4) offer = 'noads';
    else if (SV.runs >= 8 && SV.sparks < 300 && run.sparks >= 8) offer = SV.payer ? 'big' : 'small';
    if (SV.runs >= 2 && SV.piggy > 0) { $('piggyLine').textContent = t('piggyLine', { n: fmt(SV.piggy) }); show('piggyLine', true); } else show('piggyLine', false);
    const ob = $('offer');
    if (offer) {
      offerShown = true; const p = byId(PREMIUM, offer);
      ob.innerHTML = `<span>${t('offer_' + offer)}</span><button class="sbtn" data-iap="${offer}">${p.sub ? t('perWeek', { p: money(p.price) }) : money(p.price)}</button>`;
      ob.hidden = false; Analytics.track('offer_shown', { id: offer });
    } else ob.hidden = true;
    const lv = mode === 'level' && run.lvl;
    $('overH').textContent = lv ? t('lvlFail', { n: lv.n }) : t('lightOut');
    $('bestL').textContent = lv ? t('goal') : t('best');
    if (lv) { $('bestN').textContent = fmt(lvlProg()) + '/' + fmt(lv.target); $('rankLine').textContent = t('lvlLeft_' + lv.kind, { n: Math.max(1, lv.target - lvlProg()) }); }
    show('hud', false); show('pause', false); show('over', true);
    const t0 = performance.now(), dur = Math.min(900, 120 + score * 25);
    const step = now => { const k = clamp((now - t0) / dur, 0, 1); $('final').textContent = fmt(Math.round(score * (1 - Math.pow(1 - k, 3)))); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  function pause() {
    if (state !== 'play' && state !== 'ready') return;
    state = 'pause'; show('paused', true); show('ready', false);
  }
  function resume() { if (state !== 'pause') return; show('paused', false); state = 'ready'; show('ready', true); }

  /* ================= hints / toasts ================= */
  let hintTimer = 0;
  function showHint(key, secs) { const h = $('hint'); h.textContent = t(key); h.classList.add('on'); hintTimer = secs; }
  const toastQ = []; let toastBusy = false;
  function toast(text) { toastQ.push(text); if (toastQ.length > 6) toastQ.shift(); if (!toastBusy) nextToast(); }
  function nextToast() {
    const text = toastQ.shift(); if (!text) { toastBusy = false; return; }
    toastBusy = true;
    const box = $('toasts'), el = document.createElement('div'); el.className = 'toast'; el.textContent = text;
    box.appendChild(el);
    setTimeout(() => { el.remove(); nextToast(); }, 2300);
  }

  /* ================= update ================= */
  function menuZone() {
    const sr = stage.getBoundingClientRect(), tr = document.querySelector('.title').getBoundingClientRect(), wr = document.querySelector('.world-pick').getBoundingClientRect();
    const top = tr.bottom - sr.top + 14, bot = wr.top - sr.top - 14;
    return bot > top ? { cy: (top + bot) / 2, h: bot - top } : { cy: H * .4, h: 40 };
  }
  function abdomen() {
    const k = S * 1.15 * bug.size, c = Math.cos(bug.rot), s = Math.sin(bug.rot), lx = -8 * k * bug.face, ly = 3 * k;
    return { x: bug.x + lx * c - ly * s, y: bug.y + lx * s + ly * c };
  }
  let puKey = '';
  function updatePuRow() {
    const items = [];
    if (run.tailwind && run.rockIdx <= TAILWIND_ROCKS && state === 'play') items.push('🌬️');
    if (power.shield) items.push('🛡️');
    if (power.magnet > 0) items.push('🧲 ' + Math.ceil(power.magnet));
    if (power.beacon > 0) items.push('☀️ ' + Math.ceil(power.beacon));
    const key = items.join('|');
    if (key !== puKey) { puKey = key; $('puRow').innerHTML = items.map(x => `<span class="pu">${x}</span>`).join(''); }
  }
  let lastLightW = -1;
  function update(dt, real) {
    T += dt;
    const playing = state === 'play';
    if (state === 'dying') { ts = lerp(ts, 1, Math.min(1, real * 2.2)); dieT += real; }
    if (state === 'continue') {
      contT -= real;
      $('ringArc').setAttribute('stroke-dashoffset', String(251.3 * (1 - clamp(contT / contMax, 0, 1))));
      $('ringN').textContent = Math.max(0, Math.ceil(contT));
      if (contT <= 0) declineContinue();
    }
    if (hintTimer > 0) { hintTimer -= real; if (hintTimer <= 0) $('hint').classList.remove('on'); }
    const base = TUNE.speedBase + Math.min(run.rockIdx * run.k, 70) * TUNE.speedRamp;
    const target = playing ? base * S * world.mod.speed : (state === 'menu' || state === 'ready' || state === 'win') ? 58 * S : 0;
    speed = lerp(speed, target, Math.min(1, dt * (state === 'dying' ? 5 : 3)));
    scroll += speed * dt;
    const ambT = state === 'menu' ? 1 : (state === 'ready' || state === 'win') ? .45 : (state === 'over' || state === 'continue') ? .35 : 0;
    amb = lerp(amb, ambT, Math.min(1, real * 2.5));
    if (state !== 'dying' && state !== 'over' && state !== 'continue') bug.wing += dt * 44;
    bug.size = lerp(bug.size, state === 'menu' ? 1.45 : 1, Math.min(1, real * 4));
    Music.intensity = clamp(run.score / 40, 0, 1);
    Music.bpm = playing ? 100 + Math.min(run.score, 40) * .15 : 96;

    if (state === 'menu') {
      // playful lissajous flight in the free band between subtitle and world picker
      const mood = moodNow(), sleepy = mood === 'sleep';
      menuPhase += dt * (sleepy ? .4 : 1);
      lightMul = lerp(lightMul, sleepy ? .45 : 1, Math.min(1, real * 2));
      const z = menuZone(), ax = Math.min(W * .3, 120 * S) * (sleepy ? .45 : 1), ay = Math.max(6 * S, z.h * .26) * (sleepy ? .4 : 1);
      const tx = W / 2 + Math.sin(menuPhase * .85) * ax + Math.sin(menuPhase * 2.3) * 8 * S;
      const ty = z.cy + (sleepy ? z.h * .12 : 0) + Math.sin(menuPhase * 1.6) * ay + Math.sin(menuPhase * 4.1) * 4 * S;
      bubbleT -= real;
      if (bubbleT <= 0) { if (bubbleShow > 0) { bubbleShow = 0; bubbleT = 5; } else { bubbleText = moodText(); bubbleShow = 4; bubbleT = 4; } }
      bubbleShow = Math.max(0, bubbleShow - real);
      const px = bug.x;
      bug.x = lerp(bug.x, tx, Math.min(1, dt * 3)); bug.y = lerp(bug.y, ty, Math.min(1, dt * 3)); bug.vy = 0;
      const vx = (bug.x - px) / Math.max(dt, 1e-3);
      bug.face = lerp(bug.face, vx < -6 * S ? -1 : vx > 6 * S ? 1 : Math.sign(bug.face) || 1, Math.min(1, dt * 5));
      bug.spin = Math.max(0, bug.spin - dt);
      const tilt = clamp((ty - bug.y) / (40 * S), -.35, .35) * Math.sign(bug.face || 1);
      bug.rot = lerp(bug.rot % (Math.PI * 2), tilt, Math.min(1, dt * 5)) + (bug.spin > 0 ? (1 - bug.spin / .7) * Math.PI * 2 * Math.sign(bug.face || 1) : 0);
    } else if (state === 'ready' || state === 'win') {
      const hy = H * .44;
      bug.x = lerp(bug.x, playX(), Math.min(1, dt * 5)); bug.face = lerp(bug.face, 1, Math.min(1, dt * 6));
      bug.y = lerp(bug.y, hy + Math.sin(T * 2.3) * 12 * S, Math.min(1, dt * 4)); bug.vy = 0;
      bug.rot = lerp(bug.rot, Math.sin(T * 2.3 + 1) * .08, Math.min(1, dt * 4));
      if (power.invuln > 0 && state === 'ready') {/* keep invuln until play */}
    } else if (playing) {
      run.frames++; run.frameSum += real;
      if (SV.quality === 'auto' && !autoLow && run.frames === 150 && run.frameSum / 150 > 1 / 42) { autoLow = true; resize(); }
      bug.vy += 1320 * S * dt; bug.y += bug.vy * dt;
      if (bug.y < bug.r) { bug.y = bug.r; bug.vy = Math.max(0, bug.vy); }
      bug.rot = lerp(bug.rot, clamp(bug.vy / (620 * S), -.45, 1.05), Math.min(1, dt * 10));
      run.dist += speed * dt;
      while (run.dist >= run.nextGhost && run.ghostRec.length < 5000) { run.ghostRec.push(Math.round(bug.y / H * 1000)); run.nextGhost += 6 * S; }
      power.magnet = Math.max(0, power.magnet - dt); power.beacon = Math.max(0, power.beacon - dt); power.invuln = Math.max(0, power.invuln - dt);
      if (power.beacon > 0) light = 1;
      else light = Math.max(0, light - dt * TUNE.drain * world.mod.drain * (1 - upgVal('keeper') / 100));
      run.rescueCd = Math.max(0, run.rescueCd - dt);
      if (!run.rescueNext && light < .18 && run.rescueCd <= 0) run.rescueNext = true;
      nextRock -= speed * dt;
      if (nextRock <= 0) { makeRock(W + 20 * S); nextRock = lerp(220, 262, rng()) * S; }
      for (const r of rocks) {
        const g = rockGeo(r);
        if (Math.abs(bug.x - g.cx) < r.w / 2) {
          const rr = bug.r * .78; r.minClear = Math.min(r.minClear, (bug.y - rr) - g.topTip, g.botTip - (bug.y + rr));
        }
        if (!r.passed && g.cx < bug.x) {
          r.passed = true; run.score++; SV.stats.rocks++; mission('rocks', 1); passXP(1);
          const el = $('score'); el.textContent = fmt(run.score); el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
          const midY = (g.topTip + g.botTip) / 2;
          if (Math.abs(bug.y - midY) < r.gap * .13) {
            run.perfects++; SV.stats.perfects++; mission('perfect', 1); addRunSparks(1); passXP(1);
            popup(t('perfect') + ' +1', bug.x + 20 * S, bug.y - 26 * S, '#ffe066', 24); sfx.perfect(); vib(12);
            for (let i = 0; i < (lowQ ? 10 : 22); i++) { const an = rand(0, 7), v = rand(80, 240) * S; parts.push({ x: bug.x, y: bug.y, vx: Math.cos(an) * v, vy: Math.sin(an) * v - 60 * S, life: .9, max: .9, r: rand(5, 10) * S, rgb: CONFETTI[i % CONFETTI.length] }); }
          } else if (r.minClear < 9 * S) { popup(t('close'), bug.x + 20 * S, bug.y - 26 * S, '#7ff0ff', 22); sfx.near(); }
          else sfx.score();
        }
        if (power.invuln <= 0 && hitRock(r)) { die('rock'); break; }
      }
      if (state === 'play') {
        const mr = power.magnet > 0 ? 170 * S : 0;
        for (const s of sparks) {
          if (s.got) continue;
          if (mr) { const dx = bug.x - s.x, dy = bug.y - s.y, d = Math.hypot(dx, dy); if (d < mr) { s.x += dx / d * 520 * S * dt; s.y += dy / d * 520 * S * dt; } }
          if (Math.hypot(s.x - bug.x, s.y - bug.y) < bug.r + 16 * S) {
            if (s.rescue) { light = Math.min(1, light + .25); popup('✨ ' + t('rescue'), s.x, s.y - 40 * S, '#7ff0ff', 20); }
            s.got = true; run.got++; light = Math.min(1, light + .3); run.streak++; run.maxStreak = Math.max(run.maxStreak, run.streak);
            mission('streak', run.streak, 'max'); addRunSparks(1); sfx.spark(); vib(8);
            rings.push({ x: s.x, y: s.y, t: 0, rgb: GOLD });
            if (run.streak >= 3 && run.streak % 3 === 0) { addRunSparks(1); popup(t('streak', { n: run.streak }) + ' +1', s.x, s.y - 22 * S, '#ffe08a'); }
            for (let i = 0; i < (lowQ ? 8 : 16); i++) { const a = rand(0, 7), v = rand(50, 170) * S; parts.push({ x: s.x, y: s.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: .7, max: .7, r: rand(6, 11) * S, rgb: CONFETTI[i % CONFETTI.length] }); }
            if (!SV.tutorial && !run.hints.h2) { run.hints.h2 = true; }
          } else if (!s.missed && s.x < bug.x - 30 * S) { s.missed = true; run.streak = 0; }
        }
        for (const p of pickups) {
          if (p.got || Math.hypot(p.x - bug.x, p.y - bug.y) > bug.r + 20 * S) continue;
          p.got = true; sfx.power(); vib(20); rings.push({ x: p.x, y: p.y, t: 0, rgb: PU[p.kind].rgb });
          if (p.kind === 'shield') power.shield = true;
          if (p.kind === 'magnet') power.magnet = upgVal('magnet');
          if (p.kind === 'beacon') { power.beacon = upgVal('beacon'); light = 1; }
          popup(t('pu_' + p.kind), p.x, p.y - 26 * S, PU[p.kind].css);
          Analytics.track('powerup', { kind: p.kind });
        }
        for (const k of tokens) {
          if (k.got || Math.hypot(k.x - bug.x, k.y - bug.y) > bug.r + 18 * S) continue;
          k.got = true; collectToken(); sfx.token(); rings.push({ x: k.x, y: k.y, t: 0, rgb: currentEvent().ev.color });
          const { ev, st } = currentEvent();
          popup(ev.emoji + ' ' + st.p + '/' + ev.goal, k.x, k.y + 30 * S, '#ffd2a8', 16);
        }
        if (bug.y > FLOOR() - 4 * S) die('water');
        if (run.lvl && state === 'play') { const p = lvlProg(); if (p !== run.lvlShown) setGoalHud(); if (p >= run.lvl.target) winLevel(); }
        if (!SV.tutorial) {
          if (!run.hints.s && sparks.some(s => s.x < W * .9)) { run.hints.s = true; showHint('hint2', 3); }
          if (!run.hints.l && light < .55) { run.hints.l = true; showHint('hint3', 3); }
        }
        const lw = Math.round(light * 200);
        if (lw !== lastLightW) { lastLightW = lw; $('light').style.width = (light * 100).toFixed(1) + '%'; $('meter').classList.toggle('low', light < .25); }
        updatePuRow();
      }
    } else if (state === 'dying') {
      if (!bug.sunk) {
        bug.vy += 1320 * S * dt; bug.y += bug.vy * dt; bug.rot += dt * 7;
        if (bug.y >= FLOOR() - 2 * S) { bug.y = FLOOR() - 2 * S; splash(bug.x); }
      } else bug.y += 26 * S * dt;
      lightMul = Math.max(0, lightMul - real * (bug.sunk ? 1.6 : .4));
      if (dieT > 1.05) { if (run.continues < CONT_PRICES.length && run.score >= 3) openContinue(); else finishRun(); }
    }

    const mv = speed * dt;
    for (const r of rocks) {
      r.x -= mv; r.drip -= dt;
      if (r.drip <= 0) { r.drip = rand(1.2, 3.5); const g = rockGeo(r); drops.push({ x: g.cx, y: g.topTip + 8 * S, vx: 0, vy: 0, life: 4, fromTip: true }); }
    }
    rocks = rocks.filter(r => r.x + r.w > -40 * S);
    for (const s of sparks) s.x -= mv;
    sparks = sparks.filter(s => s.x > -30 * S && !s.got);
    for (const p of pickups) p.x -= mv;
    pickups = pickups.filter(p => p.x > -30 * S && !p.got);
    for (const k of tokens) k.x -= mv;
    tokens = tokens.filter(k => k.x > -30 * S && !k.got);
    for (const d of drops) {
      d.x -= mv; d.vy += 900 * S * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.life -= dt;
      if (d.y > FLOOR() && d.vy > 0) { d.life = 0; if (d.fromTip && world.floor !== 'ice') ripples.push({ x: d.x, t: 0 }); }
    }
    drops = drops.filter(d => d.life > 0);
    for (const r of ripples) { r.t += dt; r.x -= mv; }
    ripples = ripples.filter(r => r.t < (r.big ? 1.4 : 1));
    for (const g of rings) g.t += dt;
    rings = rings.filter(g => g.t < .55);
    for (const p of parts) { p.x += p.vx * dt - mv * .3; p.y += p.vy * dt; p.vy += 60 * S * dt; p.vx *= .985; p.life -= dt; }
    parts = parts.filter(p => p.life > 0);
    for (const p of popups) { p.y -= 34 * S * real; p.life -= real; }
    popups = popups.filter(p => p.life > 0);
    if ((playing || state === 'menu' || state === 'ready') && Math.random() < dt * (lowQ ? 10 : 22)) {
      const a = abdomen();
      parts.push({ x: a.x, y: a.y, vx: rand(-60, -25) * S, vy: rand(-15, 15) * S, life: .7, max: .7, r: rand(4, 7) * S, rgb: lightOf(sp, T) });
    }
    if (world.floor === 'lava') {
      if (Math.random() < dt * 3) bubbles.push({ x: rand(0, W), r: rand(3, 8) * S, t: 0 });
      for (const b of bubbles) { b.t += dt; b.x -= mv; }
      bubbles = bubbles.filter(b => b.t < 1);
    }
    for (const d of ambient) {
      if (world.particles === 'snow') { d.y += dt * .04 * d.z; d.x -= (mv / W) * d.z * .8 + Math.sin(T + d.ph) * .0003; if (d.y > 1) { d.y = 0; d.x = Math.random(); } }
      else if (world.particles === 'embers') { d.y -= dt * .06 * d.z; d.x -= (mv / W) * d.z * .5 + Math.sin(T * 1.5 + d.ph) * .0006; if (d.y < 0) { d.y = 1; d.x = Math.random(); } }
      else { d.x -= (mv / W) * d.z * .6 + Math.sin(T * .7 + d.ph) * .0004; d.y += Math.cos(T * .5 + d.ph) * .0003; }
      if (d.x < 0) d.x += 1; if (d.x > 1) d.x -= 1;
    }
    if (shake > 0) shake = Math.max(0, shake - real * 1.4);
    if (flash > 0) flash = Math.max(0, flash - real * 1.6);
  }
  const PU = {
    shield: { rgb: [110, 240, 225], css: '#7fe9d9' },
    magnet: { rgb: [255, 120, 170], css: '#ff9cc4' },
    beacon: { rgb: [255, 240, 170], css: '#fff1b0' },
  };

  /* ================= render ================= */
  function drawLayers() {
    for (const Ly of layers) {
      const off = ((scroll * Ly.speed) % Ly.TW + Ly.TW) % Ly.TW;
      ctx.drawImage(Ly.c, -off, 0, Ly.TW, H); ctx.drawImage(Ly.c, -off + Ly.TW, 0, Ly.TW, H);
    }
  }
  function eachWorm(fn) {
    for (const Ly of layers) {
      if (!Ly.worms.length) continue;
      const off = ((scroll * Ly.speed) % Ly.TW + Ly.TW) % Ly.TW;
      for (const w of Ly.worms) for (const k of [0, 1]) { const px = w.u * Ly.TW - off + k * Ly.TW; if (px > -10 && px < W + 10) fn(px, w); }
    }
  }
  function decoPoints(r, d, g) {
    const pts = [];
    if (d.kind === 'shroom') {
      const bx = g.cx + d.side * (halfAt(r.w, d.d, r.Lb) - S), by = g.sBase - d.d;
      for (let i = 0; i < d.n; i++) pts.push({ bx, by: by - i * 6 * S, x: bx + d.side * (6 + i * 2.5) * S, y: by - (4 + i * 7) * S, s: (6.8 - i * 1.3) * S });
    } else {
      const bx = g.cx + d.side * (halfAt(r.w, d.d, r.Lt) - S), by = g.sTop + d.d;
      for (let j = 0; j < 3; j++) { const a = .35 + j * .32, len = (9 + j * 4) * S; pts.push({ bx, by: by + j * 3 * S, x: bx + d.side * Math.cos(a) * len, y: by + j * 3 * S + Math.sin(a) * len }); }
    }
    return pts;
  }
  function drawRocks() {
    for (const r of rocks) {
      const g = rockGeo(r), x0 = g.cx - r.top.cw / 2;
      if (g.sTop + r.top.ch > 0) ctx.drawImage(r.top.c, x0, g.sTop, r.top.cw, r.top.ch);
      ctx.save(); ctx.translate(x0, g.sBase); ctx.scale(1, -1); ctx.drawImage(r.bot.c, 0, 0, r.bot.cw, r.bot.ch); ctx.restore();
      for (const d of r.decos) {
        const pts = decoPoints(r, d, g);
        if (d.kind === 'shroom') {
          for (const p of pts) {
            ctx.strokeStyle = 'rgba(200,220,215,.8)'; ctx.lineWidth = 1.4 * S;
            ctx.beginPath(); ctx.moveTo(p.bx, p.by); ctx.quadraticCurveTo(p.x - d.side * 2 * S, p.y + 4 * S, p.x, p.y); ctx.stroke();
            ctx.fillStyle = world.decoA; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.s, p.s * .62, d.side * .2, Math.PI, 0); ctx.closePath(); ctx.fill();
          }
        } else {
          for (const p of pts) {
            const nx = -(p.y - p.by), ny = p.x - p.bx, l = Math.hypot(nx, ny) || 1, w = 2.6 * S;
            ctx.fillStyle = world.decoB; ctx.beginPath();
            ctx.moveTo(p.bx + nx / l * w, p.by + ny / l * w); ctx.lineTo(p.x, p.y); ctx.lineTo(p.bx - nx / l * w, p.by - ny / l * w); ctx.fill();
            ctx.strokeStyle = 'rgba(240,235,255,.8)'; ctx.lineWidth = .8 * S; ctx.beginPath(); ctx.moveTo(p.bx, p.by); ctx.lineTo(p.x, p.y); ctx.stroke();
          }
        }
      }
    }
  }
  function drawFloor() {
    const wy = FLOOR(), f = world.floor;
    ctx.save(); ctx.beginPath(); ctx.rect(-20, wy, W + 40, H - wy + 20); ctx.clip();
    ctx.globalAlpha = f === 'ice' ? .45 : f === 'lava' ? .15 : .32;
    for (const r of rocks) { const g = rockGeo(r), x0 = g.cx - r.bot.cw / 2; ctx.drawImage(r.bot.c, x0, wy - 2 * S, r.bot.cw, r.bot.ch * .55); }
    ctx.globalAlpha = 1;
    const gr = ctx.createLinearGradient(0, wy, 0, H);
    gr.addColorStop(0, `rgba(${world.water[0]},${f === 'ice' ? .6 : .74})`); gr.addColorStop(1, `rgba(${world.water[1]},.96)`);
    ctx.fillStyle = gr; ctx.fillRect(-20, wy, W + 40, H - wy + 20);
    if (f === 'water') {
      ctx.strokeStyle = 'rgba(170,220,240,.13)'; ctx.lineWidth = S;
      for (let i = 0; i < 9; i++) {
        const y = wy + (5 + i * i * 1.2) * S, len = (18 + i * 6) * S, gp = (60 + i * 14) * S, off = ((scroll * (1 + i * .08) + i * 37) % gp);
        ctx.beginPath(); for (let x = -off; x < W; x += gp) { ctx.moveTo(x, y); ctx.lineTo(x + len, y); } ctx.stroke();
      }
    } else if (f === 'ice') {
      ctx.strokeStyle = 'rgba(235,250,255,.18)'; ctx.lineWidth = 1 * S;
      const gp = 90 * S, off = scroll % gp;
      ctx.beginPath();
      for (let x = -off; x < W + gp; x += gp) { ctx.moveTo(x, wy + 4 * S); ctx.lineTo(x + 30 * S, wy + 26 * S); ctx.moveTo(x + 40 * S, wy + 10 * S); ctx.lineTo(x + 22 * S, wy + 40 * S); }
      ctx.stroke();
    }
    for (const r of ripples) {
      const k = r.t / (r.big ? 1.4 : 1); if (k < 0) continue;
      ctx.strokeStyle = `rgba(190,235,250,${(1 - k) * .55})`; ctx.lineWidth = 1.3 * S;
      ctx.beginPath(); ctx.ellipse(r.x, wy + 2 * S, (6 + k * (r.big ? 70 : 34)) * S, (1.5 + k * (r.big ? 10 : 5)) * S, 0, 0, 7); ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = f === 'ice' ? 'rgba(235,250,255,.6)' : f === 'lava' ? 'rgba(255,180,90,.5)' : 'rgba(170,225,245,.35)';
    ctx.fillRect(0, wy - .5 * S, W, (f === 'ice' ? 2 : 1.2) * S);
  }
  function drawFirefly(c, x, y, k, rot, s, wingPh, alpha, face = 1) {
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(k * (Math.abs(face) < .15 ? .15 * Math.sign(face || 1) : face), k); c.globalAlpha = alpha;
    const ph = Math.sin(wingPh);
    for (const [o, a] of [[-.28, .14], [0, .3], [.28, .14]]) {
      c.save(); c.rotate(-.55 + (ph + o) * .55);
      const wg = c.createLinearGradient(0, -20, 0, 0); wg.addColorStop(0, `rgba(${s.wing},${a})`); wg.addColorStop(1, `rgba(${s.wing},${a * 1.6})`);
      c.fillStyle = wg; c.beginPath(); c.ellipse(1, -10, 5.5, 11, -.25, 0, 7); c.fill(); c.restore();
    }
    c.save(); c.rotate(-.15 + ph * .4); c.fillStyle = `rgba(${s.wing},.32)`; c.beginPath(); c.ellipse(5, -9, 4.2, 9.5, .25, 0, 7); c.fill(); c.restore();
    c.strokeStyle = '#1d1824'; c.lineWidth = 1.1; c.lineCap = 'round';
    for (const lx of [0, 3.5, 7]) { c.beginPath(); c.moveTo(lx, 3.5); c.lineTo(lx - 2, 7.5); c.stroke(); }
    c.fillStyle = s.abd; c.beginPath(); c.ellipse(-7.5, 3, 9, 6.6, .18, 0, 7); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = .9;
    for (const sx of [-3, -7, -11]) { c.beginPath(); c.ellipse(sx, 3.2, 1.6, 5.6, .18, -1.2, 1.2); c.stroke(); }
    c.fillStyle = s.body; c.beginPath(); c.ellipse(2.5, 0, 7, 5.6, 0, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.ellipse(1.5, -2.5, 3.5, 1.4, -.2, 0, 7); c.fill();
    c.fillStyle = s.head; c.beginPath(); c.ellipse(8.6, -1, 4.6, 4.4, 0, 0, 7); c.fill();
    c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(8.4, -2.6, 1.7, 1.3, 0, 0, 7); c.fill();
    c.fillStyle = '#1d1824'; c.beginPath(); c.arc(12.4, .2, 3.3, 0, 7); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(13.2, -.6, 1.9, 0, 7); c.fill();
    c.fillStyle = '#111'; c.beginPath(); c.arc(13.8, -.5, 1, 0, 7); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(13.3, -1.1, .4, 0, 7); c.fill();
    c.strokeStyle = '#1d1824'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(13, -2.6); c.quadraticCurveTo(15.5, -9, 20, -9.5); c.stroke();
    c.beginPath(); c.moveTo(12, -2.8); c.quadraticCurveTo(13, -9.5, 16.5, -11.5); c.stroke();
    c.restore();
  }
  function ghostY() {
    if (!ghost || mode !== 'daily' || !(state === 'play' || state === 'dying' || state === 'ready')) return null;
    const f = run.dist / (6 * S), i = Math.floor(f);
    if (i >= ghost.length - 1) return null;
    return lerp(ghost[i], ghost[i + 1], f - i) / 1000 * H;
  }
  function drawBugAndGhost() {
    const gy = ghostY();
    if (gy !== null) drawFirefly(ctx, bug.x, gy, S * 1.15, 0, sp, bug.wing, .28);
    if (bug.sunk && dieT > 1) return;
    let a = bug.sunk ? clamp(1 - dieT, 0, 1) : 1;
    if (power.invuln > 0 && state === 'play' && Math.floor(T * 14) % 2) a *= .35;
    drawFirefly(ctx, bug.x, bug.y, S * 1.15 * bug.size, bug.rot, sp, bug.wing, a, bug.face);
  }
  function drawAmbient() {
    if (world.particles === 'embers') return;
    ctx.fillStyle = world.particles === 'snow' ? 'rgba(245,250,255,.85)' : 'rgba(225,238,248,.7)';
    for (const d of ambient) {
      const s = d.s * S * d.z * (world.particles === 'snow' ? 1.6 : 1);
      ctx.globalAlpha = .4 + .4 * Math.sin(T * 1.3 + d.ph); ctx.fillRect(d.x * W, d.y * FLOOR(), s, s);
    }
    ctx.globalAlpha = 1;
  }
  function drawDrops() {
    ctx.fillStyle = world.floor === 'lava' ? 'rgba(255,170,90,.8)' : 'rgba(190,235,250,.8)';
    for (const d of drops) { ctx.beginPath(); ctx.ellipse(d.x, d.y, 1.6 * S, 2.6 * S, 0, 0, 7); ctx.fill(); }
  }
  const lightRadius = () => (80 + 185 * light + (power.beacon > 0 ? 60 : 0)) * S * lightMul;

  function buildLightmap() {
    const sc = lm.width / W;
    lctx.setTransform(1, 0, 0, 1, 0, 0); lctx.globalCompositeOperation = 'source-over'; lctx.globalAlpha = 1;
    const a0 = world.amb[0], a1 = world.amb[1];
    lctx.fillStyle = `rgb(${lerp(a0[0], a1[0], amb) | 0},${lerp(a0[1], a1[1], amb) | 0},${lerp(a0[2], a1[2], amb) | 0})`;
    lctx.fillRect(0, 0, lm.width, lm.height);
    lctx.setTransform(sc, 0, 0, sc, 0, 0); lctx.globalCompositeOperation = 'lighter';
    const flick = reducedMotion ? 1 : 1 + Math.sin(T * 9) * .02 + Math.sin(T * 23) * .012;
    const L = lightRadius() * flick, ab = abdomen(), lc = lightOf(sp, T);
    glow(lctx, getGlow(lc, true), ab.x, ab.y, L, 1); glow(lctx, getGlow(WHITE, true), ab.x, ab.y, L * .42, .5 * lightMul);
    const sg = getGlow(GOLD, true);
    for (const s of sparks) glow(lctx, sg, s.x, s.y, 88 * S, .85);
    for (const p of pickups) glow(lctx, getGlow(PU[p.kind].rgb, true), p.x, p.y, 80 * S, .7);
    if (tokens.length) { const eg = getGlow(currentEvent().ev.color, true); for (const k of tokens) glow(lctx, eg, k.x, k.y, 70 * S, .6); }
    const wg = getGlow(world.worm, true);
    eachWorm((px, w) => glow(lctx, wg, px, w.y, 30 * S, .3));
    const ga = getGlow(world.decoAGlow, true), gb = getGlow(world.decoBGlow, true);
    for (const r of rocks) {
      if (!r.decos.length) continue;
      const g = rockGeo(r);
      for (const d of r.decos) { const pts = decoPoints(r, d, g), p = pts[pts.length - 1]; glow(lctx, d.kind === 'shroom' ? ga : gb, p.x, p.y, (d.kind === 'shroom' ? 70 : 64) * S, .58); }
    }
    for (const p of parts) glow(lctx, getGlow(p.rgb, true), p.x, p.y, p.r * 3.5, .4 * p.life / p.max);
    for (const g of rings) glow(lctx, getGlow(g.rgb, true), g.x, g.y, (60 + g.t * 260) * S, (1 - g.t / .55) * .6);
    if (world.floor === 'lava') { const lg = getGlow([255, 110, 40], true); for (let x = -60 * S; x < W + 120 * S; x += 110 * S) glow(lctx, lg, x - (scroll * .5) % (110 * S), FLOOR() + 10 * S, 150 * S, .55); }
    if (world.particles === 'embers') { const eg = getGlow([255, 130, 60], true); for (const d of ambient) glow(lctx, eg, d.x * W, d.y * H, 22 * S, .25); }
    if (flash > 0) glow(lctx, getGlow(WARM, true), bug.x, bug.y, 360 * S, flash * 1.5);
    lctx.globalAlpha = 1;
  }
  function drawPickupIcon(kind, x, y, r) {
    ctx.strokeStyle = '#ffffff'; ctx.fillStyle = '#ffffff'; ctx.lineWidth = 1.8 * S; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    if (kind === 'shield') { ctx.moveTo(x, y - r); ctx.lineTo(x + r * .8, y - r * .55); ctx.quadraticCurveTo(x + r * .75, y + r * .55, x, y + r); ctx.quadraticCurveTo(x - r * .75, y + r * .55, x - r * .8, y - r * .55); ctx.closePath(); ctx.stroke(); }
    else if (kind === 'magnet') { ctx.arc(x, y, r * .7, Math.PI, 0, true); ctx.moveTo(x - r * .7, y); ctx.lineTo(x - r * .7, y - r * .7); ctx.moveTo(x + r * .7, y); ctx.lineTo(x + r * .7, y - r * .7); ctx.stroke(); }
    else { ctx.arc(x, y, r * .38, 0, 7); ctx.fill(); ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ctx.moveTo(x + Math.cos(a) * r * .6, y + Math.sin(a) * r * .6); ctx.lineTo(x + Math.cos(a) * r * .95, y + Math.sin(a) * r * .95); } ctx.stroke(); }
  }
  function drawToken(shape, x, y, r, rgb) {
    ctx.fillStyle = `rgb(${rgb.map(v => Math.min(255, v + 40)).join(',')})`;
    ctx.beginPath();
    if (shape === 'lantern') { ctx.ellipse(x, y, r * .6, r * .8, 0, 0, 7); ctx.fill(); ctx.fillRect(x - r * .35, y - r * 1.05, r * .7, r * .25); ctx.fillRect(x - r * .35, y + r * .8, r * .7, r * .22); }
    else if (shape === 'star') { for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * .42 : r, a = i * Math.PI / 5 - Math.PI / 2; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); }
    else if (shape === 'flower') { for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5 + T; ctx.moveTo(x, y); ctx.ellipse(x + Math.cos(a) * r * .5, y + Math.sin(a) * r * .5, r * .45, r * .3, a, 0, 7); } ctx.fill(); }
    else { ctx.arc(x, y, r * .7, 0, 7); ctx.fill(); }
  }
  function drawEmissive() {
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = .1;
    for (const r of rocks) {
      const g = rockGeo(r), x0 = g.cx - r.top.cw / 2;
      ctx.drawImage(r.top.c, x0, g.sTop, r.top.cw, r.top.ch);
      ctx.save(); ctx.translate(x0, g.sBase); ctx.scale(1, -1); ctx.drawImage(r.bot.c, 0, 0, r.bot.cw, r.bot.ch); ctx.restore();
    }
    const wg = getGlow(world.worm), wh = getGlow(WHITE);
    eachWorm((px, w) => { const tw = .55 + .45 * Math.sin(T * 1.7 + w.ph); glow(ctx, wg, px, w.y, 9 * S * w.sz, .9 * tw); glow(ctx, wh, px, w.y, 2.6 * S * w.sz, .9 * tw); });
    const ga = getGlow(world.decoAGlow), gb = getGlow(world.decoBGlow);
    for (const r of rocks) {
      if (!r.decos.length) continue;
      const g = rockGeo(r);
      for (const d of r.decos) {
        const pulse = .75 + .25 * Math.sin(T * 2 + d.ph);
        for (const p of decoPoints(r, d, g)) {
          if (d.kind === 'shroom') { glow(ctx, ga, p.x, p.y - 2 * S, 22 * S, .7 * pulse); glow(ctx, wh, p.x, p.y - 2 * S, 5 * S, .5 * pulse); }
          else glow(ctx, gb, (p.x + p.bx) / 2, (p.y + p.by) / 2, 18 * S, .45 * pulse);
        }
      }
    }
    if (world.floor === 'lava') {
      const wy = FLOOR(), g = ctx.createLinearGradient(0, wy - 8 * S, 0, H);
      g.addColorStop(0, 'rgba(255,140,50,0)'); g.addColorStop(.12, 'rgba(255,150,60,.85)'); g.addColorStop(.35, 'rgba(210,70,20,.5)'); g.addColorStop(1, 'rgba(90,20,5,.3)');
      ctx.globalAlpha = .8 + .2 * Math.sin(T * 2); ctx.fillStyle = g; ctx.fillRect(0, wy - 8 * S, W, H - wy + 8 * S);
      for (const b of bubbles) { ctx.globalAlpha = 1 - b.t; ctx.strokeStyle = '#ffd08a'; ctx.lineWidth = 1.5 * S; ctx.beginPath(); ctx.arc(b.x, wy + 4 * S - b.t * 6 * S, b.r * (.5 + b.t), Math.PI, 0); ctx.stroke(); }
    }
    if (world.particles === 'embers') { const eg = getGlow([255, 140, 60]); for (const d of ambient) glow(ctx, eg, d.x * W, d.y * H, 4 * S * d.z, .8 * (.5 + .5 * Math.sin(T * 3 + d.ph))); }
    const sgg = getGlow(GOLD);
    for (const s of sparks) {
      const p = 1 + Math.sin(T * 5 + s.ph) * .18;
      if (s.rescue) { ctx.globalAlpha = .85; ctx.strokeStyle = '#7ff0ff'; ctx.lineWidth = 3 * S; ctx.beginPath(); ctx.arc(s.x, s.y, (20 + Math.sin(T * 8) * 4) * S, 0, 7); ctx.stroke(); glow(ctx, getGlow([120, 240, 255]), s.x, s.y, 46 * S, .6); }
      glow(ctx, sgg, s.x, s.y, 34 * S * p, .95); glow(ctx, wh, s.x, s.y, 10 * S * p, 1);
      ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(T * 1.2 + s.ph); ctx.globalAlpha = .95; ctx.fillStyle = '#fffbe0';
      const r = 10 * S * p; ctx.beginPath();
      for (let i = 0; i < 8; i++) { const rr = i % 2 ? r * .22 : r, a = i * Math.PI / 4; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      ctx.fill(); ctx.restore();
      for (let i = 0; i < 3; i++) { const a = T * 2.4 + s.ph + i * 2.09; glow(ctx, sgg, s.x + Math.cos(a) * 16 * S, s.y + Math.sin(a) * 10 * S, 5 * S, .7); }
    }
    for (const p of pickups) {
      const y = p.y + Math.sin(T * 3 + p.ph) * 4 * S, c = PU[p.kind];
      glow(ctx, getGlow(c.rgb), p.x, y, 40 * S, .9);
      ctx.globalAlpha = .9; ctx.strokeStyle = c.css; ctx.lineWidth = 2 * S; ctx.beginPath(); ctx.arc(p.x, y, 15 * S, 0, 7); ctx.stroke();
      ctx.globalAlpha = 1; drawPickupIcon(p.kind, p.x, y, 8 * S);
    }
    if (tokens.length) {
      const ev = currentEvent().ev, eg = getGlow(ev.color);
      for (const k of tokens) { const y = k.y + Math.sin(T * 2.5 + k.ph) * 5 * S; glow(ctx, eg, k.x, y, 30 * S, .9); ctx.globalAlpha = 1; drawToken(ev.shape, k.x, y, 8 * S, ev.color); }
    }
    for (const g of rings) {
      const k = g.t / .55; ctx.globalAlpha = (1 - k) * .8; ctx.strokeStyle = `rgb(${g.rgb.join(',')})`; ctx.lineWidth = 2.2 * S * (1 - k) + .5;
      ctx.beginPath(); ctx.arc(g.x, g.y, (10 + k * 55) * S, 0, 7); ctx.stroke();
    }
    for (const p of parts) glow(ctx, getGlow(p.rgb), p.x, p.y, p.r * (p.life / p.max * .6 + .4), p.life / p.max);
    const gy = ghostY();
    if (gy !== null) { glow(ctx, getGlow([200, 230, 255]), bug.x - 8 * S, gy + 3 * S, 22 * S, .35); }
    if (lightMul > 0) {
      const ab = abdomen(), pulse = 1 + Math.sin(T * 6) * .07, L = lightRadius(), lc = lightOf(sp, T);
      glow(ctx, getGlow(lc), ab.x, ab.y, L * .75, .16 * lightMul);
      glow(ctx, getGlow(lc), ab.x, ab.y, 34 * S * pulse, .9 * lightMul);
      glow(ctx, wh, ab.x, ab.y, 11 * S * pulse, .95 * lightMul);
      if (power.shield) { ctx.globalAlpha = .55 + .2 * Math.sin(T * 5); ctx.strokeStyle = '#7fe9d9'; ctx.lineWidth = 2 * S; ctx.beginPath(); ctx.arc(bug.x, bug.y, 24 * S, 0, 7); ctx.stroke(); glow(ctx, getGlow(PU.shield.rgb), bug.x, bug.y, 34 * S, .25); }
      if (power.magnet > 0) { ctx.globalAlpha = .4; ctx.strokeStyle = '#ff9cc4'; ctx.lineWidth = 1.5 * S; ctx.setLineDash([4 * S, 6 * S]); ctx.lineDashOffset = -T * 30 * S; ctx.beginPath(); ctx.arc(bug.x, bug.y, 34 * S, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
      const wy = FLOOR(), dist = wy - ab.y;
      if (world.floor !== 'lava' && dist > 0 && dist < H * .7) {
        ctx.save(); ctx.beginPath(); ctx.rect(0, wy, W, H - wy); ctx.clip();
        const ry = wy + dist * .35, ra = (1 - dist / (H * .7)) * (world.floor === 'ice' ? .75 : .55) * lightMul;
        ctx.globalAlpha = ra; ctx.drawImage(getGlow(lc), ab.x - 40 * S, ry - 10 * S, 80 * S, 20 * S);
        ctx.globalAlpha = ra * .5; ctx.drawImage(getGlow(lc), ab.x - L * .5, wy, L, 30 * S);
        ctx.restore();
      }
    }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  }
  function drawBubble() {
    if (state !== 'menu' || bubbleShow <= 0 || !bubbleText || menuZone().h < 120) return;
    const a = Math.min(1, bubbleShow * 3, (4 - bubbleShow) * 3);
    ctx.save(); ctx.globalAlpha = a;
    ctx.font = `800 ${Math.round(14 * Math.min(1.3, S))}px Nunito, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const tw = ctx.measureText(bubbleText).width, pw = tw + 24, ph = 30 * Math.min(1.3, S);
    const bx = clamp(bug.x, pw / 2 + 12, W - pw / 2 - 12), by = bug.y - 44 * S * bug.size - ph / 2;
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#2a0f5c'; ctx.lineWidth = 3;
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(bx - pw / 2, by - ph / 2, pw, ph, ph / 2); else ctx.rect(bx - pw / 2, by - ph / 2, pw, ph); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bug.x - 7, by + ph / 2 - 1); ctx.lineTo(bug.x, by + ph / 2 + 10); ctx.lineTo(bug.x + 7, by + ph / 2 - 1); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(bug.x - 7, by + ph / 2); ctx.lineTo(bug.x, by + ph / 2 + 10); ctx.lineTo(bug.x + 7, by + ph / 2); ctx.stroke();
    ctx.fillStyle = '#2a0f5c'; ctx.fillText(bubbleText, bx, by + 1);
    ctx.restore();
  }
  function drawPopups() {
    drawBubble();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const p of popups) {
      const k = p.life / p.max, sc = k > .85 ? 1 + (k - .85) * 3 : 1;
      ctx.globalAlpha = Math.min(1, k * 2);
      ctx.font = `900 ${p.size * S * sc}px Grandstander, "Trebuchet MS", sans-serif`;
      ctx.lineJoin = 'round'; ctx.lineWidth = 6 * S; ctx.strokeStyle = '#2a0f5c'; ctx.strokeText(p.text, p.x, p.y);
      ctx.fillStyle = p.color; ctx.fillText(p.text, p.x, p.y);
    }
    const gy = ghostY();
    if (gy !== null && Math.abs(gy - bug.y) > 34 * S) {
      ctx.globalAlpha = .55; ctx.font = `800 ${11 * S}px Nunito, sans-serif`; ctx.fillStyle = '#dbeaff'; ctx.fillText(t('ghost'), bug.x, gy - 20 * S);
    }
    ctx.globalAlpha = 1;
  }
  function render() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    if (shake > 0) ctx.translate(rand(-1, 1) * shake * 12 * S, rand(-1, 1) * shake * 12 * S);
    ctx.drawImage(bgC, -20, -20, W + 40, H + 40);
    drawLayers(); drawRocks(); drawFloor(); drawAmbient(); drawDrops(); drawBugAndGhost();
    buildLightmap();
    ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(lm, 0, 0, W, H); ctx.globalCompositeOperation = 'source-over';
    drawEmissive(); drawPopups();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.drawImage(vigC, 0, 0, W, H);
    if (flash > 0) { ctx.fillStyle = `rgba(255,170,100,${flash * .35})`; ctx.fillRect(0, 0, W, H); }
  }

  /* ================= menu & sheets ================= */
  function refreshMenu() {
    updateWallets();
    const w = WORLDS[menuWi], unlocked = SV.worlds.includes(w.id);
    $('wName').textContent = w.emoji + ' ' + t('w_' + w.id);
    $('wDesc').textContent = unlocked ? t('w_' + w.id + '_d') + (SV.bestByWorld[w.id] ? ' · ' + t('best') + ' ' + fmt(SV.bestByWorld[w.id]) : '')
      : t('lockInfo', { n: w.unlock.best });
    $('wDots').innerHTML = WORLDS.map((x, i) => `<i class="${i === menuWi ? 'on' : ''}"></i>`).join('');
    const pb = $('play');
    if (unlocked) { pb.textContent = t('endless'); pb.disabled = false; pb.dataset.act = 'play'; }
    else { pb.innerHTML = '🔒 ' + t('unlockFor', { n: fmt(w.unlock.cost) }) + ' ' + SPARK_SVG; pb.disabled = SV.sparks < w.unlock.cost; pb.dataset.act = 'unlock'; }
    const ld = levelDef(SV.level);
    $('lvlBtn').innerHTML = `<span>${lvlLabel(ld)}</span><small>${GOAL_IC[ld.kind]} ${goalText(ld)}</small>`;
    const dw = WORLDS[dayNum() % WORLDS.length];
    const db = SV.dailyRun.date === todayUTC() ? SV.dailyRun.best : 0;
    $('dailyInfo').textContent = dw.emoji + ' ' + t('w_' + dw.id) + (db ? ' · ' + t('best') + ' ' + fmt(db) : ' · ' + t('dailySub'));
    const { ev, left, st } = currentEvent();
    const rewardName = t('f_' + ev.reward);
    updateLivesChip(); updateStreakChip(); updateStarChip();
    if (starterActive()) {
      $('eventBanner').dataset.mode = 'starter';
      $('eventBanner').innerHTML = `<div class="ico" style="background:rgba(255,157,92,.2)">🎁</div><div class="txt"><b>${t('p_starter')} · <span style="color:var(--ember)">⏳ <span data-until="${starterUntil()}"></span></span></b><small>${t('p_starter_d')}</small></div><span class="sbtn">${money(1.99)}</span>`;
    } else { $('eventBanner').dataset.mode = 'event';
    $('eventBanner').innerHTML = `<div class="ico" style="background:rgba(${ev.color.join(',')},.18)">${ev.emoji}</div>
      <div class="txt"><b>${t('e_' + ev.id)} · <span style="color:var(--muted);font-weight:700">${t('eventEnds', { n: left })}</span></b>
      <div class="progress"><i style="width:${Math.round(st.p / ev.goal * 100)}%"></i></div>
      <small>${st.done ? t('eventDone') : t('eventGoal', { n: ev.goal, t: t('e_' + ev.id + '_t') }) + ' → ' + rewardName}</small></div>`; }
    fillUntil();
    $('dotMissions').hidden = !(dailyAvailable() || passClaimable() || (SV.vip && SV.vipClaim !== todayUTC()) || (SV.missions && SV.missions.list.some(m => m.done && !m.claimed)));
    $('dotTrophies').hidden = true;
    $('dotShop').hidden = !SPECIES.some(s => s.how.t === 'buy' && !SV.owned.includes(s.id) && SV.sparks >= s.how.n);
  }
  function refreshAll() { updateWallets(); if (state === 'menu') refreshMenu(); if (!$('sheet').hidden) renderSheet(); }

  let sheetName = '', sheetTab = '';
  function openSheet(name, tab) {
    sheetName = name; sheetTab = tab || ({ shop: 'fireflies', missions: 'today', ranks: 'me' }[name] || '');
    show('sheet', true); show('mute', false); updateCorners(); renderSheet();
    $('sheetBody').scrollTop = 0; Analytics.track('open_' + name);
  }
  function closeSheet() { show('sheet', false); show('mute', true); if (state === 'menu') refreshMenu(); updateCorners(); }
  function updateCorners() { $('gear').hidden = !(state === 'menu' && $('sheet').hidden); }
  function tabs(list) {
    $('sheetTabs').innerHTML = list.map(([id, label]) => `<button data-tab="${id}" class="${id === sheetTab ? 'on' : ''}">${label}</button>`).join('');
    $('sheetTabs').hidden = !list.length;
  }
  function speciesStatus(s) {
    if (SV.owned.includes(s.id)) return SV.selected === s.id ? `<button class="sbtn ghost" disabled>${t('selected')}</button>` : `<button class="sbtn" data-act="select" data-id="${s.id}">${t('select')}</button>`;
    const h = s.how;
    if (h.t === 'buy') return `<button class="sbtn" data-act="buyF" data-id="${s.id}" ${SV.sparks < h.n ? 'disabled' : ''}>${SPARK_SVG} ${fmt(h.n)}</button>`;
    return `<button class="sbtn ghost" disabled>🔒</button>`;
  }
  function speciesHow(s) {
    const h = s.how;
    if (SV.owned.includes(s.id)) return t('owned');
    if (h.t === 'buy') return t('how_buy');
    if (h.t === 'best') return t('how_best', { n: h.n });
    if (h.t === 'daily') return t('how_daily');
    if (h.t === 'event') return t('how_event', { e: t('e_' + h.e) });
    if (h.t === 'pass' || h.t === 'vip' || h.t === 'capsule') return t('how_' + h.t);
    return '';
  }
  function renderSheet() {
    updateWallets();
    const body = $('sheetBody'); let html = '';
    if (sheetName === 'village') { $('sheetTitle').textContent = t('village'); tabs([]); html = renderVillage(); }
    else if (sheetName === 'shop') {
      $('sheetTitle').textContent = t('navShop');
      tabs([['fireflies', t('tabFireflies')], ['upgrades', t('tabUpgrades')], ['premium', t('tabPremium')]]);
      if (sheetTab === 'fireflies') {
        const deal = dailyDeal();
        if (deal) html += `<div class="item deal"><canvas width="120" height="86" data-sp="${deal.s.id}" style="width:60px;height:43px;flex:none"></canvas><div class="txt"><b>🔥 ${t('dealTitle')} · ${t('f_' + deal.s.id)}</b><small><s>${fmt(deal.s.how.n)}</s> → ${fmt(deal.price)} · ⏳ <span data-until="${(dayNum() + 1) * 86400000}"></span></small></div><button class="sbtn" data-act="buyDeal" ${SV.sparks < deal.price ? 'disabled' : ''}>${SPARK_SVG} ${fmt(deal.price)}</button></div>`;
        if (capsuleAllowed()) html += `<div class="item"><div class="ic">🔮</div><div class="txt"><b>${t('capsule')}</b><small>${t('capsule_d', { n: fmt(CAPSULE_COST) })}</small><small class="odds">${t('odds')}: ${['odds1', 'odds2', 'odds3', 'odds4'].map(k => t(k)).join(' · ')}</small></div><button class="sbtn" data-act="capsule" ${SV.sparks < CAPSULE_COST ? 'disabled' : ''}>${SPARK_SVG} ${fmt(CAPSULE_COST)}</button></div>`;
        html += '<div class="grid2">' + SPECIES.map(s => `<div class="tile ${SV.selected === s.id ? 'sel' : ''} ${SV.owned.includes(s.id) ? '' : 'locked'}">
          <canvas width="208" height="148" data-sp="${s.id}"></canvas><b>${t('f_' + s.id)}</b><small>${speciesHow(s)}</small>${speciesStatus(s)}</div>`).join('') + '</div>';
      } else if (sheetTab === 'upgrades') {
        html += UPGRADES.map(u => {
          const lvl = SV.upgrades[u.id] || 0, max = lvl >= u.costs.length, cost = u.costs[lvl];
          const r1 = v => fmt(Math.round(v * 10) / 10), val = max ? r1(u.val(lvl)) : r1(u.val(lvl)) + ' → ' + r1(u.val(lvl + 1));
          return `<div class="item"><div class="ic">${u.ic}</div><div class="txt"><b>${t('u_' + u.id)}</b><small>${t('u_' + u.id + '_d', { n: val })}</small>
            <div class="pips">${u.costs.map((_, i) => `<i class="${i < lvl ? 'on' : ''}"></i>`).join('')}</div></div>
            ${max ? `<button class="sbtn ghost" disabled>${t('max')}</button>` : `<button class="sbtn" data-act="upg" data-id="${u.id}" ${SV.sparks < cost ? 'disabled' : ''}>${SPARK_SVG} ${fmt(cost)}</button>`}</div>`;
        }).join('');
        const fz = SV.freezes || 0;
        html += `<div class="item"><div class="ic">🧊</div><div class="txt"><b>${t('freeze')}</b><small>${t('freeze_d', { n: fz, m: 2 })}</small></div>${fz >= 2 ? `<button class="sbtn ghost" disabled>${t('max')}</button>` : `<button class="sbtn" data-act="buyFreeze" ${SV.sparks < TUNE.freezeCost ? 'disabled' : ''}>${SPARK_SVG} ${fmt(TUNE.freezeCost)}</button>`}</div>`;
        html += `<p class="note">${t('upgNote')}</p>`;
      } else {
        html += PREMIUM.filter(p => p.id !== 'starter' || starterActive()).map(p => {
          const owned = (p.id === 'noads' && SV.noAds) || (p.id === 'vip' && SV.vip) || (p.id === 'pass' && passState().premium);
          let extra = '', dis = false;
          if (p.id === 'starter') extra = `<small style="color:var(--ember)">⏳ <span data-until="${starterUntil()}"></span></small>`;
          if (p.id === 'piggy') { extra = `<div class="progress"><i style="width:${Math.round(SV.piggy / PIGGY_CAP * 100)}%"></i></div><small>${SPARK_SVG} ${fmt(SV.piggy)} / ${fmt(PIGGY_CAP)}</small>`; dis = SV.piggy < PIGGY_MIN; }
          const price = p.sub ? t('perWeek', { p: money(p.price) }) : money(p.price);
          return `<div class="item"><div class="ic">${p.ic}</div><div class="txt"><b>${t('p_' + p.id)}</b><small>${t('p_' + p.id + '_d', { n: fmt(PIGGY_MIN) })}</small>${extra}</div>
            ${owned ? `<button class="sbtn ghost" disabled>✓</button>` : `<button class="sbtn" data-act="iap" data-id="${p.id}" ${dis ? 'disabled' : ''}>${price}</button>`}</div>`;
        }).join('');
        html += `<p class="note">${t('premiumNote')}</p>`;
      }
    } else if (sheetName === 'missions' && sheetTab === 'pass') {
      $('sheetTitle').textContent = t('navMissions'); tabs([['today', t('today')], ['pass', t('pass')]]);
      html += renderPass();
    } else if (sheetName === 'missions') {
      $('sheetTitle').textContent = t('navMissions'); tabs([['today', t('today')], ['pass', t('pass')]]);
      ensureMissions();
      if (SV.vip) { const got = SV.vipClaim === todayUTC(); html += `<div class="item"><div class="ic">👑</div><div class="txt"><b>${t('vipDaily')}</b><small>${SPARK_SVG} 100</small></div><button class="sbtn" data-act="vipClaim" ${got ? 'disabled' : ''}>${got ? '✓' : t('claim')}</button></div>`; }
      const nextIdx = dailyNextIdx(), avail = dailyAvailable();
      html += `<div class="sec">${t('dailyReward')}</div><div class="days">` + DAILY_REWARDS.map((r, i) => {
        const got = avail ? i < nextIdx : i < ((SV.daily.streak - 1) % 7) + 1;
        const now = avail && i === nextIdx;
        return `<div class="day ${got ? 'got' : ''} ${now ? 'now' : ''}">${t('day', { n: i + 1 })}<b>${r === 'sun' ? '☀️' : fmt(r)}</b></div>`;
      }).join('') + '</div>';
      html += avail ? `<button class="btn" data-act="claimDaily">${t('claim')}</button>` : `<p class="note">${t('comeBack')}</p>`;
      html += `<div class="sec">${t('dailyMissions')}</div>`;
      html += SV.missions.list.map((m, i) => `<div class="item ${m.claimed ? 'done' : ''}"><div class="ic">${m.claimed ? '✓' : m.done ? '🎁' : '🎯'}</div>
        <div class="txt"><b>${missionText(m)}</b><div class="progress"><i style="width:${Math.round(m.p / m.n * 100)}%"></i></div><small>${fmt(m.p)} / ${fmt(m.n)}</small></div>
        ${m.claimed ? '' : `<button class="sbtn" data-act="claimM" data-i="${i}" ${m.done ? '' : 'disabled'}>${SPARK_SVG} ${fmt(m.r)}</button>`}</div>`).join('');
      const hrs = Math.max(1, Math.ceil((86400000 - (Date.now() % 86400000)) / 3600000));
      html += `<p class="note">${SV.missions.bonus ? '✓ ' : ''}${t('allDone', { n: 150 })} · ${t('newIn', { h: hrs })}</p>`;
      const { ev, left, st } = currentEvent();
      html += `<div class="sec">${t('event')}</div><div class="item"><div class="ic">${ev.emoji}</div><div class="txt"><b>${t('e_' + ev.id)} · ${t('eventEnds', { n: left })}</b>
        <small>${t('eventGoal', { n: ev.goal, t: t('e_' + ev.id + '_t') })} → ${t('f_' + ev.reward)}</small>
        <div class="progress"><i style="width:${Math.round(st.p / ev.goal * 100)}%"></i></div><small>${st.done ? t('eventDone') : fmt(st.p) + ' / ' + fmt(ev.goal)}</small></div>
        <canvas width="120" height="86" data-sp="${ev.reward}" style="width:60px;height:43px"></canvas></div>`;
    } else if (sheetName === 'ranks' && sheetTab === 'league') {
      $('sheetTitle').textContent = t('navRanks'); tabs([['me', t('myRecords')], ['league', t('league')]]);
      html += renderLeague();
    } else if (sheetName === 'ranks') {
      $('sheetTitle').textContent = t('navRanks'); tabs([['me', t('myRecords')], ['league', t('league')]]);
      html += `<div class="table"><span class="n">🏆</span><span>${t('best')}</span><b>${fmt(SV.best)}</b>
        <span class="n">📅</span><span>${t('dailyBest')}</span><b>${fmt(SV.dailyRun.date === todayUTC() ? SV.dailyRun.best : 0)}</b>
        <span class="n">🔁</span><span>${t('runsPlayed')}</span><b>${fmt(SV.runs)}</b>
        <span class="n">✨</span><span>${t('totalSparks')}</span><b>${fmt(SV.totalSparks)}</b>
        <span class="n">🎯</span><span>${t('perfects')}</span><b>${fmt(SV.stats.perfects)}</b></div>`;
      html += `<div class="sec">${t('worldBest')}</div><div class="table">` + WORLDS.map(w => `<span class="n">${w.emoji}</span><span>${t('w_' + w.id)}</span><b>${SV.worlds.includes(w.id) ? fmt(SV.bestByWorld[w.id] || 0) : '🔒'}</b>`).join('') + '</div>';
      html += `<div class="sec">${t('yourTop')}</div>`;
      html += SV.top.length ? '<div class="table">' + SV.top.map((r, i) => {
        const w = byId(WORLDS, r.w) || WORLDS[0];
        return `<span class="n">${i + 1}.</span><span>${w.emoji} ${t('w_' + w.id)}${r.m === 'daily' ? ' · 📅' : ''} <small style="color:var(--muted)">${r.d.slice(5).split('-').reverse().join('.')}</small></span><b>${fmt(r.s)}</b>`;
      }).join('') + '</div>' : `<p class="note">${t('noRuns')}</p>`;
      html += `<p class="note">${t('globalSoon')}</p>`;
    } else if (sheetName === 'trophies') {
      $('sheetTitle').textContent = t('navTrophies'); tabs([]);
      const n = ACH.filter(a => SV.ach[a.id]).length;
      html += `<p class="note">${fmt(n)} / ${fmt(ACH.length)}</p>`;
      html += ACH.map(a => `<div class="item ${SV.ach[a.id] ? '' : 'done'}"><div class="ic">${SV.ach[a.id] ? '🏆' : '🔒'}</div>
        <div class="txt"><b>${t('a_' + a.id)}</b><small>${t('a_' + a.id + '_d')}</small></div><span class="chip" style="padding:5px 10px">${SPARK_SVG} ${fmt(a.r)}</span></div>`).join('');
    } else if (sheetName === 'settings') {
      $('sheetTitle').textContent = t('navSettings'); tabs([]);
      const tg = (key, label) => `<div class="item"><div class="txt"><b>${label}</b></div><button class="toggle ${SV[key] ? 'on' : ''}" data-act="toggle" data-key="${key}" aria-pressed="${SV[key]}" aria-label="${label}"><i></i></button></div>`;
      html += tg('music', t('music'));
      html += `<div class="item"><div class="txt"><b>${t('musicVol')}</b><small>${t('songCredit')}</small></div><input class="vol" id="musicVol" type="range" min="0" max="100" step="5" value="${Math.round((SV.musicVol ?? .5) * 100)}" aria-label="${t('musicVol')}" ${SV.music ? '' : 'disabled'}></div>`;
      html += tg('sound', t('sound')) + tg('vib', t('vibration'));
      html += `<div class="item"><div class="txt"><b>🌬️ ${t('tailwind')}</b><small>${t('tailwindDesc', { n: TAILWIND_ROCKS })}</small></div><button class="toggle ${SV.tailwind ? 'on' : ''}" data-act="toggle" data-key="tailwind" aria-pressed="${SV.tailwind}" aria-label="${t('tailwind')}"><i></i></button></div>`;
      html += `<div class="item" style="flex-wrap:wrap"><div class="txt"><b>${t('graphics')}</b></div><div class="seg">` +
        ['auto', 'high', 'low'].map(q => `<button data-act="quality" data-q="${q}" class="${SV.quality === q ? 'on' : ''}">${t('g_' + q)}</button>`).join('') + '</div></div>';
      html += `<div class="sec">${t('language')}</div><div class="seg" style="justify-content:flex-start">` +
        LANGS.map(l => `<button data-act="lang" data-l="${l}" class="${lang === l ? 'on' : ''}">${L[l]._name || l}</button>`).join('') + '</div>';
      html += `<div class="sec">🤝 ${t('fairTitle')}</div>` + ['fair1', 'fair2', 'fair3', 'fair4', 'fair5'].map(k => `<div class="item"><div class="ic">✓</div><div class="txt"><small style="color:var(--text)">${t(k)}</small></div></div>`).join('');
      html += `<div class="sec">🔒 ${t('privacy')}</div><p class="note">${t('privacyText')}</p><button class="btn ghost" data-act="privacy">${t('privacyEdit')}</button>`;
      if (Native()?.adPrivacy) html += `<button class="btn ghost" data-act="adPrivacy" style="margin-top:8px">${t('adPrivacy')}</button>`;
      if (window.GLIMM_LEGAL_URL) { const u = String(window.GLIMM_LEGAL_URL).replace(/\/?$/, '/'); html += `<p class="note" style="text-align:center"><a href="${u}${lang === 'de' ? 'datenschutz' : 'privacy'}.html" target="_blank" rel="noopener">${t('legalPrivacy')}</a> · <a href="${u}impressum.html" target="_blank" rel="noopener">${t('legalImprint')}</a></p>`; }
      html += `<div class="sec">${t('about')}</div><p class="note">${t('aboutText')}</p>`;
      html += `<button class="btn ghost" data-act="reset" id="resetBtn">${t('reset')}</button><p class="note" style="text-align:center">Glimm · v2.9</p>`;
    }
    body.innerHTML = html;
    if (sheetName === 'village') animVillage(villageHi); else cancelAnimationFrame(villageRaf);
    villageHi = null;
    body.querySelectorAll('canvas[data-sp]').forEach(c => drawPreview(c, byId(SPECIES, c.dataset.sp)));
    fillUntil();
  }
  function drawPreview(c, s) {
    const x = c.getContext('2d'), w = c.width, h = c.height;
    x.clearRect(0, 0, w, h);
    const lc = s.light === 'hue' ? [150, 255, 220] : s.light;
    x.globalCompositeOperation = 'lighter';
    glow(x, getGlow(lc, true), w * .42, h * .58, h * .7, .5);
    x.globalCompositeOperation = 'source-over';
    const k = h / 38, cx = w * .5, cy = h * .62;
    drawFirefly(x, cx, cy, k, -.12, s, 1.2, 1);
    x.globalCompositeOperation = 'lighter';
    glow(x, getGlow(lc), cx - 8 * k, cy + 3 * k, h * .3, .9);
    x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
  }
  let resetArm = 0;
  function sheetAction(el) {
    const act = el.dataset.act, id = el.dataset.id;
    if (act === 'select') { SV.selected = id; sp = byId(SPECIES, id); save(); sfx.claim(); renderSheet(); }
    else if (act === 'buyF') {
      const s = byId(SPECIES, id); if (SV.sparks < s.how.n) return;
      SV.sparks -= s.how.n; own(id); SV.selected = id; sp = s; checkAch(); save(); renderSheet();
    } else if (act === 'upg') {
      const u = byId(UPGRADES, id), lvl = SV.upgrades[id] || 0, cost = u.costs[lvl];
      if (cost === undefined || SV.sparks < cost) return;
      SV.sparks -= cost; SV.upgrades[id] = lvl + 1; sfx.claim(); Analytics.track('upgrade', { id, lvl: lvl + 1 }); save(); renderSheet();
    } else if (act === 'iap') IAP.buy(id);
    else if (act === 'claimDaily') claimDaily();
    else if (act === 'claimM') claimMission(+el.dataset.i);
    else if (act === 'passClaim') claimPass(+el.dataset.i, el.dataset.p === '1');
    else if (act === 'vipClaim') { if (SV.vip && SV.vipClaim !== todayUTC()) { SV.vipClaim = todayUTC(); addWallet(100); sfx.claim(); save(); renderSheet(); } }
    else if (act === 'capsule') openCapsule();
    else if (act === 'privacy') openConsent();
    else if (act === 'adPrivacy') { try { Native()?.adPrivacy?.(); } catch {} }
    else if (act === 'build') {
      const V = SV.village, A = VILLAGE[V.a], it = A && A.items[V.done];
      if (!it || SV.stars < it[3]) return;
      SV.stars -= it[3]; V.done++; addWallet(VILLAGE_REWARD); sfx.unlock(); vib(30);
      Analytics.track('village_build', { a: A.id, i: V.done });
      if (V.done >= A.items.length) { addWallet(AREA_REWARD); toast('🏡 ' + t('vi_done', { a: t('vi_' + A.id), n: AREA_REWARD })); Analytics.track('village_area', { a: A.id }); }
      villageHi = V.done - 1; save(); updateStarChip(); renderSheet();
    }
    else if (act === 'villageNext') { SV.village.a++; SV.village.done = 0; save(); updateStarChip(); renderSheet(); }
    else if (act === 'buyFreeze') { if ((SV.freezes || 0) >= 2 || SV.sparks < TUNE.freezeCost) return; SV.sparks -= TUNE.freezeCost; SV.freezes = (SV.freezes || 0) + 1; sfx.claim(); Analytics.track('freeze_buy'); save(); renderSheet(); }
    else if (act === 'leagueLeave') {
      if (!confirm(t('leagueLeaveQ'))) return;
      leagueApi('/leave', { id: SV.league.id }).then(() => { SV.league = { id: null, name: '', joined: false, tier: 0, week: null, xp: 0, seen: null }; leagueData = null; save(); toast(t('leagueLeft')); renderSheet(); }).catch(() => toast(t('leagueOffline')));
    }
    else if (act === 'leagueJoin') { const nm = cleanName($('lgName').value); if (!nm) { toast(t('leagueNameBad')); return; } el.disabled = true; leagueJoin(nm).catch(() => { el.disabled = false; toast(t('leagueOffline')); }); }
    else if (act === 'buyDeal') { const d = dailyDeal(); if (!d || SV.sparks < d.price) return; SV.sparks -= d.price; own(d.s.id); SV.selected = d.s.id; sp = d.s; checkAch(); save(); renderSheet(); }
    else if (act === 'toggle') { const k = el.dataset.key; SV[k] = !SV[k]; save(); setBusGains(); setMuteIcon(); if (k === 'vib' && SV.vib) vib(30); renderSheet(); }
    else if (act === 'quality') { SV.quality = el.dataset.q; autoLow = false; save(); resize(); renderSheet(); }
    else if (act === 'lang') { lang = el.dataset.l; SV.lang = lang; save(); applyI18n(); renderSheet(); refreshMenu(); }
    else if (act === 'reset') {
      if (Date.now() - resetArm > 3000) { resetArm = Date.now(); el.textContent = t('resetConfirm'); return; }
      try { localStorage.removeItem(SAVE_KEY); } catch {}
      SV = DEFAULT(); SV.lang = lang; save(); sp = SPECIES[0]; menuWi = 0; setWorld(WORLDS[0]); ensureMissions();
      toast(t('resetDone')); renderSheet();
    }
  }
  function openDaily() {
    const missed = SV.daily.last === dayBeforeUTC() && SV.daily.streak >= 2;
    show('dailySave', missed);
    if (missed) { $('dailySaveTxt').textContent = t('streakLost', { n: SV.daily.streak }); $('saveSparks').innerHTML = SPARK_SVG + ' 100'; $('saveSparks').disabled = SV.sparks < 100; }
    const nextIdx = dailyNextIdx();
    $('dailyDays').innerHTML = DAILY_REWARDS.map((r, i) => `<div class="day ${i < nextIdx ? 'got' : ''} ${i === nextIdx ? 'now' : ''}">${t('day', { n: i + 1 })}<b>${r === 'sun' ? '☀️' : fmt(r)}</b></div>`).join('');
    const r = DAILY_REWARDS[nextIdx];
    $('dailyNote').innerHTML = r === 'sun' ? t('dailySun') : SPARK_SVG + ' ' + fmt(r);
    show('dailyM', true);
  }

  /* ================= share ================= */
  function shareText() {
    const w = t('w_' + world.id);
    if (mode === 'daily') {
      const d = new Date().toLocaleDateString(lang, { day: '2-digit', month: '2-digit', timeZone: 'UTC' });
      const bar = '🟨'.repeat(Math.min(10, Math.ceil(run.score / 5))) + '⬛'.repeat(Math.max(0, 10 - Math.ceil(run.score / 5)));
      return `${t('shareDaily', { d })} ${world.emoji}\n${bar}\n🏆 ${run.score} · ✨ ${run.sparks} · 🎯 ${run.perfects}\n#GlimmGame`;
    }
    return `${t('shareText', { n: run.score, w })} ${world.emoji}\n#GlimmGame`;
  }
  function buildShareImage() {
    const Wc = 1080, Hc = 1350, c = mk(Wc, Hc), x = c.getContext('2d');
    const ar = cv.width / cv.height, tr = Wc / Hc; let sw, sh, sx, sy;
    if (ar > tr) { sh = cv.height; sw = sh * tr; sx = (cv.width - sw) / 2; sy = 0; } else { sw = cv.width; sh = sw / tr; sx = 0; sy = (cv.height - sh) / 2; }
    x.drawImage(cv, sx, sy, sw, sh, 0, 0, Wc, Hc);
    let g = x.createLinearGradient(0, 0, 0, Hc); g.addColorStop(0, 'rgba(30,8,70,.6)'); g.addColorStop(.35, 'rgba(30,8,70,.05)'); g.addColorStop(.6, 'rgba(30,8,70,.15)'); g.addColorStop(1, 'rgba(30,8,70,.85)');
    x.fillStyle = g; x.fillRect(0, 0, Wc, Hc);
    x.textAlign = 'center'; x.textBaseline = 'alphabetic';
    g = x.createLinearGradient(0, 80, 0, 230); g.addColorStop(0, '#fff6d6'); g.addColorStop(1, '#e8a93a');
    x.font = '900 170px Grandstander, "Trebuchet MS", sans-serif'; x.fillStyle = g; x.shadowColor = 'rgba(255,200,110,.6)'; x.shadowBlur = 40; x.fillText('Glimm', Wc / 2, 230); x.shadowBlur = 0;
    x.font = '900 300px Grandstander, "Trebuchet MS", sans-serif'; x.lineJoin = 'round'; x.lineWidth = 26; x.strokeStyle = '#2a0f5c'; x.strokeText(String(run.score), Wc / 2, Hc - 300);
    x.fillStyle = '#ffffff'; x.shadowColor = 'rgba(255,210,63,.8)'; x.shadowBlur = 50; x.fillText(String(run.score), Wc / 2, Hc - 300); x.shadowBlur = 0;
    x.font = '800 46px Nunito, sans-serif'; x.fillStyle = '#ffe08a';
    x.fillText((mode === 'daily' ? '📅 ' + t('daily') + ' · ' : '') + world.emoji + ' ' + t('w_' + world.id), Wc / 2, Hc - 200);
    x.font = '700 38px Nunito, sans-serif'; x.fillStyle = '#c9dadc'; x.fillText(t('shareCta'), Wc / 2, Hc - 120);
    return c.toDataURL('image/png');
  }
  function openShare() {
    try { $('shareImg').src = buildShareImage(); } catch { $('shareImg').removeAttribute('src'); }
    $('shareTxt').value = shareText(); show('shareM', true); Analytics.track('share_open', { mode });
  }
  async function doShare() {
    const text = $('shareTxt').value;
    const n = Native();
    if (n && n.share) { try { await n.share({ text, image: $('shareImg').src }); Analytics.track('share_native'); return; } catch {} }
    if (navigator.share) {
      try { await navigator.share({ text }); Analytics.track('share_web'); return; } catch (e) { if (e && e.name === 'AbortError') return; }
    }
    try { await navigator.clipboard.writeText(text); toast(t('copied')); Analytics.track('share_copy'); }
    catch { const ta = $('shareTxt'); ta.focus(); ta.select(); toast(t('copyManual')); }
  }

  /* ================= input ================= */
  const ICON_ON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>';
  const ICON_OFF = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 9.5l5 5m0-5l-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  function setMuteIcon() { $('mute').innerHTML = (SV.sound || SV.music) ? ICON_ON : ICON_OFF; }

  document.addEventListener('pointerdown', () => audioInit(), { capture: true });
  document.addEventListener('click', e => { if (e.target.closest('button')) sfx.click(); }, { capture: true });
  $('mute').addEventListener('click', () => { const on = !(SV.sound || SV.music); SV.sound = on; SV.music = on; save(); setBusGains(); setMuteIcon(); if (!$('sheet').hidden) renderSheet(); });
  $('play').addEventListener('click', () => {
    const w = WORLDS[menuWi];
    if ($('play').dataset.act === 'unlock') {
      if (SV.sparks < w.unlock.cost) return;
      SV.sparks -= w.unlock.cost; unlockWorld(w); checkAch(); save(); refreshMenu(); return;
    }
    startRun('normal');
  });
  $('dailyBtn').addEventListener('click', () => startRun('daily'));
  $('wPrev').addEventListener('click', () => { menuWi = (menuWi + WORLDS.length - 1) % WORLDS.length; setWorld(WORLDS[menuWi]); refreshMenu(); });
  $('wNext').addEventListener('click', () => { menuWi = (menuWi + 1) % WORLDS.length; setWorld(WORLDS[menuWi]); refreshMenu(); });
  $('menu').addEventListener('pointerdown', e => {
    if (state !== 'menu' || e.target.closest('button, .event, .nav, .chip, .streak-pill')) return;
    if (bug.spin > 0) return;
    bug.spin = .7; sfx.perfect(); vib(10);
    if (!bug.awake && moodNow() === 'sleep') { bug.awake = true; bubbleText = t('m_missed'); bubbleShow = 4; bubbleT = 4; }
    for (let i = 0; i < 18; i++) { const an = rand(0, 7), v = rand(60, 200) * S; parts.push({ x: bug.x, y: bug.y, vx: Math.cos(an) * v, vy: Math.sin(an) * v, life: .8, max: .8, r: rand(5, 9) * S, rgb: CONFETTI[i % CONFETTI.length] }); }
  });
  $('eventBanner').addEventListener('click', () => { if ($('eventBanner').dataset.mode === 'starter') openSheet('shop', 'premium'); else openSheet('missions'); });
  $('livesVideo').addEventListener('click', () => Ads.rewarded('life').then(ok => { if (ok) { addLife(1); show('livesM', false); toast('❤️ +1'); } }));
  $('livesRefill').addEventListener('click', () => { if (SV.sparks < 150) return; SV.sparks -= 150; addLife(LIVES_MAX); updateWallets(); show('livesM', false); sfx.claim(); });
  $('livesVip').addEventListener('click', () => { show('livesM', false); if (state !== 'menu') goMenu(); openSheet('shop', 'premium'); });
  $('livesClose').addEventListener('click', () => show('livesM', false));
  $('capClose').addEventListener('click', () => show('capM', false));
  $('saveVideo').addEventListener('click', () => Ads.rewarded('streak').then(ok => { if (ok) saveStreak(); }));
  $('saveSparks').addEventListener('click', () => { if (SV.sparks < 100) return; SV.sparks -= 100; saveStreak(); });
  $('piggyLine').addEventListener('click', () => { goMenu(); openSheet('shop', 'premium'); });
  function saveStreak() { SV.daily.last = yesterdayUTC(); save(); updateWallets(); sfx.claim(); Analytics.track('streak_saved'); openDaily(); }
  $('nav').addEventListener('click', e => { const b = e.target.closest('button[data-open]'); if (b) openSheet(b.dataset.open); });
  $('sheetBack').addEventListener('click', closeSheet);
  $('sheetTabs').addEventListener('click', e => { const b = e.target.closest('button[data-tab]'); if (b) { sheetTab = b.dataset.tab; renderSheet(); $('sheetBody').scrollTop = 0; } });
  $('sheetBody').addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b && !b.disabled) sheetAction(b); });
  $('dailyClaim').addEventListener('click', () => { claimDaily(); show('dailyM', false); refreshMenu(); setTimeout(() => { if (state === 'menu') maybePushAsk(); }, 500); });
  $('cAnalytics').addEventListener('click', e => e.currentTarget.classList.toggle('on'));
  $('cPersonal').addEventListener('click', e => e.currentTarget.classList.toggle('on'));
  $('cAll').addEventListener('click', () => setConsent(true, true));
  $('cNone').addEventListener('click', () => setConsent(false, false));
  $('cSave').addEventListener('click', () => setConsent($('cAnalytics').classList.contains('on'), $('cPersonal').classList.contains('on')));
  $('welcomeOk').addEventListener('click', () => { show('welcomeM', false); sfx.claim(); updateWallets(); afterConsent(); });
  $('pushYes').addEventListener('click', () => { SV.pushAsk.granted = true; save(); show('pushM', false); Analytics.track('push_yes'); const n = Native(); if (n && n.requestNotificationPermission) { try { n.requestNotificationPermission(); } catch {} scheduleNotifs(); } else toast(t('pushOn')); });
  $('pushNo').addEventListener('click', () => { show('pushM', false); Analytics.track('push_no'); });
  $('resume').addEventListener('click', resume);
  $('toMenu1').addEventListener('click', () => { Analytics.track('run_quit'); goMenu(); });
  $('toMenu2').addEventListener('click', goMenu);
  $('again').addEventListener('click', () => startRun(mode));
  $('lvlBtn').addEventListener('click', openLevel);
  $('lvlGo').addEventListener('click', () => { show('levelM', false); startRun('level'); });
  $('lvlClose').addEventListener('click', () => { pendingBoost = { shield: false, magnet: false }; show('levelM', false); if (state !== 'menu') goMenu(); });
  $('lvlBoosts').addEventListener('click', e => { const b = e.target.closest('[data-b]'); if (!b || b.disabled) return; pendingBoost[b.dataset.b] = !pendingBoost[b.dataset.b]; sfx.claim(); renderBoosts(); });
  $('winNext').addEventListener('click', () => { Ads.maybeInterstitial(); openLevel(); });
  $('winVillage').addEventListener('click', () => { goMenu(); openSheet('village'); });
  $('toMenu3').addEventListener('click', () => { Ads.maybeInterstitial(); goMenu(); });
  $('starChip').addEventListener('click', () => openSheet('village'));
  $('gear').addEventListener('click', () => openSheet('settings'));
  $('sheetBody').addEventListener('input', e => { if (e.target.id === 'musicVol') { SV.musicVol = (+e.target.value) / 100; audioInit(); setBusGains(); } });
  $('sheetBody').addEventListener('change', e => { if (e.target.id === 'musicVol') save(); });
  $('winClose').addEventListener('click', () => { Ads.maybeInterstitial(); goMenu(); });

  // 3) swipe in from the left edge closes a sheet, like "back" in every app
  (() => {
    const sh = document.querySelector('#sheet .sheet'); let x0 = null, y0 = 0, dx = 0, lock = false;
    $('sheet').addEventListener('touchstart', e => { const t0 = e.touches[0]; if (t0.clientX - $('sheet').getBoundingClientRect().left > 28) return; x0 = t0.clientX; y0 = t0.clientY; dx = 0; lock = false; sh.style.transition = 'none'; }, { passive: true });
    $('sheet').addEventListener('touchmove', e => {
      if (x0 === null) return; const t0 = e.touches[0]; dx = Math.max(0, t0.clientX - x0);
      if (!lock && Math.abs(t0.clientY - y0) > 24 && Math.abs(t0.clientY - y0) > dx) { x0 = null; sh.style.transform = ''; return; }
      lock = dx > 10; sh.style.transform = `translateX(${dx}px)`;
    }, { passive: true });
    const end = () => {
      if (x0 === null) return; x0 = null; sh.style.transition = 'transform .2s ease';
      if (dx > 80) { sh.style.transform = 'translateX(100%)'; vib(10); setTimeout(() => { closeSheet(); sh.style.transition = 'none'; sh.style.transform = ''; }, 190); }
      else sh.style.transform = '';
    };
    $('sheet').addEventListener('touchend', end); $('sheet').addEventListener('touchcancel', end);
  })();

  // 4) pull down to refresh the league table
  (() => {
    const body = $('sheetBody'), ptr = $('ptr'); let y0 = null, dy = 0, busy = false;
    const active = () => !$('sheet').hidden && sheetName === 'ranks' && sheetTab === 'league' && SV.league.joined && LEAGUE_URL;
    body.addEventListener('touchstart', e => { if (!active() || busy || body.scrollTop > 0) return; y0 = e.touches[0].clientY; dy = 0; }, { passive: true });
    body.addEventListener('touchmove', e => {
      if (y0 === null) return; dy = e.touches[0].clientY - y0; if (dy <= 0) { ptr.style.height = '0'; return; }
      ptr.style.transition = 'none'; ptr.style.height = Math.min(64, dy * .5) + 'px'; ptr.textContent = dy > 90 ? t('releaseRefresh') : t('pullRefresh');
    }, { passive: true });
    body.addEventListener('touchend', async () => {
      if (y0 === null) return; y0 = null; ptr.style.transition = '';
      if (dy <= 90) { ptr.style.height = '0'; return; }
      busy = true; ptr.textContent = t('leagueLoading'); ptr.classList.add('spin'); ptr.style.height = '40px'; vib(10);
      await Promise.all([leagueRefresh(), new Promise(r => setTimeout(r, 500))]);
      busy = false; ptr.classList.remove('spin'); ptr.style.height = '0';
    });
  })();
  $('shareBtn').addEventListener('click', openShare);
  $('offer').addEventListener('click', e => { const b = e.target.closest('[data-iap]'); if (b) { Analytics.track('offer_click', { id: b.dataset.iap }); IAP.buy(b.dataset.iap); } });
  $('shareGo').addEventListener('click', doShare);
  $('shareClose').addEventListener('click', () => show('shareM', false));
  $('doubleBtn').addEventListener('click', () => {
    if (run.doubled || run.sparks <= 0) return;
    Ads.rewarded('double').then(ok => {
      if (!ok || run.doubled) return;
      run.doubled = true; SV.sparks += run.sparks; SV.totalSparks += run.sparks; save();
      $('earnN').textContent = '+' + fmt(run.sparks * 2); $('doubleBtn').hidden = true; sfx.claim(); checkAch(); updateWallets();
    });
  });
  $('contVideo').addEventListener('click', () => {
    const keep = contT; contT = 999;
    Ads.rewarded('continue').then(ok => { if (ok) acceptContinue('video'); else contT = keep; });
  });
  $('contSparks').addEventListener('click', () => acceptContinue('sparks'));
  $('contNo').addEventListener('click', declineContinue);
  $('pause').addEventListener('click', e => { e.stopPropagation(); pause(); });
  stage.addEventListener('pointerdown', e => {
    if (e.target !== cv && !e.target.closest('#ready') && !e.target.closest('.hud')) return;
    tap();
  });
  addEventListener('keydown', e => {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      if (e.target.closest && e.target.closest('button, textarea, input')) return;
      e.preventDefault();
      if (state === 'pause') resume(); else if (state === 'ready' || state === 'play') tap();
    } else if (e.code === 'KeyP' || e.code === 'Escape') {
      if (!$('sheet').hidden) closeSheet(); else if (state === 'pause') resume(); else pause();
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { pause(); A.c?.suspend?.(); scheduleNotifs(); save(); }
    else if (A.c) A.c.resume?.();
  });

  /* ================= loop ================= */
  let last = performance.now();
  function frame(now) {
    const real = Math.min((now - last) / 1000, .033); last = now;
    if (state !== 'pause') update(real * ts, real);
    render();
    requestAnimationFrame(frame);
  }
  addEventListener('resize', resize);

  /* ================= monetization systems ================= */
  function energyOn() { return !SV.vip && (location.hash === '#energy' || ab('energy') === 1); }
  function regenLives() {
    if (SV.lives >= LIVES_MAX) { SV.livesT = Date.now(); return; }
    const n = Math.floor((Date.now() - SV.livesT) / LIFE_MS);
    if (n > 0) { SV.lives = Math.min(LIVES_MAX, SV.lives + n); SV.livesT += n * LIFE_MS; if (SV.lives >= LIVES_MAX) SV.livesT = Date.now(); }
  }
  function mmss(ms) {
    const s = Math.max(0, Math.ceil(ms / 1000)), hh = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), ss = s % 60, p = v => String(v).padStart(2, '0');
    return hh ? `${hh}:${p(m)}:${p(ss)}` : `${m}:${p(ss)}`;
  }
  const nextLifeMs = () => LIFE_MS - (Date.now() - SV.livesT);
  function updateLivesChip() {
    const el = $('livesChip');
    if (!energyOn()) { el.hidden = true; return; }
    regenLives(); el.hidden = false;
    el.textContent = '❤️ ' + SV.lives + (SV.lives < LIVES_MAX ? ' · ' + mmss(nextLifeMs()) : '');
  }
  function openLives() {
    regenLives();
    $('livesInfo').textContent = SV.lives >= LIVES_MAX ? t('livesFull') : t('nextLife', { t: mmss(nextLifeMs()) });
    $('livesRefill').innerHTML = SPARK_SVG + ' ' + t('refill', { n: fmt(150) }); $('livesRefill').disabled = SV.sparks < 150;
    show('livesM', true); Analytics.track('lives_empty');
  }
  function addLife(n) { SV.lives = Math.min(LIVES_MAX, SV.lives + n); if (SV.lives >= LIVES_MAX) SV.livesT = Date.now(); save(); updateLivesChip(); }
  function fillUntil() { document.querySelectorAll('[data-until]').forEach(el => { el.textContent = mmss(+el.dataset.until - Date.now()); }); }
  const starterUntil = () => SV.firstSeen + STARTER_MS;
  const starterActive = () => !SV.starterBought && SV.runs >= 1 && Date.now() < starterUntil();
  function passState() {
    const key = currentEvent().key;
    if (!SV.pass || SV.pass.key !== key) SV.pass = { key, xp: 0, premium: false, f: [], p: [] };
    return SV.pass;
  }
  const passLevel = ps => Math.min(PASS_LEVELS, Math.floor(ps.xp / PASS_XP));
  function passXP(n) { const ps = passState(), b = passLevel(ps); ps.xp += n; const a = passLevel(ps); if (a > b) toast('🎟️ ' + t('passLevelUp', { n: a })); }
  const passReward = (i, prem) => prem ? (i === PASS_LEVELS ? 'regal' : i % 5 === 0 ? 400 : 120) : (i % 5 === 0 ? 150 : 40);
  function passClaimable() {
    const ps = passState(), lvl = passLevel(ps);
    for (let i = 1; i <= lvl; i++) if (!ps.f.includes(i) || (ps.premium && !ps.p.includes(i))) return true;
    return false;
  }
  function claimPass(i, prem) {
    const ps = passState(), list = prem ? ps.p : ps.f;
    if (list.includes(i) || passLevel(ps) < i || (prem && !ps.premium)) return;
    list.push(i); const rw = passReward(i, prem);
    if (typeof rw === 'string') { if (!own(rw)) addWallet(2000); } else addWallet(rw);
    sfx.claim(); Analytics.track('pass_claim', { i, prem }); save(); renderSheet();
  }
  function renderPass() {
    const ps = passState(), lvl = passLevel(ps), left = currentEvent().left;
    const inLvl = lvl >= PASS_LEVELS ? PASS_XP : ps.xp - lvl * PASS_XP;
    let out = `<div class="item"><div class="ic">🎟️</div><div class="txt"><b>${t('passLevel', { n: lvl })} / ${PASS_LEVELS} · ${t('passEnds', { n: left })}</b><div class="progress"><i style="width:${Math.round(inLvl / PASS_XP * 100)}%"></i></div><small>${t('passXp', { a: fmt(inLvl), b: fmt(PASS_XP) })}</small></div></div>`;
    if (!ps.premium) out += `<button class="btn teal" data-act="iap" data-id="pass">${t('passBuy')} · ${money(4.99)}</button>`;
    out += `<p class="note">${t('passInfo')}</p><div class="pass"><div class="ph"><span></span><b>${t('passFree')}</b><b>👑 ${t('passPremium')}</b></div>`;
    for (let i = 1; i <= PASS_LEVELS; i++) {
      const cell = prem => {
        const rw = passReward(i, prem), got = (prem ? ps.p : ps.f).includes(i), can = lvl >= i && (!prem || ps.premium) && !got;
        const label = typeof rw === 'string' ? '🌟 ' + t('f_' + rw) : SPARK_SVG + ' ' + fmt(rw);
        const lock = !got && (lvl < i || (prem && !ps.premium)) ? '🔒 ' : '';
        return `<button class="pc ${got ? 'got' : ''} ${can ? 'can' : ''}" data-act="passClaim" data-i="${i}" data-p="${prem ? 1 : 0}" ${can ? '' : 'disabled'}>${got ? '✓ ' : lock}${label}</button>`;
      };
      out += `<div class="pr"><span class="${lvl >= i ? 'on' : ''}">${i}</span>${cell(false)}${cell(true)}</div>`;
    }
    return out + '</div>';
  }
  function dailyDeal() {
    const c = SPECIES.filter(s => s.how.t === 'buy' && !SV.owned.includes(s.id));
    if (!c.length) return null;
    const s = c[Math.floor(mulberry(hashStr('deal-' + todayUTC()))() * c.length)];
    return { s, price: Math.round(s.how.n * .7 / 10) * 10 };
  }
  const capsuleAllowed = () => !(navigator.languages || [navigator.language || '']).some(l => /-BE$/i.test(String(l)));
  function openCapsule() {
    if (SV.sparks < CAPSULE_COST) return;
    SV.sparks -= CAPSULE_COST; SV.stats.capsules = (SV.stats.capsules || 0) + 1;
    const x = Math.random(); let res;
    if (x < .55) { const n = Math.round(rand(150, 350) / 10) * 10; addWallet(n); res = SPARK_SVG + ' ' + fmt(n); }
    else if (x < .80) {
      const ups = UPGRADES.filter(u => (SV.upgrades[u.id] || 0) < u.costs.length);
      if (ups.length) { const u = ups[Math.floor(Math.random() * ups.length)]; SV.upgrades[u.id] = (SV.upgrades[u.id] || 0) + 1; res = u.ic + ' ' + t('capUpgrade', { u: t('u_' + u.id), n: SV.upgrades[u.id] }); }
      else { addWallet(500); res = SPARK_SVG + ' ' + fmt(500); }
    } else if (x < .95) {
      const c = SPECIES.filter(s => s.how.t === 'buy' && !SV.owned.includes(s.id));
      if (c.length) { const s = c[Math.floor(Math.random() * c.length)]; own(s.id); res = '🌟 ' + t('f_' + s.id); }
      else { addWallet(800); res = SPARK_SVG + ' ' + fmt(800); }
    } else { if (own('prism')) res = '🌈 ' + t('f_prism'); else { addWallet(1500); res = SPARK_SVG + ' ' + fmt(1500); } }
    Analytics.track('capsule_open', { roll: Math.round(x * 100) });
    updateWallets(); save(); sfx.unlock(); $('capRes').innerHTML = res; show('capM', true); checkAch(); renderSheet();
  }
  // Every id is always sent; entries with at = 0 cancel an older reminder that no longer applies.
  function scheduleNotifs() {
    const n = Native(); if (!n || !n.scheduleNotifications) return;
    const hr = bestHour(), risk = personalOn() ? churnRisk() : .5, mot = topMotive(), sn = playStreakDays();
    const at = (off, hh) => { const d = new Date(); d.setDate(d.getDate() + off); d.setHours(hh, 0, 0, 0); return d.getTime(); };
    const { ev, left } = currentEvent(), eName = t('e_' + ev.id);
    const motive = risk > .6 && mot.k !== 'streak' ? 'comeback' : mot.k === 'piggy' ? 'daily' : mot.k;
    const v1 = pickVariant(motive), vS = pickVariant('streak');
    const body = t('nb_' + v1, { n: sn, e: eName });
    const a1 = at(1, risk > .6 ? Math.max(9, hr - 2) : hr);
    SV.notifPending = { 1: { v: v1, at: a1 } };
    const list = [
      { id: 1, at: a1, title: 'Glimm', body, extra: { variant: v1 } },
      { id: 2, at: energyOn() && SV.lives < LIVES_MAX ? SV.livesT + (LIVES_MAX - SV.lives) * LIFE_MS : 0, title: 'Glimm', body: t('n_lives') },
      { id: 3, at: left > 2 ? Date.now() + (left - 2) * 86400000 : 0, title: 'Glimm', body: t('n_event', { e: t('e_' + ev.id) }) },
      { id: 4, at: SV.piggy >= PIGGY_CAP * .9 ? Date.now() + 3 * 3600000 : 0, title: 'Glimm', body: t('n_piggy') },
      { id: 5, at: sn >= 2 && SV.playStreak.last !== localDay() ? at(0, Math.max(hr, 19)) : 0, title: '🔥 Glimm', body: t('nb_' + vS, { n: sn }), extra: { variant: vS } },
      { id: 6, at: sn >= 2 ? at(1, Math.max(hr, 20)) : 0, title: '🔥 Glimm', body: t('nb_' + vS, { n: sn }), extra: { variant: vS } },
    ];
    if (list[4].at) SV.notifPending[5] = { v: vS, at: list[4].at };
    if (list[5].at) SV.notifPending[6] = { v: vS, at: list[5].at };
    Analytics.track('notif_plan', { hr, risk: Math.round(risk * 100), motive: mot.k });
    try { n.scheduleNotifications(list); } catch {}
  }

  /* ================= retention & consent ================= */
  const localDay = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const localDayOffset = k => { const d = new Date(); d.setDate(d.getDate() + k); return localDay(d); };
  const personalOn = () => !!(SV.consent && SV.consent.personal);
  function bumpPlayStreak() {
    const today = localDay(), ps = SV.playStreak || (SV.playStreak = { days: 0, last: null });
    if (ps.last === today) return;
    if (ps.last === localDayOffset(-1)) ps.days++;
    else {
      const gap = ps.last ? daysBetween(ps.last, today) - 1 : 0;
      if (ps.days > 0 && gap >= 1 && (SV.freezes || 0) >= gap) { SV.freezes -= gap; ps.days++; toast('🧊 ' + t('freezeUsed')); Analytics.track('freeze_used', { gap }); }
      else ps.days = 1;
    }
    ps.last = today;
    if ([3, 7, 14, 30, 50, 100].includes(ps.days)) toast('🔥 ' + t('streakMilestone', { n: ps.days }));
  }
  function daysBetween(a, b) { return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000); }
  function playStreakDays() {
    const ps = SV.playStreak; if (!ps || !ps.last) return 0;
    if (ps.last === localDay() || ps.last === localDayOffset(-1)) return ps.days;
    return daysBetween(ps.last, localDay()) - 1 <= (SV.freezes || 0) ? ps.days : 0;
  }
  function updateStreakChip() {
    const el = $('streakChip'), n = playStreakDays();
    el.hidden = n < 1; el.textContent = '🔥 ' + t('streakDays', { n }) + (SV.freezes ? ' · 🧊' + SV.freezes : '');
    el.classList.toggle('cold', !!SV.playStreak && SV.playStreak.last !== localDay());
  }
  function bestHour() {
    const hh = SV.playHours || [], total = hh.reduce((a, b) => a + (b || 0), 0);
    if (!personalOn() || total < 5) return 18;
    let bi = 18; for (let i = 0; i < 24; i++) if ((hh[i] || 0) > (hh[bi] || 0)) bi = i;
    return clamp(bi, 9, 21);
  }
  function churnRisk() {
    const days = new Set(SV.sessions || []); let active = 0;
    for (let i = 0; i < 7; i++) if (days.has(localDayOffset(-i))) active++;
    const away = SV.lastSession ? (Date.now() - SV.lastSession) / 86400000 : 0;
    return clamp(1 - active / 5 + away / 4 - Math.min(playStreakDays(), 10) / 20, 0, 1);
  }
  function topMotive() {
    const n = playStreakDays(), { ev, st } = currentEvent();
    if (n >= 3) return { k: 'streak', text: t('pushReason_streak', { n }) };
    if (st.p > 0 && !st.done) return { k: 'event', text: t('pushReason_event', { e: t('e_' + ev.id) }) };
    if (SV.piggy >= PIGGY_MIN) return { k: 'piggy', text: t('pushReason_piggy') };
    return { k: 'daily', text: t('pushReason_daily') };
  }
  let welcomeGift = 0;
  // Learning push texts, after Duolingo's published "sleeping, recovering bandit": each text variant has an
  // open rate; we pick the best-looking one with some exploration, and recently used texts rest for a while.
  const NOTIF_VARIANTS = { streak: 5, daily: 4, event: 3, comeback: 4 };
  function pickVariant(motive) {
    const B = SV.bandit || (SV.bandit = {}), n = NOTIF_VARIANTS[motive] || 1, now = Date.now();
    if (Math.random() < .12) return motive + (1 + Math.floor(Math.random() * n)); // keep testing every text a little
    let best = 1, bestScore = -9;
    for (let v = 1; v <= n; v++) {
      const st = B[motive + v] || { s: 0, o: 0, last: 0 };
      const mean = (st.o + 1) / (st.s + 2), explore = (Math.random() - .5) * .5 / Math.sqrt(st.s + 1);
      const daysAgo = st.last ? (now - st.last) / 86400000 : 99, rest = daysAgo < 1 ? .5 : daysAgo < 3 ? .2 : 0;
      const score = mean + explore - rest;
      if (score > bestScore) { bestScore = score; best = v; }
    }
    return motive + best;
  }
  function settleNotifs() {
    const P = SV.notifPending || {}, B = SV.bandit || (SV.bandit = {}), now = Date.now();
    for (const id of Object.keys(P)) {
      const p = P[id]; if (!p || p.at > now) continue;
      const st = B[p.v] || (B[p.v] = { s: 0, o: 0, last: 0 }); st.s++; st.last = p.at; delete P[id];
    }
  }
  window.glimmNotificationOpened = v => {
    if (typeof v !== 'string') return;
    const B = SV.bandit || (SV.bandit = {}), st = B[v] || (B[v] = { s: 0, o: 0, last: Date.now() });
    st.o++; Analytics.track('notif_open', { v }); save();
  };
  function sessionStart() {
    settleNotifs();
    const today = localDay(), away = SV.lastSession ? Math.floor((Date.now() - SV.lastSession) / 86400000) : 0;
    SV.sessions = (SV.sessions || []).filter(d => d !== today).concat(today).slice(-14);
    if (away >= 2 && SV.runs > 0) { welcomeGift = 100 + 50 * Math.min(away, 6); SV.sparks += welcomeGift; Analytics.track('comeback', { away, gift: welcomeGift }); }
    Analytics.track('churn_risk', { r: Math.round(churnRisk() * 100) });
    SV.lastSession = Date.now(); save();
  }
  // On-device player value model (only with personalization consent). Steers ad pacing and offers, never difficulty.
  function playerValue() {
    if (!personalOn()) return null;
    const days = Math.max(1, (Date.now() - SV.firstSeen) / 86400000), runsPerDay = SV.runs / days;
    const adRate = (SV.stats.adsWatched || 0) / Math.max(1, SV.runs), mem = navigator.deviceMemory || 4;
    const buy = clamp((SV.payer ? .6 : 0) + (mem >= 6 ? .15 : 0) + Math.min(runsPerDay, 20) / 40 + (SV.stats.capsules || 0) * .03, 0, 1);
    const ad = clamp(adRate * 1.5 + Math.min(runsPerDay, 30) / 60, 0, 1);
    return { buy, ad };
  }
  function openConsent() { const c = SV.consent || {}; $('cAnalytics').classList.toggle('on', !!c.analytics); $('cPersonal').classList.toggle('on', !!c.personal); show('consentM', true); }
  function setConsent(a, p) {
    const first = !SV.consent;
    SV.consent = { analytics: a, personal: p, ts: Date.now() }; save(); show('consentM', false);
    Analytics.track('consent', { a, p }); if (!$('sheet').hidden) renderSheet();
    if (first && state === 'menu') afterConsent();
  }
  function afterConsent() {
    if (goMenu.shown) return;
    if (welcomeGift) { $('welcomeTxt').textContent = t('welcomeGift', { n: fmt(welcomeGift) }); welcomeGift = 0; show('welcomeM', true); return; }
    goMenu.shown = true;
    setTimeout(() => { if (state !== 'menu') return; if (dailyAvailable()) openDaily(); else maybePushAsk(); }, 500);
  }
  function maybePushAsk() {
    const pa = SV.pushAsk || (SV.pushAsk = { n: 0, at: 0, granted: false });
    if (pa.granted || pa.n >= 3 || SV.runs < 3 || (pa.n && SV.runs - pa.at < 10)) return false;
    pa.n++; pa.at = SV.runs; save();
    $('pushReason').textContent = topMotive().text; show('pushM', true); Analytics.track('push_ask', { n: pa.n });
    return true;
  }
  setInterval(() => {
    fillUntil();
    if (state === 'menu') updateLivesChip();
    if (!$('livesM').hidden) { regenLives(); $('livesInfo').textContent = SV.lives >= LIVES_MAX ? t('livesFull') : t('nextLife', { t: mmss(nextLifeMs()) }); }
  }, 1000);
  try { const nv = Native(); if (nv && nv.vipActive) Promise.resolve(nv.vipActive()).then(v => { if (typeof v === 'boolean') { SV.vip = v; if (v) own('vip'); save(); refreshAll(); } }).catch(() => {}); } catch {}

  /* ================= mascot mood ================= */
  let menuPhase = 0, bubbleT = 1.5, bubbleShow = 0, bubbleText = '';
  function moodNow() {
    const ps = SV.playStreak;
    if (!SV.runs) return 'hello';
    if (ps && ps.last === localDay()) return 'happy';
    if (ps && ps.last === localDayOffset(-1)) return 'waiting';
    return bug.awake ? 'missed' : 'sleep';
  }
  function moodText() {
    const m = moodNow();
    if (m === 'hello') return t('m_hello');
    if (m === 'happy') return t('m_happy' + (1 + Math.floor(Math.random() * 3)));
    if (m === 'waiting') { const n = playStreakDays(); return n >= 2 ? t('m_waitStreak', { n }) : t('m_wait'); }
    if (m === 'sleep') return t('m_sleep');
    return t('m_missed');
  }

  /* ================= weekly leagues ================= */
  const LEAGUE_TIERS = [['spark', '✨'], ['candle', '🕯️'], ['lantern', '🏮'], ['lighthouse', '🗼'], ['comet', '☄️'], ['aurora', '🌌']];
  const PROMOTE = 7, DEMOTE = 5;
  function weekId() { const d = new Date(), day = (d.getUTCDay() + 6) % 7; return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day)).toISOString().slice(0, 10); }
  const weekEnds = () => new Date(weekId() + 'T00:00:00Z').getTime() + 7 * 86400000;
  function leagueXP(n) { const L = SV.league; if (L.week !== weekId()) { L.week = weekId(); L.xp = 0; } L.xp += Math.max(0, n | 0); }
  function cleanName(s) { s = String(s || '').replace(/\s+/g, ' ').trim(); return /^[\p{L}\p{N} _.-]{3,16}$/u.test(s) ? s : ''; }
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
  async function leagueApi(path, body) {
    if (!LEAGUE_URL) throw new Error('no server');
    const r = await fetch(LEAGUE_URL + path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {});
    if (!r.ok) throw new Error('http ' + r.status);
    return r.json();
  }
  let leagueData = null, leagueErr = '', leagueBusy = false;
  async function leagueRefresh() {
    if (leagueBusy || !SV.league.joined) return; leagueBusy = true;
    try {
      leagueData = await leagueApi('/group?id=' + encodeURIComponent(SV.league.id)); leagueErr = '';
      SV.league.tier = clamp(leagueData.tier | 0, 0, LEAGUE_TIERS.length - 1);
      const lr = leagueData.lastResult;
      if (lr && lr.week !== SV.league.seen) {
        SV.league.seen = lr.week; const ln = t('lg_' + LEAGUE_TIERS[SV.league.tier][0]);
        toast((lr.move === 'up' ? '🎉 ' + t('leagueUp', { l: ln }) : lr.move === 'down' ? t('leagueDown', { l: ln }) : t('leagueStay', { l: ln })));
      }
      save();
    } catch { leagueErr = t('leagueOffline'); }
    leagueBusy = false;
    if (!$('sheet').hidden && sheetName === 'ranks' && sheetTab === 'league') renderSheet();
  }
  async function leagueJoin(name) {
    SV.league.id = SV.league.id || uid();
    await leagueApi('/join', { id: SV.league.id, name, tier: SV.league.tier, lang });
    SV.league.joined = true; SV.league.name = name; save(); Analytics.track('league_join');
    await leagueSubmit(); await leagueRefresh();
  }
  async function leagueSubmit() { leagueXP(0); try { await leagueApi('/score', { id: SV.league.id, week: weekId(), xp: SV.league.xp }); } catch {} }
  function renderLeague() {
    leagueXP(0);
    const L = SV.league, [tid, tic] = LEAGUE_TIERS[L.tier];
    let out = `<div class="item"><div class="ic">${tic}</div><div class="txt"><b>${t('lg_' + tid)}</b><small>${t('weekEnds')} <span data-until="${weekEnds()}"></span></small><small>${t('leagueXp', { n: fmt(L.xp) })}</small></div></div>`;
    out += `<p class="note">${t('leagueRules', { p: PROMOTE, d: DEMOTE })}</p>`;
    if (!LEAGUE_URL) return out + `<p class="note">🌐 ${t('leagueNoServer')}</p>`;
    if (!L.joined) {
      return out + `<div class="item" style="flex-direction:column;align-items:stretch"><label class="sec" for="lgName" style="margin:0">${t('leagueName')}</label>
        <input id="lgName" class="lg-input" maxlength="16" autocomplete="off" value="${(L.name || '').replace(/"/g, '')}" placeholder="Glimmi">
        <small class="note">${t('leaguePublic')}</small><button class="btn" data-act="leagueJoin">${t('leagueJoin')}</button></div>`;
    }
    if (leagueErr) out += `<p class="note">⚠️ ${leagueErr}</p>`;
    if (!leagueData) { leagueRefresh(); return out + `<p class="note">${t('leagueLoading')}</p>`; }
    const m = leagueData.members || [], n = m.length;
    out += '<div class="lg">' + m.map((p, i) => {
      const zone = i < PROMOTE && L.tier < LEAGUE_TIERS.length - 1 ? 'up' : (L.tier > 0 && n >= 10 && i >= n - DEMOTE ? 'down' : '');
      const nm = String(p.name || '').replace(/[<>&"]/g, '');
      return `<div class="lg-row ${zone} ${p.me ? 'me' : ''}"><span>${i + 1}</span><b>${nm}</b><span>${fmt(p.xp | 0)}</span></div>`;
    }).join('') + '</div>';
    return out + `<p class="note">⬆️ ${t('promoZone')} · ⬇️ ${t('demoZone')}</p><button class="sbtn danger" data-act="leagueLeave" style="margin-top:8px">${t('leagueLeave')}</button>`;
  }

  applyI18n(); setMuteIcon(); ensureMissions(); resize(); resetRun();
  sessionStart();
  if (SV.league.joined && LEAGUE_URL) { leagueSubmit(); leagueRefresh(); }
  goMenu();
  Analytics.track('session_start', { lang, runs: SV.runs });
  window.__glimm = { get state() { return state; }, get run() { return run; }, get bug() { return bug; }, get rocks() { return rocks; }, get H() { return H; }, get S() { return S; }, flap: () => flap(), tap: () => tap(), sv: () => SV, rockGeo, pickVariant: m => pickVariant(m), scheduleNotifs: () => scheduleNotifs(), setLight: v => { light = v; }, get sparks() { return sparks; }, levelDef, winLevel: () => winLevel(), lvlProg: () => lvlProg(), cfg: () => ({ TUNE, CONT_PRICES, LIVES_MAX, LEAGUE_URL, RC_VERSION }) };
  requestAnimationFrame(frame);
})();
