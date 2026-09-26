// Jada Home. No framework, no build step.
// Data lives in a PRIVATE GitHub repo, read and written through the GitHub contents API.
// ?demo=1 reads fake sample data from ./demo/ and keeps writes in memory.

const DEMO = new URLSearchParams(location.search).has('demo');
const REPO = localStorage.getItem('repo') || 'jadalin100/jada-home-data';
const MOODS = { sunny: 'Sunny', calm: 'Calm', busy: 'Busy', low: 'Low', proud: 'Proud' };
const $view = document.getElementById('view');
const shas = {};           // path -> sha, needed to update a file on GitHub
const memFiles = {};       // demo-mode writes
let cache = {};            // path -> text for this page load

const token = () => { try { return localStorage.getItem('ghToken'); } catch { return null; } };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const today = (d = new Date()) => d.toLocaleDateString('en-CA');
const addDays = (iso, n) => { const d = new Date(iso + 'T12:00'); d.setDate(d.getDate() + n); return today(d); };
const daysUntil = iso => Math.round((new Date(iso + 'T12:00') - new Date(today() + 'T12:00')) / 864e5);
const prettyDate = iso => new Date(iso + 'T12:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2600);
}

// ---------- storage ----------
const b64decode = s => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\n/g, '')), c => c.charCodeAt(0)));
function b64encode(text) {
  const bytes = new TextEncoder().encode(text); let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}
async function api(path, opts = {}) {
  const r = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${token()}`, Accept: 'application/vnd.github+json', ...(opts.headers || {}) },
    cache: 'no-store',
  });
  if (r.status === 404) return null;
  if (r.status === 401) { localStorage.removeItem('ghToken'); throw new Error('Token rejected. Paste a new one.'); }
  if (!r.ok) throw new Error(`GitHub said ${r.status} for ${path}`);
  return r.json();
}
async function read(path) {
  if (path in cache) return cache[path];
  let text = null;
  if (DEMO) {
    if (path in memFiles) text = memFiles[path];
    else { const r = await fetch('demo/' + path); text = r.ok ? await r.text() : null; }
  } else {
    const j = await api(path);
    if (j) { shas[path] = j.sha; text = b64decode(j.content); }
  }
  return (cache[path] = text);
}
async function readJSON(path, fallback) { const t = await read(path); return t ? JSON.parse(t) : fallback; }
async function write(path, text, msg) {
  cache[path] = text;
  if (DEMO) { memFiles[path] = text; return; }
  if (!(path in shas)) await api(path).then(j => { if (j) shas[path] = j.sha; });
  const j = await api(path, { method: 'PUT', body: JSON.stringify({ message: msg, content: b64encode(text), sha: shas[path] }) });
  shas[path] = j.content.sha;
}
const writeJSON = (path, obj, msg) => write(path, JSON.stringify(obj, null, 1) + '\n', msg);
async function list(dir) {
  if (DEMO) { const idx = await (await fetch('demo/index.json')).json(); return (idx[dir] || []).sort(); }
  const j = await api(dir);
  return (j || []).map(f => f.name).filter(n => n.endsWith('.md')).sort();
}

// ---------- journal format ----------
// Plain markdown so the 7am agent and future-you can read it without this site.
function serialize(e) {
  const todo = e.todo.filter(t => t.t.trim()).map(t => `- [${t.done ? 'x' : ' '}] ${t.t}`).join('\n');
  return `---\ndate: ${e.date}\nmood: ${e.mood || ''}\ntags: ${e.tags.join(', ')}\n---\n\n## Thoughts\n${e.thoughts.trim()}\n\n## Wins\n${e.wins.trim()}\n\n## Tomorrow\n${todo}\n`;
}
function parse(text, date) {
  const e = { date, mood: '', tags: [], thoughts: '', wins: '', todo: [] };
  if (!text) return e;
  const fm = text.match(/^---\n([\s\S]*?)\n---/);
  if (fm) for (const line of fm[1].split('\n')) {
    const [k, ...v] = line.split(':'); const val = v.join(':').trim();
    if (k === 'mood') e.mood = val;
    if (k === 'tags') e.tags = val ? val.split(',').map(s => s.trim()) : [];
  }
  const sec = name => (text.split(new RegExp(`^## ${name}\\s*$`, 'm'))[1] || '').split(/^## /m)[0].trim();
  e.thoughts = sec('Thoughts'); e.wins = sec('Wins');
  e.todo = sec('Tomorrow').split('\n').map(l => l.match(/^- \[( |x)\] (.*)$/)).filter(Boolean).map(m => ({ t: m[2], done: m[1] === 'x' }));
  return e;
}
async function allEntries() {
  const names = await list('journal');
  const texts = await Promise.all(names.map(n => read('journal/' + n)));
  return names.map((n, i) => ({ ...parse(texts[i], n.slice(0, 10)), raw: texts[i] || '' })).reverse();
}

// ---------- views ----------
function setMood(m) { document.body.dataset.mood = MOODS[m] ? m : 'calm'; }
const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };

