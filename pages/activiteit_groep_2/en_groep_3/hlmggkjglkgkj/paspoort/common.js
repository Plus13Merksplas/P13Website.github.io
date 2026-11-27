/* Plus13 Paspoortbureau — gedeelde code voor index.html (begeleiding) en admin.html */
'use strict';
const PP = (() => {
  // ▼ Plak hier de URL van je Apps Script web-app (eindigt op /exec). Leeg laten = demo-modus.
  const API_URL = 'https://script.google.com/macros/s/AKfycbxCW8Op466dkEKlh6qR_qkH_niqqogphLMVFVYBRpetPp-f-eOK6oYBf79QY3RWeKAi/exec';
  // ▲

  const PT = 0.3528;           // 1 punt in mm
  const DPI = 300;             // drukresolutie
  const PHOTO_MAX = 1200;      // langste zijde van de bewaarde foto (px)
  const THUMB_MAX = 240;       // langste zijde van het voorbeeldje (px)
  const LINES = { achternaam: 'Achternaam', voornaam: 'Voornaam', groep: 'Groep', nummer: 'Nummer' };
  const FONTS = ['Courier Prime', 'Special Elite', 'Archivo Narrow', 'Oswald', 'Inter'];
  const DEF = {
    w: 95, h: 66,
    photo: { x: 5, y: 15, w: 24, h: 31 },
    lockRatio: true,
    font: 'Courier Prime', color: '#1a1a1a', upper: true, nrPrefix: 'P13-', groepsvolgorde: '',
    lines: {
      achternaam: { on: true, x: 34, y: 22, size: 10, bold: true },
      voornaam: { on: true, x: 34, y: 31, size: 10, bold: true },
      groep: { on: true, x: 34, y: 40, size: 9, bold: false },
      nummer: { on: true, x: 34, y: 49, size: 9, bold: false }
    }
  };
  const coll = new Intl.Collator('nl', { sensitivity: 'base', numeric: true });
  let role = 'begeleiding';

  /* ---------- kleine hulpjes ---------- */
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const slug = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const makeKey = (v, a) => slug(v) + '_' + slug(a);
  const fullName = m => [m.voornaam, m.achternaam].filter(Boolean).join(' ');
  const num = (v, d) => (v === '' || v == null || isNaN(+v) ? d : +v);

  function mergeCfg(d) {
    const c = structuredClone(DEF);
    if (!d || typeof d !== 'object') return c;
    for (const k of Object.keys(DEF)) {
      if (!(k in d)) continue;
      if (k === 'lines') for (const l in c.lines) c.lines[l] = { ...c.lines[l], ...((d.lines || {})[l] || {}) };
      else if (k === 'photo') c.photo = { ...c.photo, ...d.photo };
      else c[k] = d[k];
    }
    return c;
  }

  /* volgorde: groepsvolgorde uit de instellingen, dan alfabetisch op groep, voornaam, achternaam */
  function sortMembers(list, cfg) {
    const order = String(cfg.groepsvolgorde || '').split(/[,;\n]/).map(s => s.trim().toLowerCase()).filter(Boolean);
    const gi = g => { const i = order.indexOf(String(g || '').toLowerCase()); return i < 0 ? 999 : i; };
    return [...list].sort((a, b) => gi(a.groep) - gi(b.groep) || coll.compare(a.groep || '', b.groep || '') ||
      coll.compare(a.voornaam || '', b.voornaam || '') || coll.compare(a.achternaam || '', b.achternaam || ''));
  }
  const numberMap = (list, cfg) => new Map(sortMembers(list, cfg).map((m, i) => [m.key, i + 1]));

  /* ---------- backend ---------- */
  const codeKey = () => 'pp-code-' + role;
  function getCode() { try { return localStorage.getItem(codeKey()) || ''; } catch { return memCode; } }
  let memCode = '';
  function setCode(c) { memCode = c; try { localStorage.setItem(codeKey(), c); } catch { } }

  async function api(action, data = {}) {
    if (!API_URL) return demo(action, data);
    let res;
    try {
      res = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ ...data, action, code: getCode() }) });
    } catch { throw new Error('Geen verbinding met de Google-backend.'); }
    let j;
    try { j = await res.json(); } catch { throw new Error('Onverwacht antwoord van de backend (is de web-app gedeeld met "Iedereen"?).'); }
    if (!j.ok) throw new Error(j.error || 'Onbekende fout.');
    return j;
  }

  /* Toont het code-scherm tot de code klopt; geeft het eerste 'list'-antwoord terug. */
  async function boot(pageRole) {
    role = pageRole;
    if (!API_URL) { const d = document.getElementById('demo'); if (d) d.hidden = false; return api('list'); }
    const tryList = async () => { const r = await api('list'); if (role === 'admin' && r.role !== 'admin') throw new Error('Dit is niet de admincode.'); return r; };
    if (getCode()) { try { return await tryList(); } catch { } }
    const ov = document.getElementById('login'), form = document.getElementById('loginForm'), msg = document.getElementById('loginMsg');
    ov.hidden = false;
    document.getElementById('loginCode').focus();
    return new Promise(resolve => {
      form.addEventListener('submit', async e => {
        e.preventDefault();
        setCode(document.getElementById('loginCode').value.trim());
        msg.textContent = 'Controleren…';
        try { const r = await tryList(); ov.hidden = true; resolve(r); } catch (err) { msg.textContent = err.message; }
      });
    });
  }

  /* ---------- demo-modus: alles in deze browser, zonder Google ---------- */
  const DEMO = 'pp-demo-v1', demoPhotos = new Map();
  function demoState() {
    try { const s = JSON.parse(localStorage.getItem(DEMO)); if (s) return s; } catch { }
    const names = [['Rakkers', 'Lotte', 'Peeters'], ['Rakkers', 'Wout', 'Janssens'], ['Rakkers', 'Fien', 'Maes'], ['Toppers', 'Jules', 'Wouters'], ['Toppers', 'Nora', 'Claes'], ['Toppers', 'Mats', 'Goossens']];
    return { config: null, bg: null, members: names.map(([g, v, a]) => blank(v, a, g)) };
  }
  const blank = (voornaam, achternaam, groep) => ({ key: makeKey(voornaam, achternaam), voornaam, achternaam, groep, cx: 0.5, cy: 0.4, zoom: 1, klaar: false, heeftFoto: false, thumb: '', bijgewerkt: '' });
  function demoSave(s) { try { localStorage.setItem(DEMO, JSON.stringify(s)); } catch { } }
  async function demo(action, r) {
    await new Promise(res => setTimeout(res, 120));
    const s = demoState(), find = k => s.members.find(m => m.key === k);
    switch (action) {
      case 'list': return { ok: true, role: 'admin', config: s.config, bgVersion: s.bg ? 'demo' : '', members: s.members };
      case 'photo': return { ok: true, data: demoPhotos.get(r.key) || (find(r.key) || {}).thumb || null };
      case 'bg': return { ok: true, data: s.bg };
      case 'save': {
        const m = find(r.key); if (!m) throw new Error('Lid niet gevonden.');
        if (r.photo) { demoPhotos.set(m.key, r.photo); m.heeftFoto = true; m.thumb = r.thumb || ''; }
        for (const k of ['cx', 'cy', 'zoom']) if (typeof r[k] === 'number') m[k] = r[k];
        if (typeof r.klaar === 'boolean') m.klaar = r.klaar;
        m.bijgewerkt = new Date().toISOString(); demoSave(s); return { ok: true, member: m };
      }
      case 'setConfig': s.config = r.config; demoSave(s); return { ok: true };
      case 'setBg': s.bg = r.data || null; demoSave(s); return { ok: true, bgVersion: r.data ? String(Date.now()) : '' };
      case 'addMembers': {
        let added = 0, skipped = 0;
        for (const x of r.rows || []) { const k = makeKey(x.voornaam, x.achternaam); if (!x.voornaam || find(k)) { skipped++; continue; } s.members.push(blank(x.voornaam, x.achternaam, x.groep || '')); added++; }
        demoSave(s); return { ok: true, added, skipped };
      }
      case 'updateMember': {
        const m = find(r.key); if (!m) throw new Error('Lid niet gevonden.');
        const nk = makeKey(r.voornaam, r.achternaam);
        if (nk !== m.key && find(nk)) throw new Error('Er bestaat al een lid met die naam.');
        if (demoPhotos.has(m.key)) { demoPhotos.set(nk, demoPhotos.get(m.key)); demoPhotos.delete(m.key); }
        Object.assign(m, { key: nk, voornaam: r.voornaam, achternaam: r.achternaam, groep: r.groep }); demoSave(s); return { ok: true, member: m };
      }
      case 'deleteMember': s.members = s.members.filter(m => m.key !== r.key); demoPhotos.delete(r.key); demoSave(s); return { ok: true };
    }
    throw new Error('Onbekende actie.');
  }

  /* ---------- afbeeldingen ---------- */
  const imgCache = new Map();
  function loadImg(src) {
    if (!src) return Promise.resolve(null);
    if (!imgCache.has(src)) imgCache.set(src, new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; }));
    return imgCache.get(src);
  }
  function scaleTo(img, max, type, q) {
    const iw = img.naturalWidth, ih = img.naturalHeight, r = Math.min(1, max / Math.max(iw, ih));
    const c = document.createElement('canvas'); c.width = Math.round(iw * r); c.height = Math.round(ih * r);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL(type, q);
  }
  /* Een gekozen/geplakte foto → PNG (max 1200 px) om te bewaren + klein JPG-voorbeeldje. */
  async function prepareFile(file) {
    if (!file || !/^image\//.test(file.type || 'image/')) throw new Error('Dat is geen afbeelding.');
    const url = URL.createObjectURL(file);
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Deze afbeelding kan niet gelezen worden. Gebruik een JPG of PNG.')); i.src = url; });
    const photo = scaleTo(img, PHOTO_MAX, 'image/png');
    const thumb = scaleTo(img, THUMB_MAX, 'image/jpeg', 0.8);
    URL.revokeObjectURL(url);
    return { photo, thumb, img: await loadImg(photo) };
  }

  /* ---------- uitsnede ----------
     Een uitsnede is relatief: cx/cy = welk punt van de foto (0–1) in het midden van het kader staat,
     zoom = hoeveel keer groter dan 'net vullend'. Zo blijft elke uitsnede kloppen als het kader
     groter, kleiner of anders van vorm wordt. */
  function placeImage(img, box, crop) {
    const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    const k = Math.max(box.w / iw, box.h / ih) * Math.max(1, num(crop && crop.zoom, 1));
    const dw = iw * k, dh = ih * k;
    let dx = box.x + box.w / 2 - num(crop && crop.cx, 0.5) * dw;
    let dy = box.y + box.h / 2 - num(crop && crop.cy, 0.4) * dh;
    dx = Math.min(box.x, Math.max(box.x + box.w - dw, dx));
    dy = Math.min(box.y, Math.max(box.y + box.h - dh, dy));
    return { dx, dy, dw, dh };
  }
  function clampCrop(img, box, crop) {
    const p = placeImage(img, box, crop);
    crop.cx = (box.x + box.w / 2 - p.dx) / p.dw;
    crop.cy = (box.y + box.h / 2 - p.dy) / p.dh;
  }

  /* ---------- tekenen ---------- */
  function silhouette(c, b) {
    c.fillStyle = '#d9d3c7'; c.fillRect(b.x, b.y, b.w, b.h);
    c.fillStyle = '#b8b0a2';
    c.beginPath(); c.arc(b.x + b.w / 2, b.y + b.h * 0.38, b.w * 0.22, 0, 7); c.fill();
    c.beginPath(); c.ellipse(b.x + b.w / 2, b.y + b.h * 1.02, b.w * 0.42, b.h * 0.36, 0, Math.PI, 0); c.fill();
  }
  function defaultBg(c, s, cfg) {
    const W = cfg.w * s, H = cfg.h * s;
    const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#f3eee4'); g.addColorStop(1, '#e6ddcd');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.strokeStyle = 'rgba(92,20,39,.08)'; c.lineWidth = 0.25 * s;
    for (let r = 6; r < cfg.w; r += 4) { c.beginPath(); c.arc(W * 0.85, H * 0.75, r * s, 0, 7); c.stroke(); }
    c.fillStyle = '#5c1427'; c.fillRect(0, 0, W, 10 * s);
    c.fillStyle = '#d6a943'; c.font = `700 ${4.2 * s}px Oswald,sans-serif`; c.textBaseline = 'middle';
    c.fillText('PASPOORT · PASSPORT', 5 * s, 5.2 * s);
    c.fillStyle = 'rgba(0,0,0,.45)'; c.font = `400 ${2.2 * s}px Inter,sans-serif`; c.textBaseline = 'alphabetic';
    for (const k in LINES) { const l = cfg.lines[k]; if (l && l.on) c.fillText(LINES[k].toUpperCase(), l.x * s, (l.y - l.size * PT - 1.2) * s); }
  }

  /* Tekent één paspoort. s = pixels per mm. mode: 'screen' | 'print' | 'edit'. Geeft de kaders terug (in px). */
  function draw(c, s, cfg, o) {
    const { bg = null, img = null, m = {}, nr = 1, mode = 'screen' } = o;
    const crop = o.crop || m;
    const W = cfg.w * s, H = cfg.h * s;
    c.clearRect(0, 0, W, H);
    if (bg) c.drawImage(bg, 0, 0, W, H); else defaultBg(c, s, cfg);
    const box = { x: cfg.photo.x * s, y: cfg.photo.y * s, w: cfg.photo.w * s, h: cfg.photo.h * s };
    c.save(); c.beginPath(); c.rect(box.x, box.y, box.w, box.h); c.clip();
    if (img) { const p = placeImage(img, box, crop); c.drawImage(img, p.dx, p.dy, p.dw, p.dh); }
    else if (mode !== 'print') silhouette(c, box);
    c.restore();
    if (!img && mode === 'print') { c.strokeStyle = '#999'; c.lineWidth = 0.2 * s; c.strokeRect(box.x, box.y, box.w, box.h); }

    const vals = { achternaam: m.achternaam, voornaam: m.voornaam, groep: m.groep, nummer: cfg.nrPrefix + String(nr).padStart(3, '0') };
    const boxes = { photo: box, lines: {} };
    c.fillStyle = cfg.color; c.textBaseline = 'alphabetic';
    for (const k of Object.keys(LINES)) {
      const l = cfg.lines[k]; if (!l || !l.on) continue;
      let t = String(vals[k] || (mode === 'edit' ? LINES[k] : ''));
      if (cfg.upper) t = t.toLocaleUpperCase('nl');
      const fam = `"${cfg.font}",monospace`, wt = l.bold ? 700 : 400, max = W - l.x * s - 2 * s;
      let fs = l.size * PT * s;
      c.font = `${wt} ${fs}px ${fam}`;
      while (c.measureText(t).width > max && fs > 3 * s) { fs *= 0.95; c.font = `${wt} ${fs}px ${fam}`; }
      c.fillText(t, l.x * s, l.y * s);
      boxes.lines[k] = { x: l.x * s, y: l.y * s - fs * 0.85, w: Math.max(c.measureText(t).width, 4 * s), h: fs * 1.1 };
    }
    if (mode === 'edit') {
      c.save(); c.setLineDash([5, 4]); c.lineWidth = Math.max(1.5, 0.25 * s); c.strokeStyle = '#d6a943';
      c.strokeRect(box.x, box.y, box.w, box.h);
      for (const k in boxes.lines) { const b = boxes.lines[k]; c.strokeRect(b.x - 2, b.y - 2, b.w + 4, b.h + 4); }
      c.setLineDash([]); c.fillStyle = '#d6a943'; const hs = 3 * s;
      c.fillRect(box.x + box.w - hs / 2, box.y + box.h - hs / 2, hs, hs);
      c.restore();
    }
    return boxes;
  }

  async function fontsReady(cfg) {
    try { await Promise.all([document.fonts.load(`700 20px "${cfg.font}"`), document.fonts.load(`400 20px "${cfg.font}"`), document.fonts.load('700 20px Oswald')]); } catch { }
  }

  return { isDemo: !API_URL, PT, DPI, LINES, FONTS, DEF, esc, slug, makeKey, fullName, num, mergeCfg, sortMembers, numberMap, api, boot, loadImg, prepareFile, placeImage, clampCrop, draw, fontsReady };
})();
