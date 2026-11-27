/**
 * Plus13 Paspoortbureau — backend in Google Apps Script.
 *
 * - Ledenlijst: tabblad "Leden" van de Google Sheet waar dit script aan vasthangt.
 * - Lay-out:    tabblad "Instellingen", cel A1 (JSON).
 * - Foto's:     map in Google Drive, elk bestand heet voornaam_achternaam.png (= de sleutel).
 * - Toegang:    twee codes in de Scripteigenschappen (CODE_BEGELEIDING en CODE_ADMIN).
 *
 * Installatie: zie README.md. Voer na het plakken één keer de functie setup() uit.
 */

const HEAD = ['key', 'voornaam', 'achternaam', 'groep', 'cx', 'cy', 'zoom', 'klaar', 'heeftFoto', 'thumb', 'bijgewerkt'];
const PROPS = PropertiesService.getScriptProperties();

/* ---------- eenmalige installatie ---------- */
function setup() {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName('Leden') || ss.insertSheet('Leden');
  if (sh.getLastRow() === 0) { sh.appendRow(HEAD); sh.setFrozenRows(1); }
  if (!ss.getSheetByName('Instellingen')) ss.insertSheet('Instellingen');
  if (!PROPS.getProperty('FOLDER_ID')) PROPS.setProperty('FOLDER_ID', DriveApp.createFolder("Plus13 paspoortfoto's").getId());
  if (!PROPS.getProperty('CODE_BEGELEIDING')) PROPS.setProperty('CODE_BEGELEIDING', randomCode());
  if (!PROPS.getProperty('CODE_ADMIN')) PROPS.setProperty('CODE_ADMIN', randomCode());
  Logger.log('Code begeleiding: ' + PROPS.getProperty('CODE_BEGELEIDING'));
  Logger.log('Code admin:       ' + PROPS.getProperty('CODE_ADMIN'));
  Logger.log('Fotomap:          ' + folder().getUrl());
}

function randomCode() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let s = '';
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

/* ---------- web-app ---------- */
function doGet() {
  return out({ ok: true, info: 'Plus13 paspoort-backend draait.' });
}

function doPost(e) {
  try {
    const req = JSON.parse(e.postData.contents);
    const role = req.code && req.code === PROPS.getProperty('CODE_ADMIN') ? 'admin'
      : req.code && req.code === PROPS.getProperty('CODE_BEGELEIDING') ? 'begeleiding' : null;
    if (!role) return out({ ok: false, error: 'Verkeerde code.' });
    const action = ACTIONS[req.action];
    if (!action) return out({ ok: false, error: 'Onbekende actie.' });
    if (action.admin && role !== 'admin') return out({ ok: false, error: 'Alleen de admin mag dit.' });
    const result = action.write ? withLock(() => action.run(req)) : action.run(req);
    return out(Object.assign({ ok: true, role: role }, result));
  } catch (err) {
    return out({ ok: false, error: String((err && err.message) || err) });
  }
}