async function viewHome() {
  const t = today();
  const [quoteText, projects, deadlines, yText, routineNames, study] = await Promise.all([
    read(`quotes/${t}.md`), readJSON('data/projects.json', []), readJSON('data/deadlines.json', []),
    read(`journal/${addDays(t, -1)}.md`), list('routines'), readJSON('data/study.json', { viola: [] }),
  ]);
  const y = parse(yText, addDays(t, -1));
  setMood(parse(await read(`journal/${t}.md`), t).mood || y.mood);
  const [quote, who] = (quoteText || '').trim().split(/\n+—\s*|\n+-\s+/);
  const soon = deadlines.filter(d => daysUntil(d.date) >= 0).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 10);
  const routines = await Promise.all(routineNames.map(async n => [n, await read('routines/' + n)]));

  $view.innerHTML = `
    <div class="hero">
      <div class="date">${esc(prettyDate(t))}</div>
      <h1>${greeting()},<br>Jada.</h1>
      <p class="quote">${quote ? esc(quote) + (who ? `<cite>— ${esc(who)}</cite>` : '') : '<span class="muted">Your quote lands here with the 7am email.</span>'}</p>
    </div>

    <div class="split">
      <div class="card">
        <h2>Today's to-do</h2>
        ${y.todo.length ? `<ul class="checks">${y.todo.map((it, i) => `
          <li><input type="checkbox" id="td${i}" data-i="${i}" ${it.done ? 'checked' : ''}><label for="td${i}" class="${it.done ? 'done' : ''}">${esc(it.t)}</label></li>`).join('')}</ul>`
          : `<p class="muted">Nothing planned from last night. <a href="#journal">Write tonight's log</a> and list tomorrow's to-dos.</p>`}
      </div>
      <div class="card">
        <h2>Viola</h2>
        <div class="big-num">${streak(study.viola)}</div>
        <p class="muted small">day streak</p>
        <button id="viola" class="ghost" ${study.viola.includes(t) ? 'disabled' : ''}>${study.viola.includes(t) ? 'Practiced today' : 'Log practice'}</button>
      </div>
    </div>

    <section>
      <h2>Coming up</h2>
      <div class="deadlines">${soon.map(d => {
        const n = daysUntil(d.date);
        return `<div class="card dl ${n <= 7 ? 'soon' : ''}">
          <div class="days">${n === 0 ? 'Today' : n}</div><div class="small muted">${n === 0 ? '' : n === 1 ? 'day' : 'days'} · ${esc(d.date)}</div>
          <p>${esc(d.label)}</p>
          ${d.verified ? '' : '<span class="tag warn">unverified</span>'}</div>`;
      }).join('') || '<p class="muted">No deadlines saved.</p>'}</div>
    </section>

    <section>
      <h2>Projects</h2>
      <div class="grid">${projects.map(p => `
        <a class="card" href="#project/${esc(p.id)}">
          <div class="kind">${esc(p.kind)}</div><h3>${esc(p.name)}</h3>
          <p class="small">${esc(p.status)}</p>
          ${p.next ? `<p class="small muted">Next: ${esc(p.next)}</p>` : ''}
        </a>`).join('')}</div>
    </section>

    <section>
      <h2>Routine emails</h2>
      <div class="grid">${routines.map(([n, txt]) => `
        <details class="card"><summary><span class="kind">${esc(n.replace('.md', ''))}</span><br>${esc((txt || '').split('\n').find(l => l.trim()) || '')}</summary>
        <div class="prose small">${esc(txt)}</div></details>`).join('') || '<p class="muted">Briefs show up here after the 7am run.</p>'}</div>
    </section>`;

  $view.querySelectorAll('.checks input').forEach(cb => cb.onchange = async () => {
    y.todo[cb.dataset.i].done = cb.checked;
    cb.nextElementSibling.classList.toggle('done', cb.checked);
    await save(`journal/${y.date}.md`, serialize(y), `Check off to-do (${y.date})`);
  });
  const vb = document.getElementById('viola');
  vb.onclick = async () => { study.viola.push(t); await save('data/study.json', JSON.stringify(study, null, 1) + '\n', `Viola practice ${t}`); route(); };
}

