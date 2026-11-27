/* Plus13 Paspoortbureau — adminpagina: ontwerp, ledenlijst, overzicht en PDF */
'use strict';
(() => {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const lcv = $('#lcv');
  const RATIO = 45 / 35; // pasfoto hoogte / breedte
  let cfg = PP.mergeCfg(null), members = [], bg = null, bgVersion = null;
  let prevKey = '', prevStamp = null, prevImg = null, boxes = null, drag = null;

  /* ---------- gegevens ---------- */
  async function loadBg(v) {
    if (v === bgVersion) return;
    bgVersion = v;
    bg = v ? await PP.loadImg((await PP.api('bg')).data).catch(() => null) : null;
  }
  async function start(r) {
    cfg = PP.mergeCfg(r.config);
    await loadBg(r.bgVersion || '');
    await PP.fontsReady(cfg);
    setMembers(r.members || []);
    fillInputs(); drawLayout(); renderAll();
  }
  function setMembers(list) {
    members = list;
    const nDone = members.filter(m => m.klaar).length;
    $('#pDone').textContent = nDone; $('#pTot').textContent = `/ ${members.length} klaar`;
    $('#pBar').style.width = (members.length ? nDone / members.length * 100 : 0) + '%';
    const withPhoto = PP.sortMembers(members, cfg).filter(m => m.heeftFoto);
    if (!members.some(m => m.key === prevKey)) prevKey = (withPhoto[0] || PP.sortMembers(members, cfg)[0] || {}).key || '';
    $('#prevSel').innerHTML = PP.sortMembers(members, cfg).map(m => `<option value="${PP.esc(m.key)}">${PP.esc(PP.fullName(m))}${m.heeftFoto ? '' : ' (geen foto)'}</option>`).join('') || '<option value="">Voorbeeldlid</option>';
    $('#prevSel').value = prevKey;
    const pm = members.find(x => x.key === prevKey), stamp = prevKey + '|' + (pm ? pm.bijgewerkt : '');
    if (stamp !== prevStamp) { prevStamp = stamp; loadPrev(); }
    if (!tableDirty()) renderTable();
    renderExportInfo();
  }
  async function reload() { setMembers((await PP.api('list')).members || []); renderAll(); }

  /* ---------- ontwerp-canvas ---------- */
  async function loadPrev() {
    const m = members.find(x => x.key === prevKey);
    prevImg = m && m.thumb ? await PP.loadImg(m.thumb) : null;
    drawLayout();
    if (m && m.heeftFoto) {
      try { const d = (await PP.api('photo', { key: m.key })).data; if (prevKey === m.key && d) { prevImg = (await PP.loadImg(d)) || prevImg; drawLayout(); } } catch { }
    }
  }
  function drawLayout() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    lcv.width = Math.round((lcv.clientWidth || 700) * dpr);
    lcv.height = Math.round(lcv.width * cfg.h / cfg.w);
    const m = members.find(x => x.key === prevKey) || { voornaam: 'Lotte', achternaam: 'Peeters', groep: 'Rakkers' };
    boxes = PP.draw(lcv.getContext('2d'), lcv.width / cfg.w, cfg, { bg, img: prevImg, m, nr: PP.numberMap(members, cfg).get(m.key) || 1, mode: 'edit' });
  }
  const pos = e => { const r = lcv.getBoundingClientRect(); return { x: (e.clientX - r.left) * lcv.width / r.width, y: (e.clientY - r.top) * lcv.height / r.height }; };
  const inside = (p, b, pad = 0) => b && p.x >= b.x - pad && p.y >= b.y - pad && p.x <= b.x + b.w + pad && p.y <= b.y + b.h + pad;
  function hit(p) {
    if (!boxes) return null;
    const s = lcv.width / cfg.w, b = boxes.photo, hs = 3 * s;
    if (Math.abs(p.x - (b.x + b.w)) < hs && Math.abs(p.y - (b.y + b.h)) < hs) return { t: 'resize' };
    for (const k in boxes.lines) if (inside(p, boxes.lines[k], 3)) return { t: 'line', k };
    if (inside(p, b)) return { t: 'photo' };
    return null;
  }
  const r2 = v => Math.round(v * 2) / 2, clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  lcv.addEventListener('pointerdown', e => {
    const p = pos(e), h = hit(p); if (!h) return;
    drag = { ...h, sx: p.x, sy: p.y, photo: { ...cfg.photo }, line: h.k ? { ...cfg.lines[h.k] } : null };
    lcv.setPointerCapture(e.pointerId); e.preventDefault();
  });
  lcv.addEventListener('pointermove', e => {
    const p = pos(e);
    if (!drag) { const h = hit(p); lcv.style.cursor = !h ? '' : h.t === 'resize' ? 'nwse-resize' : 'move'; return; }
    const s = lcv.width / cfg.w, dx = (p.x - drag.sx) / s, dy = (p.y - drag.sy) / s, o = drag.photo;
    if (drag.t === 'photo') { cfg.photo.x = clamp(r2(o.x + dx), 0, cfg.w - o.w); cfg.photo.y = clamp(r2(o.y + dy), 0, cfg.h - o.h); }
    else if (drag.t === 'resize') {
      let w = clamp(r2(o.w + dx), 5, cfg.w - o.x), h = cfg.lockRatio ? r2(w * RATIO) : clamp(r2(o.h + dy), 5, cfg.h - o.y);
      if (h > cfg.h - o.y) { h = cfg.h - o.y; if (cfg.lockRatio) w = r2(h / RATIO); }
      cfg.photo.w = w; cfg.photo.h = h;
    } else if (drag.t === 'line') { const l = cfg.lines[drag.k]; l.x = clamp(r2(drag.line.x + dx), 0, cfg.w - 2); l.y = clamp(r2(drag.line.y + dy), 2, cfg.h); }
    changed();
  });
  const endDrag = () => { drag = null; };
  lcv.addEventListener('pointerup', endDrag); lcv.addEventListener('pointercancel', endDrag);
  $('#prevSel').addEventListener('change', e => { prevKey = e.target.value; prevStamp = null; setMembers(members); });

  /* ---------- instellingen-velden ---------- */
  const getP = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
  function setP(o, p, v) { const ks = p.split('.'); let a = o; for (const k of ks.slice(0, -1)) a = a[k]; a[ks[ks.length - 1]] = v; }
  const numIn = (k, l) => `<label>${l}<input type="number" step="0.5" min="0" data-k="${k}"></label>`;
  const chk = (k, l) => `<label class="ck"><input type="checkbox" data-k="${k}">${l}</label>`;
  $('#fSize').innerHTML = numIn('w', 'Breedte') + numIn('h', 'Hoogte');
  $('#fPhoto').innerHTML = numIn('photo.x', 'Links') + numIn('photo.y', 'Boven') + numIn('photo.w', 'Breedte') + numIn('photo.h', 'Hoogte') + chk('lockRatio', 'Pasfoto 35:45');
  $('#fLines').innerHTML = Object.keys(PP.LINES).map(k => `<div class="f lnrow">${chk(`lines.${k}.on`, PP.LINES[k])}${numIn(`lines.${k}.x`, 'Links')}${numIn(`lines.${k}.y`, 'Basislijn')}${numIn(`lines.${k}.size`, 'Grootte')}${chk(`lines.${k}.bold`, 'Vet')}</div>`).join('');
  $('#fFont').innerHTML = `<label>Lettertype<select data-k="font">${PP.FONTS.map(f => `<option>${f}</option>`).join('')}</select></label><label>Kleur<input type="color" data-k="color"></label><label>Nummer-prefix<input data-k="nrPrefix"></label>${chk('upper', 'HOOFDLETTERS')}`;

  function fillInputs() {
    for (const i of $$('[data-k]')) {
      if (i === document.activeElement) continue;
      const v = getP(cfg, i.dataset.k);
      if (i.type === 'checkbox') i.checked = !!v; else i.value = v ?? '';
    }
    const px = [Math.round(cfg.w / 25.4 * PP.DPI), Math.round(cfg.h / 25.4 * PP.DPI)];
    $('#bgHint').textContent = `Exporteer in Krita op ${cfg.w} × ${cfg.h} mm aan 300 dpi = ${px[0]} × ${px[1]} pixels.` + (bg ? '' : ' Zolang er geen achtergrond is, zie je een voorlopig ontwerp.');
    $('#bgDel').hidden = !bg;
    $('#bgFit').hidden = !(bg && Math.abs(bg.naturalWidth / bg.naturalHeight - cfg.w / cfg.h) > 0.01);
    if (!$('#bgFit').hidden) $('#bgHint').textContent += ` Let op: je afbeelding (${bg.naturalWidth} × ${bg.naturalHeight} px) heeft een andere verhouding en wordt nu uitgerekt.`;
  }
  document.addEventListener('input', e => {
    const i = e.target.closest('[data-k]'); if (!i) return;
    const k = i.dataset.k;
    let v = i.type === 'checkbox' ? i.checked : i.type === 'number' ? parseFloat(i.value) : i.value;
    if (i.type === 'number' && !(v >= 0)) return;
    setP(cfg, k, v);
    if (cfg.lockRatio && (k === 'photo.w' || k === 'lockRatio')) cfg.photo.h = r2(cfg.photo.w * RATIO);
    if (cfg.lockRatio && k === 'photo.h') cfg.photo.w = r2(cfg.photo.h / RATIO);
    if (k === 'font') PP.fontsReady(cfg).then(() => { drawLayout(); renderAll(); });
    if (k === 'groepsvolgorde') { setMembers(members); }
    changed();
  });

  let gT, sT, saving = Promise.resolve();
  function changed() {
    fillInputs(); drawLayout();
    clearTimeout(gT); gT = setTimeout(() => { renderAll(); renderExportInfo(); }, 250);
    $('#saved').textContent = 'Wijzigingen nog niet bewaard…';
    clearTimeout(sT); sT = setTimeout(saveCfg, 900);
  }
  function saveCfg() {
    const snap = structuredClone(cfg);
    saving = saving.then(async () => {
      try { await PP.api('setConfig', { config: snap }); $('#saved').textContent = 'Ontwerp bewaard. Alle paspoorten zijn bijgewerkt.'; }
      catch (e) { $('#saved').textContent = 'Bewaren mislukt: ' + e.message; }
    });
  }

  /* achtergrond */
  $('#bgFile').addEventListener('change', async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    $('#bgHint').textContent = 'Uploaden…';
    try {
      const data = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); });
      const img = await PP.loadImg(data); if (!img) throw new Error('Deze afbeelding kan niet gelezen worden.');
      const r = await PP.api('setBg', { data });
      bgVersion = r.bgVersion; bg = img;
      fillInputs(); drawLayout(); renderAll();
    } catch (err) { $('#bgHint').textContent = 'Upload mislukt: ' + err.message; }
  });
  $('#bgFit').addEventListener('click', () => {
    cfg.w = Math.round(bg.naturalWidth / PP.DPI * 25.4 * 10) / 10; cfg.h = Math.round(bg.naturalHeight / PP.DPI * 25.4 * 10) / 10; changed();
  });
  $('#bgDel').addEventListener('click', async () => {
    if (!confirm('Achtergrond verwijderen? Je ziet dan weer het voorlopige ontwerp.')) return;
    try { const r = await PP.api('setBg', { data: null }); bgVersion = r.bgVersion; bg = null; fillInputs(); drawLayout(); renderAll(); } catch (e) { $('#bgHint').textContent = e.message; }
  });

  /* ---------- ledenlijst ---------- */
  function parseRows(text) {
    const out = [];
    for (const line of text.split(/\r?\n/)) {
      const parts = line.split(/\t|;/).map(x => x.trim()).filter((x, i, a) => x || i < a.length - 1);
      if (!parts.some(Boolean)) continue;
      let groep = '', voornaam = '', achternaam = '';
      if (parts.length >= 3) [groep, voornaam, achternaam] = parts;
      else { let name; if (parts.length === 2) [groep, name] = parts; else name = parts[0]; const sp = name.indexOf(' '); voornaam = sp < 0 ? name : name.slice(0, sp); achternaam = sp < 0 ? '' : name.slice(sp + 1); }
      if (/^(voor)?naam$/i.test(voornaam) || /^groep$/i.test(voornaam)) continue; // kopregel
      if (voornaam) out.push({ groep, voornaam, achternaam });
    }
    return out;
  }
  $('#mAdd').addEventListener('click', async () => {
    const rows = parseRows($('#mText').value);
    if (!rows.length) { $('#mMsg').textContent = 'Geen leden gevonden in de tekst.'; return; }
    const b = $('#mAdd'); b.disabled = true; $('#mMsg').textContent = 'Toevoegen…';
    try {
      const r = await PP.api('addMembers', { rows });
      $('#mMsg').textContent = `${r.added} toegevoegd` + (r.skipped ? `, ${r.skipped} overgeslagen (bestond al of geen voornaam).` : '.');
      if (r.added) $('#mText').value = '';
      await reload();
    } catch (e) { $('#mMsg').textContent = 'Mislukt: ' + e.message; }
    finally { b.disabled = false; }
  });

  const tableDirty = () => $$('#mBody [data-act=save]').some(b => !b.hidden);
  function renderTable() {
    const list = PP.sortMembers(members, cfg);
    $('#mBody').innerHTML = list.map(m => {
      const st = m.klaar ? '<span class="st ok">Klaar ✓</span>' : m.heeftFoto ? '<span class="st">Foto, niet klaar</span>' : '<span class="st todo">Geen foto</span>';
      return `<tr data-key="${PP.esc(m.key)}"><td><input data-f="groep" value="${PP.esc(m.groep)}" aria-label="Groep"></td><td><input data-f="voornaam" value="${PP.esc(m.voornaam)}" aria-label="Voornaam"></td>` +
        `<td><input data-f="achternaam" value="${PP.esc(m.achternaam)}" aria-label="Achternaam"></td><td>${st}</td>` +
        `<td><button class="btn sm" data-act="save" type="button" hidden>Opslaan</button> <button class="btn sm danger" data-act="del" type="button">Verwijder</button></td></tr>`;
    }).join('') || '<tr><td colspan="5" class="msg">Nog geen leden.</td></tr>';
  }
  $('#mBody').addEventListener('input', e => { const tr = e.target.closest('tr'); if (tr) tr.querySelector('[data-act=save]').hidden = false; });
  $('#mBody').addEventListener('click', async e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const tr = b.closest('tr'), key = tr.dataset.key, m = members.find(x => x.key === key); if (!m) return;
    b.disabled = true;
    try {
      if (b.dataset.act === 'save') {
        const v = f => tr.querySelector(`[data-f=${f}]`).value.trim();
        await PP.api('updateMember', { key, groep: v('groep'), voornaam: v('voornaam'), achternaam: v('achternaam') });
        b.hidden = true;
      } else {
        if (!confirm(`${PP.fullName(m)} verwijderen? De foto in Drive gaat naar de prullenbak.`)) { b.disabled = false; return; }
        await PP.api('deleteMember', { key });
      }
      await reload();
    } catch (err) { alert(err.message); b.disabled = false; }
  });

  /* ---------- overzicht ---------- */
  function renderAll() {
    const list = PP.sortMembers(members, cfg), nrs = PP.numberMap(members, cfg);
    $('#all').innerHTML = list.map(m => `<div class="pc"><canvas data-key="${PP.esc(m.key)}"></canvas><span>${PP.esc(PP.fullName(m))} · <span class="${m.klaar ? 'ok' : 'todo'}">${m.klaar ? 'klaar ✓' : m.heeftFoto ? 'niet klaar' : 'geen foto'}</span></span></div>`).join('') || '<p class="msg">Nog geen leden.</p>';
    requestAnimationFrame(() => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      for (const c of $$('#all canvas')) {
        const m = members.find(x => x.key === c.dataset.key);
        c.width = Math.round((c.clientWidth || 200) * dpr); c.height = Math.round(c.width * cfg.h / cfg.w);
        const t = c._t = (c._t || 0) + 1;
        PP.loadImg(m.thumb).then(img => { if (c._t === t) PP.draw(c.getContext('2d'), c.width / cfg.w, cfg, { bg, img, m, nr: nrs.get(m.key) }); });
      }
    });
  }

  /* ---------- PDF ---------- */
  function sheet() {
    const M = 7, G = 6;
    const o = [['p', 210, 297], ['l', 297, 210]].map(([or, PW, PH]) => {
      const c = Math.floor((PW - 2 * M + G) / (cfg.w + G)), r = Math.floor((PH - 2 * M + G) / (cfg.h + G));
      return { or, PW, PH, c, r, n: c * r, G };
    }).sort((a, b) => b.n - a.n)[0];
    if (!o.n) return null;
    o.x0 = (o.PW - (o.c * cfg.w + (o.c - 1) * G)) / 2; o.y0 = (o.PH - (o.r * cfg.h + (o.r - 1) * G)) / 2;
    return o;
  }
  function renderExportInfo() {
    const s = sheet(), n = members.length, noPhoto = members.filter(m => !m.heeftFoto).length, notDone = members.filter(m => !m.klaar).length;
    $('#exInfo').textContent = (s ? `${s.n} paspoorten per A4-blad (${s.or === 'p' ? 'staand' : 'liggend'}), dus ${Math.ceil(n / s.n) || 0} bladen voor ${n} leden. ` : 'Dit formaat past niet op A4; kies één paspoort per pagina. ') +
      'Drukresolutie 300 dpi, in de volgorde van de groepen en dan op naam.' + (noPhoto ? ` ${noPhoto} leden hebben nog geen foto en krijgen een leeg kader.` : '') + (notDone ? ` ${notDone} zijn nog niet aangevinkt als klaar.` : '');
  }
  function marks(d, x, y, w, h) {
    d.setLineWidth(0.15); d.setDrawColor(0);
    const L = 3, O = 1.2;
    for (const [cx, sx] of [[x, -1], [x + w, 1]]) for (const [cy, sy] of [[y, -1], [y + h, 1]]) { d.line(cx + sx * O, cy, cx + sx * (O + L), cy); d.line(cx, cy + sy * O, cx, cy + sy * (O + L)); }
  }
  $('#exBtn').addEventListener('click', async () => {
    if (!window.jspdf) { $('#exMsg').textContent = 'De PDF-bibliotheek is niet geladen. Herlaad de pagina.'; return; }
    const nrs = PP.numberMap(members, cfg);
    let list = PP.sortMembers(members, cfg);
    if ($('#exDone').checked) list = list.filter(m => m.klaar);
    if (!list.length) { $('#exMsg').textContent = 'Er zijn geen paspoorten om te exporteren.'; return; }
    const mode = $('#exMode').value, s = sheet();
    if (mode === 'a4' && !s) { $('#exMsg').textContent = 'Dit formaat past niet op A4.'; return; }
    const btn = $('#exBtn'); btn.disabled = true;
    try {
      /* volledige foto's ophalen, drie tegelijk */
      const photos = new Map(), todo = list.filter(m => m.heeftFoto);
      let i = 0, got = 0;
      const worker = async () => {
        while (i < todo.length) {
          const m = todo[i++];
          try { const d = (await PP.api('photo', { key: m.key })).data; photos.set(m.key, await PP.loadImg(d)); } catch { photos.set(m.key, await PP.loadImg(m.thumb)); }
          $('#exMsg').textContent = `Foto's ophalen: ${++got} van ${todo.length}…`;
        }
      };
      await Promise.all([worker(), worker(), worker()]);
      await PP.fontsReady(cfg);
      const { jsPDF } = window.jspdf, ori = cfg.w > cfg.h ? 'l' : 'p';
      const d = mode === 'single' ? new jsPDF({ unit: 'mm', format: [cfg.w, cfg.h], orientation: ori }) : new jsPDF({ unit: 'mm', format: 'a4', orientation: s.or });
      const cv = document.createElement('canvas');
      cv.width = Math.round(cfg.w / 25.4 * PP.DPI); cv.height = Math.round(cfg.h / 25.4 * PP.DPI);
      const sc = cv.width / cfg.w, ctx = cv.getContext('2d');
      for (let k = 0; k < list.length; k++) {
        const m = list[k];
        PP.draw(ctx, sc, cfg, { bg, img: photos.get(m.key) || null, m, nr: nrs.get(m.key), mode: 'print' });
        const url = cv.toDataURL('image/jpeg', 0.92);
        if (mode === 'single') { if (k) d.addPage([cfg.w, cfg.h], ori); d.addImage(url, 'JPEG', 0, 0, cfg.w, cfg.h); }
        else {
          const slot = k % s.n; if (k && !slot) d.addPage('a4', s.or);
          const x = s.x0 + (slot % s.c) * (cfg.w + s.G), y = s.y0 + Math.floor(slot / s.c) * (cfg.h + s.G);
          d.addImage(url, 'JPEG', x, y, cfg.w, cfg.h); marks(d, x, y, cfg.w, cfg.h);
        }
        $('#exMsg').textContent = `Paspoort ${k + 1} van ${list.length} tekenen…`;
        await new Promise(r => setTimeout(r));
      }
      d.save('paspoorten-plus13.pdf');
      $('#exMsg').textContent = `Klaar: ${list.length} paspoorten in paspoorten-plus13.pdf.`;
    } catch (e) { $('#exMsg').textContent = 'Export mislukt: ' + e.message; }
    finally { btn.disabled = false; }
  });

  /* ---------- start ---------- */
  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { drawLayout(); renderAll(); }, 150); });
  PP.boot('admin').then(start).catch(e => { $('#saved').textContent = 'Laden mislukt: ' + e.message; });
  setInterval(async () => { if (document.hidden || drag || tableDirty()) return; try { setMembers((await PP.api('list')).members || []); renderAll(); } catch { } }, 60000);
})();
