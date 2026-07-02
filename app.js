(() => {
  const DATA = window.GORMITI_DATA;
  const STORAGE_KEY = 'gormiti-checklist-v1';
  const app = document.getElementById('app');
  const importFile = document.getElementById('importFile');
  let view = { screen: 'home', seriesId: null, filter: 'all', query: '' };
  let state = loadState();

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('service-worker.js').catch(() => {}));
  }

  function loadState(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch { return {}; }
  }
  function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  function allCharacters(series){ return series.tribes.flatMap(t => t.characters.map(c => ({...c, tribe:t}))); }
  function itemState(id){ return state[id] || {figure:false, card:false}; }
  function setItemState(id, type, value){ state[id] = {...itemState(id), [type]: value}; saveState(); render(); }
  function seriesStats(series){
    const chars = allCharacters(series);
    const figures = chars.filter(c => itemState(c.id).figure).length;
    const cards = chars.filter(c => itemState(c.id).card).length;
    const complete = chars.filter(c => itemState(c.id).figure && itemState(c.id).card).length;
    return { total: chars.length, figures, cards, complete };
  }
  function pct(n,d){ return d ? Math.round((n/d)*100) : 0; }
  function escapeHTML(str){ return String(str).replace(/[&<>'"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[s])); }
  function checkIcon(){ return `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M4 12.5l5 5L20 6"/></svg>`; }
  function toast(msg){
    let el = document.querySelector('.toast');
    if(!el){ el = document.createElement('div'); el.className = 'toast'; document.body.appendChild(el); }
    el.textContent = msg; el.classList.add('show');
    clearTimeout(el._timer); el._timer = setTimeout(() => el.classList.remove('show'), 2200);
  }

  function topbar(series){
    return `<header class="topbar"><div class="topbar-inner">
      <button class="logo" data-action="home" aria-label="Torna alle serie">G</button>
      <div class="title-wrap">
        <div class="eyebrow">Gormiti Checklist</div>
        <h1>${series ? escapeHTML(series.name) : 'Le tue serie'}</h1>
        <p class="subtitle">Personaggi e carte, salvati sul dispositivo</p>
      </div>
      <div class="top-actions">
        ${series ? '<button class="pill-btn" data-action="home">Serie</button>' : ''}
        <button class="icon-btn" data-action="help" aria-label="Istruzioni">?</button>
      </div>
    </div></header>`;
  }

  function renderHome(){
    const seriesCards = DATA.series.map(series => {
      const s = seriesStats(series); const pComplete = pct(s.complete, s.total);
      return `<button class="series-card" data-action="open-series" data-series="${series.id}">
        <div class="series-header"><span>${series.tribeCount} popoli • ${series.totalCharacters} personaggi</span><h3>${escapeHTML(series.name)}</h3></div>
        <div class="stats-row">
          <div class="stat"><b>${s.figures}/${s.total}</b><span>Personaggi</span></div>
          <div class="stat"><b>${s.cards}/${s.total}</b><span>Carte</span></div>
          <div class="stat"><b>${s.complete}/${s.total}</b><span>Completi</span></div>
        </div>
        <div class="progress-block">
          <div class="progress-label"><span>Completamento doppio</span><span>${pComplete}%</span></div>
          <div class="bar"><i style="width:${pComplete}%"></i></div>
        </div>
      </button>`;
    }).join('');
    app.innerHTML = `${topbar(null)}<main class="screen">
      <section class="hero"><h2>Elenco serie</h2><p>Scegli una serie per aprire la checklist. La prima versione contiene Final Evolution; la struttura è già pronta per aggiungere altre serie in seguito.</p></section>
      <section class="series-grid">${seriesCards}</section>
      <p class="footer-note">Checklist non ufficiale, pensata per uso personale e collezionistico. Le spunte restano salvate in questo browser.</p>
    </main>${modal()}<div class="toast"></div>`;
  }

  function renderSeries(){
    const series = DATA.series.find(s => s.id === view.seriesId) || DATA.series[0];
    const stats = seriesStats(series);
    const filters = [
      ['all','Tutti'], ['complete','Completi'], ['missingFigure','Manca personaggio'], ['missingCard','Manca carta']
    ].map(([id,label]) => `<button class="chip" data-action="filter" data-filter="${id}" aria-pressed="${view.filter===id}">${label}</button>`).join('');
    const sections = series.tribes.map(tribe => {
      const visibleChars = tribe.characters.filter(c => matchFilters(c));
      const tFigures = tribe.characters.filter(c => itemState(c.id).figure).length;
      const tCards = tribe.characters.filter(c => itemState(c.id).card).length;
      const cards = visibleChars.map(c => renderCard(c)).join('');
      return `<section class="tribe-section" id="${tribe.id}">
        <div class="tribe-head" style="background:${tribe.color}"><div><h2>${escapeHTML(tribe.name)}</h2><p>${tribe.characters.length} personaggi • pagina ${tribe.page} del PDF</p></div><div class="tribe-progress">${tFigures}/${tribe.characters.length} P · ${tCards}/${tribe.characters.length} C</div></div>
        <div class="cards-grid">${cards || '<div class="empty-state">Nessun Gormito corrisponde al filtro selezionato.</div>'}</div>
      </section>`;
    }).join('');

    app.innerHTML = `${topbar(series)}<main class="screen">
      <section class="summary-card">
        <div class="summary-grid">
          <div><div class="summary-number">${stats.figures}/${stats.total}</div><div class="summary-label">Personaggi</div><div class="bar"><i style="width:${pct(stats.figures, stats.total)}%"></i></div></div>
          <div><div class="summary-number">${stats.cards}/${stats.total}</div><div class="summary-label">Carte</div><div class="bar"><i style="width:${pct(stats.cards, stats.total)}%"></i></div></div>
          <div><div class="summary-number">${stats.complete}/${stats.total}</div><div class="summary-label">Completi</div><div class="bar"><i style="width:${pct(stats.complete, stats.total)}%"></i></div></div>
        </div>
      </section>
      <section class="toolbar">
        <label class="search-wrap" aria-label="Cerca Gormito"><span>🔎</span><input value="${escapeHTML(view.query)}" data-action="search" placeholder="Cerca per nome..."></label>
        <div class="chips">${filters}</div>
      </section>
      <section class="chips" aria-label="Azioni dati">
        <button class="ghost-btn" data-action="export">Esporta backup</button>
        <button class="ghost-btn" data-action="import">Importa backup</button>
        <button class="ghost-btn" data-action="reset">Reset spunte</button>
      </section>
      ${sections}
      <p class="footer-note">P = personaggio, C = carta. I dati vengono salvati localmente sul tuo telefono/browser.</p>
    </main>${modal()}<div class="toast"></div>`;
  }

  function matchFilters(c){
    const st = itemState(c.id);
    const q = view.query.trim().toLowerCase();
    if(q && !c.name.toLowerCase().includes(q)) return false;
    if(view.filter === 'complete') return st.figure && st.card;
    if(view.filter === 'missingFigure') return !st.figure;
    if(view.filter === 'missingCard') return !st.card;
    return true;
  }

  function renderCard(c){
    const st = itemState(c.id);
    return `<article class="g-card" data-id="${c.id}">
      <img class="g-image" src="${c.image}" alt="${escapeHTML(c.name)}" loading="lazy">
      <div class="g-name">${escapeHTML(c.name)}</div>
      <div class="checks">
        <button class="check-button" data-action="toggle" data-id="${c.id}" data-type="figure" aria-pressed="${!!st.figure}" aria-label="Segna personaggio: ${escapeHTML(c.name)}"><span class="box">${checkIcon()}</span><span>Personaggio</span></button>
        <button class="check-button" data-action="toggle" data-id="${c.id}" data-type="card" aria-pressed="${!!st.card}" aria-label="Segna carta: ${escapeHTML(c.name)}"><span class="box">${checkIcon()}</span><span>Carta</span></button>
      </div>
    </article>`;
  }

  function modal(){
    return `<div class="modal-backdrop" id="helpModal" role="dialog" aria-modal="true" aria-labelledby="helpTitle">
      <div class="modal"><h2 id="helpTitle">Come usarla sul cellulare</h2>
      <p>La checklist funziona nel browser e salva le spunte sul dispositivo. Per installarla come app serve aprirla da un indirizzo web sicuro, poi aggiungerla alla schermata Home.</p>
      <ol>
        <li>Carica la cartella dell'app su un hosting statico oppure aprila sul tuo computer per provarla.</li>
        <li>Dal cellulare apri il link della pagina <strong>index.html</strong>.</li>
        <li>Su iPhone: pulsante Condividi → <strong>Aggiungi a Home</strong>. Su Android/Chrome: menu ⋮ → <strong>Aggiungi a schermata Home</strong> o <strong>Installa app</strong>.</li>
      </ol>
      <p>Usa “Esporta backup” ogni tanto: crea un file con tutte le spunte, utile se cambi telefono o browser.</p>
      <div class="modal-actions"><button class="primary-btn" data-action="close-help">Ho capito</button></div>
      </div></div>`;
  }

  function render(){ view.screen === 'series' ? renderSeries() : renderHome(); }

  app.addEventListener('click', ev => {
    const btn = ev.target.closest('button'); if(!btn) return;
    const action = btn.dataset.action;
    if(action === 'home'){ view = {...view, screen:'home', seriesId:null}; render(); window.scrollTo(0,0); }
    if(action === 'open-series'){ view = {...view, screen:'series', seriesId:btn.dataset.series, filter:'all', query:''}; render(); window.scrollTo(0,0); }
    if(action === 'toggle'){ const st = itemState(btn.dataset.id); setItemState(btn.dataset.id, btn.dataset.type, !st[btn.dataset.type]); }
    if(action === 'filter'){ view.filter = btn.dataset.filter; render(); }
    if(action === 'help'){ document.getElementById('helpModal')?.classList.add('open'); }
    if(action === 'close-help'){ document.getElementById('helpModal')?.classList.remove('open'); }
    if(action === 'export') exportBackup();
    if(action === 'import') importFile.click();
    if(action === 'reset') resetState();
  });
  app.addEventListener('input', ev => {
    if(ev.target.dataset.action === 'search'){
      view.query = ev.target.value;
      // Re-render after a small delay to keep typing responsive.
      clearTimeout(window.__searchTimer); window.__searchTimer = setTimeout(render, 120);
    }
  });
  document.addEventListener('click', ev => {
    if(ev.target.id === 'helpModal') ev.target.classList.remove('open');
  });
  importFile.addEventListener('change', async () => {
    const file = importFile.files?.[0]; if(!file) return;
    try {
      const imported = JSON.parse(await file.text());
      if(!imported || typeof imported !== 'object') throw new Error('Formato non valido');
      state = imported.state || imported;
      saveState(); render(); toast('Backup importato');
    } catch(e) { toast('Backup non valido'); }
    importFile.value = '';
  });

  function exportBackup(){
    const payload = { app:'Gormiti Checklist', version:1, exportedAt:new Date().toISOString(), state };
    const blob = new Blob([JSON.stringify(payload,null,2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='gormiti-checklist-backup.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    toast('Backup esportato');
  }
  function resetState(){
    if(confirm('Vuoi davvero cancellare tutte le spunte salvate?')){ state = {}; saveState(); render(); toast('Spunte cancellate'); }
  }

  render();
})();