function streak(days) {
  const set = new Set(days); let n = 0, d = today();
  if (!set.has(d)) d = addDays(d, -1);
  while (set.has(d)) { n++; d = addDays(d, -1); }
  return n;
}

async function save(path, text, msg) {
  try { await write(path, text, msg); toast('Saved'); }
  catch (e) { toast(e.message); throw e; }
}

async function viewJournal(date = today()) {
  const [text, projects] = await Promise.all([read(`journal/${date}.md`), readJSON('data/projects.json', [])]);
  const e = parse(text, date);
  if (!e.todo.length) e.todo.push({ t: '', done: false });
  setMood(e.mood);
  $view.innerHTML = `
    <div class="hero"><div class="date">${esc(prettyDate(date))}</div><h1>Dear diary</h1></div>
    <div class="card">
      <label class="field">How was today?</label>
      <div class="moods">${Object.entries(MOODS).map(([k, v]) => `<button type="button" data-mood="${k}" aria-pressed="${e.mood === k}">${v}</button>`).join('')}</div>
      <label class="field" for="thoughts">Thoughts</label>
      <textarea id="thoughts" class="big" placeholder="What happened, what you noticed, what's on your mind.">${esc(e.thoughts)}</textarea>
      <label class="field" for="wins">Wins today</label>
      <textarea id="wins" placeholder="Anything you finished, learned, or are proud of.">${esc(e.wins)}</textarea>
      <label class="field">Tomorrow's to-do <span class="muted">(emailed to you at 7am)</span></label>
      <ul class="checks" id="todo"></ul>
      <button type="button" class="ghost" id="addTodo">Add item</button>
      <label class="field">Which projects came up?</label>
      <div class="chips">${projects.map(p => `<button type="button" data-tag="${esc(p.id)}" aria-pressed="${e.tags.includes(p.id)}">${esc(p.name)}</button>`).join('')}</div>
      <p style="margin-top:1.6rem"><button id="saveEntry">Save entry</button></p>
    </div>`;

  const todoEl = document.getElementById('todo');
  const drawTodo = () => {
    todoEl.innerHTML = e.todo.map((it, i) => `<li><input type="text" data-i="${i}" value="${esc(it.t)}" aria-label="To-do ${i + 1}"></li>`).join('');
    todoEl.querySelectorAll('input').forEach(inp => {
      inp.oninput = () => e.todo[inp.dataset.i].t = inp.value;
      inp.onkeydown = ev => { if (ev.key === 'Enter') { ev.preventDefault(); e.todo.push({ t: '', done: false }); drawTodo(); todoEl.lastElementChild.querySelector('input').focus(); } };
    });
  };
  drawTodo();
  document.getElementById('addTodo').onclick = () => { e.todo.push({ t: '', done: false }); drawTodo(); };
  $view.querySelectorAll('[data-mood]').forEach(b => b.onclick = () => {
    e.mood = e.mood === b.dataset.mood ? '' : b.dataset.mood; setMood(e.mood);
    $view.querySelectorAll('[data-mood]').forEach(x => x.setAttribute('aria-pressed', x.dataset.mood === e.mood));
  });
  $view.querySelectorAll('[data-tag]').forEach(b => b.onclick = () => {
    const on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', on);
    e.tags = on ? [...e.tags, b.dataset.tag] : e.tags.filter(x => x !== b.dataset.tag);
  });
  document.getElementById('saveEntry').onclick = async () => {
    e.thoughts = document.getElementById('thoughts').value;
    e.wins = document.getElementById('wins').value;
    await save(`journal/${date}.md`, serialize(e), `Journal ${date}`);
  };
}

