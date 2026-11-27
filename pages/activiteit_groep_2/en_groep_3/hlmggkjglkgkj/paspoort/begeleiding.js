/* Plus13 Paspoortbureau — pagina voor de begeleiding */
'use strict';
(() => {
  const $ = s => document.querySelector(s);
  const cv = $('#pcv');
  let cfg = PP.mergeCfg(null), members = [], bg = null, bgVersion = null;
  let selKey = null, work = null, photoBox = null, drag = null;
  const full = new Map(); // key+bijgewerkt → volledige foto (data-URL)

  const msg = t => { $('#msg').textContent = t || ''; };
  const sel = () => members.find(m => m.key === selKey);

  /* ---------- gegevens ---------- */
  async function loadBg(v) {
    if (v === bgVersion) return;
    bgVersion = v;
    if (!v) { bg = null; return; }
    try { bg = await PP.loadImg((await PP.api('bg')).data); } catch { bg = null; }
  }
  async function apply(r) {
    cfg = PP.mergeCfg(r.config);
    members = r.members || [];
    await PP.fontsReady(cfg);
    await loadBg(r.bgVersion || '');
    $('#status').textContent = members.length ? '' : 'De ledenlijst is nog leeg.';
    renderList();
    if (selKey) {
      if (!sel()) { selKey = null; work = null; showEditor(); }
      else if (!work || !work.dirty) await select(selKey, true);
      else drawEditor();
    }
  }
  async function refresh() {
    if (document.hidden || (work && work.dirty) || drag) return;
    try { await apply(await PP.api('list')); } catch { }
  }

  /* ---------- lijst ---------- */
  function renderList() {
    const groups = [...new Set(PP.sortMembers(members, cfg).map(m => m.groep).filter(Boolean))];
    const gs = $('#grp'), gv = gs.value;
    gs.innerHTML = '<option value="">Alle groepen</option>' + groups.map(g => `<option>${PP.esc(g)}</option>`).join('');
    gs.value = groups.includes(gv) ? gv : '';
    const q = PP.slug($('#q').value);
    const vis = PP.sortMembers(members, cfg).filter(m => (!gs.value || m.groep === gs.value) && (!q || PP.slug(PP.fullName(m) + ' ' + m.groep).includes(q)));
    const todo = vis.filter(m => !m.klaar), done = vis.filter(m => m.klaar);
    $('#todo').innerHTML = todo.map(item).join('') || `<li class="none">${members.length ? 'Niets meer te doen in deze selectie.' : ''}</li>`;
    $('#done').innerHTML = done.map(item).join('') || '<li class="none">Nog niemand.</li>';
    $('#nTodo').textContent = todo.length; $('#nDone').textContent = done.length;
    const nDone = members.filter(m => m.klaar).length;
    $('#pDone').textContent = nDone; $('#pTot').textContent = `/ ${members.length} klaar`;
    $('#pBar').style.width = (members.length ? nDone / members.length * 100 : 0) + '%';
    for (const c of document.querySelectorAll('.mi .th')) drawThumb(c, members.find(m => m.key === c.closest('.mi').dataset.key));
  }
  function item(m) {
    const st = m.klaar ? '' : m.heeftFoto ? ' · foto staat erin' : ' · nog geen foto';
    return `<li><button type="button" class="mi${m.klaar ? ' done' : ''}${m.key === selKey ? ' on' : ''}" data-key="${PP.esc(m.key)}">` +
      `<canvas class="th" width="88" height="${Math.round(88 * cfg.photo.h / cfg.photo.w)}"></canvas>` +
      `<span class="nm">${PP.esc(PP.fullName(m))}</span><span class="gr">${PP.esc(m.groep || 'Zonder groep')}${st}</span>` +
      (m.klaar ? '<span class="ok" title="Klaar">✓</span>' : '') + '</button></li>';
  }
  async function drawThumb(c, m) {
    if (!m || !m.thumb) return;
    const img = await PP.loadImg(m.thumb);
    if (!img) return;
    const box = { x: 0, y: 0, w: c.width, h: c.height };
    const p = PP.placeImage(img, box, m);
    c.getContext('2d').drawImage(img, p.dx, p.dy, p.dw, p.dh);
  }

  /* ---------- editor ---------- */
  function showEditor() { $('#edEmpty').hidden = !!selKey; $('#edBody').hidden = !selKey; }

  async function select(key, force) {
    if (!force && work && work.dirty && key !== selKey && !confirm(`De wijzigingen voor ${PP.fullName(sel())} zijn nog niet opgeslagen. Toch verdergaan?`)) return false;
    const m = members.find(x => x.key === key);
    if (!m) return false;
    const keep = force && key === selKey ? $('#msg').textContent : '';
    selKey = key;
    work = { cx: PP.num(m.cx, 0.5), cy: PP.num(m.cy, 0.4), zoom: PP.num(m.zoom, 1), klaar: !!m.klaar, img: null, photo: null, thumb: null, dirty: false };
    $('#eName').textContent = PP.fullName(m);
    $('#eGroup').textContent = m.groep || 'Zonder groep';
    $('#klaar').checked = work.klaar; $('#zoom').value = work.zoom; msg(keep);
    for (const b of document.querySelectorAll('.mi')) b.classList.toggle('on', b.dataset.key === key);
    showEditor();
    if (!force && matchMedia('(max-width:860px)').matches) $('.editor').scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (m.thumb) work.img = await PP.loadImg(m.thumb);
    drawEditor();
    if (m.heeftFoto) {
      const ck = m.key + '|' + m.bijgewerkt, w = work;
      let d = full.get(ck);
      if (!d) { try { d = (await PP.api('photo', { key: m.key })).data; if (d) full.set(ck, d); } catch { } }
      if (d && work === w && !w.photo) { w.img = (await PP.loadImg(d)) || w.img; drawEditor(); }
    }
    return true;
  }

  function drawEditor() {
    if (!work) return;
    const m = sel(); if (!m) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round((cv.clientWidth || 640) * dpr);
    cv.height = Math.round(cv.width * cfg.h / cfg.w);
    const boxes = PP.draw(cv.getContext('2d'), cv.width / cfg.w, cfg, { bg, img: work.img, m, nr: PP.numberMap(members, cfg).get(m.key), crop: work });
    photoBox = boxes.photo;
    $('#dropHint').hidden = !!work.img;
  }

  function dirty() { if (work) work.dirty = true; }

  async function setFile(file) {
    if (!selKey) { $('#status').textContent = 'Kies eerst links een lid, dan kan je de foto plakken.'; return; }
    msg('Foto verwerken…');
    try {
      const r = await PP.prepareFile(file);
      Object.assign(work, { img: r.img, photo: r.photo, thumb: r.thumb, cx: 0.5, cy: 0.4, zoom: 1 });
      $('#zoom').value = 1; dirty(); drawEditor();
      msg('Foto staat erin. Schuif ze goed en klik op Opslaan.');
    } catch (e) { msg(e.message); }
  }

  /* verschuiven en zoomen */
  const pos = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * cv.width / r.width, y: (e.clientY - r.top) * cv.height / r.height }; };
  const inBox = p => photoBox && p.x >= photoBox.x && p.y >= photoBox.y && p.x <= photoBox.x + photoBox.w && p.y <= photoBox.y + photoBox.h;
  cv.addEventListener('pointerdown', e => { if (!work || !work.img) return; const p = pos(e); if (!inBox(p)) return; drag = p; cv.setPointerCapture(e.pointerId); cv.style.cursor = 'grabbing'; e.preventDefault(); });
  cv.addEventListener('pointermove', e => {
    const p = pos(e);
    if (!drag) { cv.style.cursor = work && work.img && inBox(p) ? 'grab' : ''; return; }
    const pl = PP.placeImage(work.img, photoBox, work);
    work.cx -= (p.x - drag.x) / pl.dw; work.cy -= (p.y - drag.y) / pl.dh;
    PP.clampCrop(work.img, photoBox, work); drag = p; dirty(); drawEditor();
  });
  const endDrag = () => { drag = null; cv.style.cursor = ''; };
  cv.addEventListener('pointerup', endDrag); cv.addEventListener('pointercancel', endDrag);
  function setZoom(z) { if (!work || !work.img) return; work.zoom = Math.min(4, Math.max(1, z)); $('#zoom').value = work.zoom; PP.clampCrop(work.img, photoBox, work); dirty(); drawEditor(); }
  $('#zoom').addEventListener('input', e => setZoom(+e.target.value));
  cv.addEventListener('wheel', e => { if (!work || !work.img || !inBox(pos(e))) return; e.preventDefault(); setZoom(work.zoom - e.deltaY * 0.002); }, { passive: false });

  /* foto binnenhalen: plakken, knop, bestand, slepen */
  document.addEventListener('paste', e => {
    const files = [...(e.clipboardData && e.clipboardData.files || [])].filter(f => f.type.startsWith('image/'));
    if (!files.length) return;
    e.preventDefault(); setFile(files[0]);
  });
  $('#pasteBtn').addEventListener('click', async () => {
    try {
      for (const it of await navigator.clipboard.read()) {
        const t = it.types.find(x => x.startsWith('image/'));
        if (t) { const b = await it.getType(t); return setFile(new File([b], 'plak.png', { type: t })); }
      }
      msg('Er staat geen afbeelding op het klembord. Kopieer eerst een foto.');
    } catch { msg('Je browser laat plakken via de knop niet toe. Gebruik Ctrl+V (Cmd+V op Mac).'); }
  });
  $('#file').addEventListener('change', e => { if (e.target.files[0]) setFile(e.target.files[0]); e.target.value = ''; });
  const dz = $('#drop');
  dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('over'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('over'));
  dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('over'); const f = e.dataTransfer.files[0]; if (f) setFile(f); });
  /* een foto op een naam in de lijst slepen kiest meteen dat lid */
  for (const ul of [$('#todo'), $('#done')]) {
    ul.addEventListener('dragover', e => { const b = e.target.closest('.mi'); if (!b) return; e.preventDefault(); document.querySelectorAll('.mi.drop').forEach(x => x.classList.remove('drop')); b.classList.add('drop'); });
    ul.addEventListener('dragleave', e => { const b = e.target.closest('.mi'); if (b) b.classList.remove('drop'); });
    ul.addEventListener('drop', async e => {
      const b = e.target.closest('.mi'); if (!b) return; e.preventDefault(); b.classList.remove('drop');
      const f = e.dataTransfer.files[0]; if (!f) return;
      if (await select(b.dataset.key)) setFile(f);
    });
    ul.addEventListener('click', e => { const b = e.target.closest('.mi'); if (b) select(b.dataset.key); });
  }

  $('#klaar').addEventListener('change', e => { if (work) { work.klaar = e.target.checked; dirty(); } });

  /* opslaan */
  $('#save').addEventListener('click', async () => {
    const m = sel(); if (!m || !work) return;
    if (work.klaar && !m.heeftFoto && !work.photo) { msg('Er staat nog geen foto in. Voeg eerst een foto toe.'); $('#klaar').checked = work.klaar = false; return; }
    const btn = $('#save'); btn.disabled = true; msg(work.photo ? 'Foto uploaden…' : 'Opslaan…');
    try {
      const payload = { key: m.key, cx: work.cx, cy: work.cy, zoom: work.zoom, klaar: work.klaar };
      if (work.photo) { payload.photo = work.photo; payload.thumb = work.thumb; }
      const r = await PP.api('save', payload);
      Object.assign(m, r.member);
      if (work.photo) full.set(m.key + '|' + m.bijgewerkt, work.photo);
      work.photo = null; work.dirty = false;
      renderList();
      if (m.klaar) {
        const next = PP.sortMembers(members, cfg).find(x => !x.klaar);
        if (next) { await select(next.key, true); msg(`${PP.fullName(m)} is klaar. Volgende: ${PP.fullName(next)}.`); }
        else msg('Opgeslagen. Iedereen is klaar!');
      } else msg('Opgeslagen.');
    } catch (e) { msg('Opslaan mislukt: ' + e.message); }
    finally { btn.disabled = false; }
  });

  $('#q').addEventListener('input', renderList);
  $('#grp').addEventListener('change', renderList);
  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(drawEditor, 120); });
  window.addEventListener('beforeunload', e => { if (work && work.dirty) { e.preventDefault(); e.returnValue = ''; } });

  /* start */
  PP.boot('begeleiding').then(apply).catch(e => { $('#status').textContent = 'Laden mislukt: ' + e.message; });
  setInterval(refresh, 45000);
})();