function out(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function withLock(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try { return fn(); } finally { lock.releaseLock(); }
}

const ACTIONS = {
  list: { run: () => ({ config: getConfig(), bgVersion: PROPS.getProperty('BG_VERSION') || '', members: rows().map(pub) }) },

  photo: { run: r => ({ data: readFile(r.key + '.png') }) },

  bg: { run: () => ({ data: readFile('achtergrond.png') }) },

  /* begeleiding: foto, uitsnede en klaar-status van één lid */
  save: {
    write: true,
    run: r => {
      const m = rows().find(x => x.key === r.key);
      if (!m) throw new Error('Lid niet gevonden. Misschien heeft de admin het net aangepast; herlaad de pagina.');
      if (r.photo) { putFile(m.key + '.png', r.photo); m.heeftFoto = true; m.thumb = r.thumb || ''; }
      ['cx', 'cy', 'zoom'].forEach(k => { if (typeof r[k] === 'number' && isFinite(r[k])) m[k] = r[k]; });
      if (typeof r.klaar === 'boolean') m.klaar = r.klaar;
      m.bijgewerkt = new Date().toISOString();
      writeRow(m);
      return { member: pub(m) };
    }
  },

  /* admin */
  setConfig: {
    admin: true, write: true,
    run: r => { cfgRange().setValue(JSON.stringify(r.config || {})); return {}; }
  },

  setBg: {
    admin: true, write: true,
    run: r => {
      if (r.data) putFile('achtergrond.png', r.data); else trashFiles('achtergrond.png');
      const v = r.data ? String(Date.now()) : '';
      PROPS.setProperty('BG_VERSION', v);
      return { bgVersion: v };
    }
  },

  addMembers: {
    admin: true, write: true,
    run: r => {
      const have = new Set(rows().map(m => m.key));
      const fresh = [];
      let skipped = 0;
      (r.rows || []).forEach(x => {
        const voornaam = clean(x.voornaam), achternaam = clean(x.achternaam), groep = clean(x.groep);
        const key = makeKey(voornaam, achternaam);
        if (!voornaam || have.has(key)) { skipped++; return; }
        have.add(key);
        fresh.push({ key, voornaam, achternaam, groep, cx: 0.5, cy: 0.4, zoom: 1, klaar: false, heeftFoto: false, thumb: '', bijgewerkt: '' });
      });
      if (fresh.length) {
        const sh = sheet(), head = header();
        sh.getRange(sh.getLastRow() + 1, 1, fresh.length, head.length).setValues(fresh.map(m => head.map(h => (m[h] === undefined ? '' : m[h]))));
      }
      return { added: fresh.length, skipped };
    }
  },

  updateMember: {
    admin: true, write: true,
    run: r => {
      const all = rows();
      const m = all.find(x => x.key === r.key);
      if (!m) throw new Error('Lid niet gevonden.');
      const voornaam = clean(r.voornaam), achternaam = clean(r.achternaam);
      if (!voornaam) throw new Error('Voornaam mag niet leeg zijn.');
      const newKey = makeKey(voornaam, achternaam);
      if (newKey !== m.key) {
        if (all.some(x => x.key === newKey)) throw new Error('Er bestaat al een lid met die naam.');
        const f = findFile(m.key + '.png');
        if (f) f.setName(newKey + '.png');
      }
      Object.assign(m, { key: newKey, voornaam, achternaam, groep: clean(r.groep) });
      writeRow(m);
      return { member: pub(m) };
    }
  },

  deleteMember: {
    admin: true, write: true,
    run: r => {
      const m = rows().find(x => x.key === r.key);
      if (!m) return {};
      trashFiles(m.key + '.png');
      sheet().deleteRow(m._row);
      return {};
    }
  }
};

/* ---------- Sheet ---------- */
function sheet() { return SpreadsheetApp.getActive().getSheetByName('Leden'); }
function cfgRange() { return SpreadsheetApp.getActive().getSheetByName('Instellingen').getRange('A1'); }
function header() { return sheet().getRange(1, 1, 1, sheet().getLastColumn()).getValues()[0].map(String); }

function rows() {
  const values = sheet().getDataRange().getValues();
  const head = values.shift().map(String);
  return values
    .map((r, i) => { const o = { _row: i + 2 }; head.forEach((h, j) => { o[h] = r[j]; }); return o; })
    .filter(o => o.key);
}

function writeRow(m) {
  const head = header();
  sheet().getRange(m._row, 1, 1, head.length).setValues([head.map(h => (m[h] === undefined ? '' : m[h]))]);
}

function pub(m) {
  return {
    key: String(m.key), voornaam: String(m.voornaam || ''), achternaam: String(m.achternaam || ''), groep: String(m.groep || ''),
    cx: num(m.cx, 0.5), cy: num(m.cy, 0.4), zoom: num(m.zoom, 1),
    klaar: m.klaar === true || m.klaar === 'TRUE', heeftFoto: m.heeftFoto === true || m.heeftFoto === 'TRUE',
    thumb: String(m.thumb || ''), bijgewerkt: m.bijgewerkt instanceof Date ? m.bijgewerkt.toISOString() : String(m.bijgewerkt || '')
  };
}

function getConfig() {
  const v = cfgRange().getValue();
  try { return v ? JSON.parse(v) : null; } catch (e) { return null; }
}

function num(v, d) { return v === '' || v === null || isNaN(Number(v)) ? d : Number(v); }
function clean(s) { return String(s || '').trim().replace(/^[=+\-@]+/, ''); }
function slug(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
function makeKey(v, a) { return slug(v) + '_' + slug(a); }

/* ---------- Drive ---------- */
function folder() { return DriveApp.getFolderById(PROPS.getProperty('FOLDER_ID')); }

function findFile(name) {
  const it = folder().getFilesByName(name);
  while (it.hasNext()) { const f = it.next(); if (!f.isTrashed()) return f; }
  return null;
}

function trashFiles(name) {
  const it = folder().getFilesByName(name);
  while (it.hasNext()) it.next().setTrashed(true);
}

function putFile(name, dataUrl) {
  const m = /^data:([^;]+);base64,(.*)$/.exec(dataUrl || '');
  if (!m) throw new Error('Ongeldige afbeelding.');
  trashFiles(name);
  folder().createFile(Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], name));
}

function readFile(name) {
  const f = findFile(name);
  if (!f) return null;
  const b = f.getBlob();
  return 'data:' + b.getContentType() + ';base64,' + Utilities.base64Encode(b.getBytes());
}