async function viewArchive(q = '') {
  const [entries, weeks] = await Promise.all([allEntries(), list('weekly')]);
  $view.innerHTML = `
    <div class="hero"><h1>Archive</h1><p class="muted">${entries.length} entries. Search words, projects, or moods to pull out threads.</p></div>
    <div class="split">
      <div class="card">
        <input type="search" id="q" placeholder="Search every entry" value="${esc(q)}" aria-label="Search entries">
        <div id="results"></div>
      </div>
      <div class="card"><h2>Weekly summaries</h2>
        ${weeks.slice().reverse().map(w => `<a class="entry" href="#week/${esc(w)}"><span class="d">${esc(w.replace('.md', ''))}</span></a>`).join('') || '<p class="muted">The first one arrives Sunday at 7am.</p>'}
      </div>
    </div>`;
  const qEl = document.getElementById('q'), out = document.getElementById('results');
  const draw = () => {
    const words = qEl.value.toLowerCase().split(/\s+/).filter(Boolean);
    const hits = entries.filter(e => words.every(w => e.raw.toLowerCase().includes(w)));
    out.innerHTML = hits.map(e => {
      const body = (e.thoughts || e.wins).replace(/\s+/g, ' ');
      let snip = esc(body.slice(0, 180));
      if (words[0]) {
        const i = body.toLowerCase().indexOf(words[0]);
        if (i > 60) snip = '…' + esc(body.slice(i - 60, i + 120));
        for (const w of words) snip = snip.replace(new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), m => `<mark>${m}</mark>`);
      }
      return `<a class="entry" href="#entry/${e.date}"><span class="d">${esc(prettyDate(e.date))}</span> ${e.mood ? `<span class="tag">${esc(e.mood)}</span>` : ''}
        ${e.tags.map(t => `<span class="tag">${esc(t)}</span>`).join(' ')}<div class="small muted">${snip}</div></a>`;
    }).join('') || '<p class="muted">No entries match.</p>';
  };
  qEl.oninput = draw; draw();
}

async function viewEntry(date) {
  const e = parse(await read(`journal/${date}.md`), date);
  setMood(e.mood);
  $view.innerHTML = `
    <div class="hero"><div class="date">${esc(prettyDate(date))}</div><h1>${esc(MOODS[e.mood] || 'Entry')}</h1></div>
    <div class="card">
      <h3>Thoughts</h3><p class="prose">${esc(e.thoughts) || '<span class="muted">—</span>'}</p>
      <h3>Wins</h3><p class="prose">${esc(e.wins) || '<span class="muted">—</span>'}</p>
      <h3>Tomorrow</h3><ul class="checks">${e.todo.map(t => `<li><span class="${t.done ? 'done' : ''}">${esc(t.t)}</span></li>`).join('')}</ul>
      <p><a class="btn" href="#journal/${date}">Edit</a></p>
    </div>`;
}

async function viewWeek(name) {
  $view.innerHTML = `<div class="hero"><h1>Week ${esc(name.replace('.md', ''))}</h1></div><div class="card prose">${esc(await read('weekly/' + name))}</div>`;
}

async function viewProject(id) {
  const [projects, deadlines, entries] = await Promise.all([readJSON('data/projects.json', []), readJSON('data/deadlines.json', []), allEntries()]);
  const p = projects.find(x => x.id === id);
  if (!p) { $view.innerHTML = '<p>That project is not in projects.json.</p>'; return; }
  const mine = deadlines.filter(d => d.project === id).sort((a, b) => a.date.localeCompare(b.date));
  const mentions = entries.filter(e => e.tags.includes(id));
  $view.innerHTML = `
    <div class="hero"><div class="date">${esc(p.kind)}</div><h1>${esc(p.name)}</h1><p class="quote">${esc(p.blurb)}</p></div>
    <div class="split">
      <div class="card">
        <label class="field" for="status">Where it stands</label><textarea id="status">${esc(p.status)}</textarea>
        <label class="field" for="next">Next step</label><textarea id="next">${esc(p.next)}</textarea>
        <p><button id="saveP">Save project</button></p>
        ${p.folder ? `<p class="small muted">Files: New project 2/${esc(p.folder)}</p>` : ''}
        ${p.links.map(l => `<p class="small"><a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a></p>`).join('')}
      </div>
      <div class="card">
        <h2>Deadlines</h2>
        ${mine.map(d => `<p><strong>${esc(d.date)}</strong> · ${esc(d.label)} ${d.verified ? '' : '<span class="tag warn">unverified</span>'}<br>
          <span class="small muted">${esc(d.note)} ${d.source ? `<a href="${esc(d.source)}" target="_blank" rel="noopener">source</a>` : ''}</span></p>`).join('') || '<p class="muted">None yet.</p>'}
        <details><summary class="small">Add a deadline</summary>
          <input type="date" id="dDate" aria-label="Date"><input type="text" id="dLabel" placeholder="What's due" style="margin-top:.5rem">
          <input type="text" id="dSrc" placeholder="Official page URL (leave blank if unverified)" style="margin-top:.5rem">
          <p><button id="addD" class="ghost">Add deadline</button></p></details>
      </div>
    </div>
    <section><h2>In your journal</h2>
      ${mentions.map(e => `<a class="entry" href="#entry/${e.date}"><span class="d">${esc(prettyDate(e.date))}</span><div class="small muted">${esc((e.thoughts || e.wins).slice(0, 200))}</div></a>`).join('') || '<p class="muted">Tag this project in a journal entry and it shows up here.</p>'}
    </section>`;
  document.getElementById('saveP').onclick = async () => {
    p.status = document.getElementById('status').value; p.next = document.getElementById('next').value;
    await save('data/projects.json', JSON.stringify(projects, null, 1) + '\n', `Update ${p.name}`);
  };
  document.getElementById('addD').onclick = async () => {
    const date = document.getElementById('dDate').value, label = document.getElementById('dLabel').value.trim(), source = document.getElementById('dSrc').value.trim();
    if (!date || !label) return toast('Add a date and what is due.');
    deadlines.push({ date, label, project: id, verified: source ? today() : false, source, note: '' });
    await save('data/deadlines.json', JSON.stringify(deadlines, null, 1) + '\n', `Add deadline: ${label}`);
    route();
  };
}

async function viewStudy() {
  const study = await readJSON('data/study.json', { usabo: [], scioly: {}, viola: [] });
  const t = today();
  const last21 = Array.from({ length: 21 }, (_, i) => addDays(t, i - 20));
  const block = (key, title, items) => `
    <div class="card"><h3>${esc(title)}</h3>
      <p class="small muted">${items.filter(i => i.done).length} of ${items.length} done</p>
      <ul class="checks">${items.map((it, i) => `<li><input type="checkbox" id="${key}-${i}" data-key="${esc(key)}" data-i="${i}" ${it.done ? 'checked' : ''}><label for="${key}-${i}" class="${it.done ? 'done' : ''}">${esc(it.t)}</label></li>`).join('')}</ul>
      <div class="row"><input type="text" placeholder="Add a topic" data-add="${esc(key)}" aria-label="Add topic to ${esc(title)}"></div>
    </div>`;
  $view.innerHTML = `
    <div class="hero"><h1>Study</h1></div>
    <div class="card"><h2>Viola</h2>
      <div class="row"><span class="big-num">${streak(study.viola)}</span><span class="muted">day streak</span>
      <button id="viola" ${study.viola.includes(t) ? 'disabled' : ''}>${study.viola.includes(t) ? 'Practiced today' : 'Log practice'}</button></div>
      <div class="dots" aria-label="Last 21 days">${last21.map(d => `<span class="${study.viola.includes(d) ? 'on' : ''}" title="${d}"></span>`).join('')}</div>
    </div>
    <section><h2>USABO</h2><div class="grid">${block('usabo', 'Open Exam, Feb 3 2027', study.usabo)}</div></section>
    <section><h2>Science Olympiad</h2><div class="grid">${Object.entries(study.scioly).map(([ev, items]) => block('scioly:' + ev, ev, items)).join('')}</div></section>`;

  const listFor = key => key === 'usabo' ? study.usabo : study.scioly[key.slice(7)];
  const persist = msg => save('data/study.json', JSON.stringify(study, null, 1) + '\n', msg);
  $view.querySelectorAll('.checks input').forEach(cb => cb.onchange = async () => {
    listFor(cb.dataset.key)[cb.dataset.i].done = cb.checked; await persist('Study checklist'); route();
  });
  $view.querySelectorAll('[data-add]').forEach(inp => inp.onkeydown = async ev => {
    if (ev.key !== 'Enter' || !inp.value.trim()) return;
    listFor(inp.dataset.add).push({ t: inp.value.trim(), done: false }); await persist('Add study topic'); route();
  });
  document.getElementById('viola').onclick = async () => { study.viola.push(t); await persist(`Viola practice ${t}`); route(); };
}

function viewUnlock() {
  $view.innerHTML = `
    <div class="hero"><h1>Hello,<br>Jada.</h1></div>
    <div class="card" style="max-width:34rem">
      <p>Paste your GitHub token to open your journal. It stays in this browser only.</p>
      <p class="small muted">Make it at GitHub → Settings → Developer settings → Fine-grained tokens. Repository access: only <strong>${esc(REPO)}</strong>. Permission: Contents, read and write.</p>
      <label class="field" for="tok">Token</label><input type="password" id="tok" autocomplete="off">
      <p><button id="go">Open journal</button></p>
    </div>`;
  document.getElementById('go').onclick = () => { localStorage.setItem('ghToken', document.getElementById('tok').value.trim()); route(); };
}

// ---------- router ----------
async function route() {
  cache = {};
  const [page, arg] = decodeURIComponent(location.hash.slice(1) || 'home').split('/');
  document.querySelectorAll('nav a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + page));
  if (!DEMO && !token()) return viewUnlock();
  try {
    await ({ home: viewHome, journal: viewJournal, archive: viewArchive, entry: viewEntry, week: viewWeek, project: viewProject, study: viewStudy }[page] || viewHome)(arg);
    window.scrollTo(0, 0);
  } catch (e) {
    $view.innerHTML = `<div class="hero"><h1>Can't load</h1><p>${esc(e.message)}</p><p><button class="ghost" onclick="route()">Try again</button></p></div>`;
  }
}
addEventListener('hashchange', route);
route();
