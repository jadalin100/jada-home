// Jada Home. No framework, no build step.
// Data lives in a PRIVATE GitHub repo, read and written through the GitHub contents API.
// ?demo=1 reads fake sample data from ./demo/ and keeps writes in memory.

const DEMO = new URLSearchParams(location.search).has('demo');
const REPO = localStorage.getItem('repo') || 'jadalin100/jada-home-data';
const MOODS = { sunny: 'Happy', excited: 'Excited', proud: 'Proud', grateful: 'Grateful', calm: 'Calm', focused: 'Focused',
  busy: 'Busy', tired: 'Tired', stressed: 'Stressed', anxious: 'Anxious', low: 'Low', sad: 'Sad' };
const moodName = m => MOODS[m] || m;
const $view = document.getElementById('view');
const shas = {};           // path -> sha, needed to update a file on GitHub
const memFiles = {};       // demo-mode writes
let cache = {};            // path -> text for this page load

const token = () => { try { return sessionStorage.getItem('ghToken') || localStorage.getItem('ghToken'); } catch { return null; } };
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
  if (r.status === 401) { lock(); throw new Error('Token rejected. Set up a new one under "Change password or token".'); }
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
async function remove(path, msg) {
  delete cache[path];
  if (DEMO) { delete memFiles[path]; return; }
  if (!(path in shas)) await api(path).then(j => { if (j) shas[path] = j.sha; });
  await api(path, { method: 'DELETE', body: JSON.stringify({ message: msg, sha: shas[path] }) });
  delete shas[path];
}
const writeJSON = (path, obj, msg) => write(path, JSON.stringify(obj, null, 1) + '\n', msg);
async function list(dir, ext = '.md') {
  if (DEMO) { const idx = await (await fetch('demo/index.json')).json(); return (idx[dir] || []).sort(); }
  const j = await api(dir);
  return (j || []).map(f => f.name).filter(n => n.endsWith(ext)).sort();
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
  const [inbox, projects] = await Promise.all([readJSON('data/inbox.json', []), readJSON('data/projects.json', [])]);
  const [quoteText, todos, deadlines, yText, routineNames, study] = await Promise.all([
    read(`quotes/${t}.md`), readJSON('data/todos.json', []), readJSON('data/deadlines.json', []),
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
        <h2>To-do</h2>
        ${y.todo.length ? `<p class="kind">From last night's log</p><ul class="checks">${y.todo.map((it, i) => `
          <li><input type="checkbox" id="td${i}" data-i="${i}" ${it.done ? 'checked' : ''}><label for="td${i}" class="${it.done ? 'done' : ''}">${esc(it.t)}</label></li>`).join('')}</ul>` : ''}
        <p class="kind" style="margin-top:1rem">Anytime</p>
        <ul class="checks" id="anytime">${todos.map((it, i) => `
          <li><input type="checkbox" id="at${i}" data-a="${i}" ${it.done ? 'checked' : ''}><label for="at${i}" class="${it.done ? 'done' : ''}">${esc(it.t)}</label>
          <button class="x" data-del="${i}" aria-label="Delete ${esc(it.t)}">×</button></li>`).join('')}</ul>
        <div class="row"><input type="text" id="newTodo" placeholder="Add a to-do and press Enter" aria-label="New to-do"></div>
        ${todos.some(x => x.done) ? '<p><button class="ghost" id="clearDone">Clear checked</button></p>' : ''}
      </div>
      <div class="card">
        <h2>Viola</h2>
        <div class="big-num">${streak(study.viola)}</div>
        <p class="muted small">day streak</p>
        <button id="viola" class="ghost" ${study.viola.includes(t) ? 'disabled' : ''}>${study.viola.includes(t) ? 'Practiced today' : 'Log practice'}</button>
      </div>
    </div>

    ${inbox.length ? `<section><h2>Found by competition scout</h2><div class="grid">${inbox.map((c, i) => `
      <div class="card">
        <div class="kind">${esc(c.tier || '')} · ${esc(c.field || '')}</div>
        <h3><a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.name)} ↗</a></h3>
        <p class="small">${esc(c.deadline_text || '')}</p>
        <p class="small muted">${esc(c.submit || '')}${c.cost ? ' · ' + esc(c.cost) : ''}</p>
        ${c.fit ? `<p class="small">Could fit: ${esc(c.fit)}</p>` : ''}
        <label class="field" for="ibd${i}">Deadline</label><input type="date" id="ibd${i}" value="${esc(c.deadline || '')}">
        <label class="field" for="ibp${i}">Project</label><select id="ibp${i}"><option value="">No project</option>${projects.map(p => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('')}</select>
        <p class="row"><button data-approve="${i}">Add to deadlines</button><button class="ghost" data-dismiss="${i}">Dismiss</button></p>
      </div>`).join('')}</div></section>` : ''}

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
      <h2>Routine emails</h2>
      <div class="grid">${routines.map(([n, txt]) => `
        <details class="card"><summary><span class="kind">${esc(n.replace('.md', ''))}</span><br>${esc((txt || '').split('\n').find(l => l.trim()) || '')}</summary>
        <div class="prose small">${esc(txt)}</div></details>`).join('') || '<p class="muted">Briefs show up here after the 7am run.</p>'}</div>
    </section>`;

  $view.querySelectorAll('.checks input[data-i]').forEach(cb => cb.onchange = async () => {
    y.todo[cb.dataset.i].done = cb.checked;
    cb.nextElementSibling.classList.toggle('done', cb.checked);
    await save(`journal/${y.date}.md`, serialize(y), `Check off to-do (${y.date})`);
  });
  const saveInbox = msg => save('data/inbox.json', JSON.stringify(inbox, null, 1) + '\n', msg);
  $view.querySelectorAll('[data-approve]').forEach(b => b.onclick = async () => {
    const i = +b.dataset.approve, c = inbox[i], date = document.getElementById('ibd' + i).value;
    if (!date) return toast('Pick the deadline date first.');
    deadlines.push({ date, label: c.name, project: document.getElementById('ibp' + i).value, source: c.url,
      verified: c.found || today(), note: [c.deadline_text, c.submit, c.cost].filter(Boolean).join(' · ') });
    await save('data/deadlines.json', JSON.stringify(deadlines, null, 1) + '\n', `Add ${c.name} from competition scout`);
    inbox.splice(i, 1); await saveInbox(`Approve ${c.name}`); route();
  });
  $view.querySelectorAll('[data-dismiss]').forEach(b => b.onclick = async () => {
    const c = inbox.splice(+b.dataset.dismiss, 1)[0]; await saveInbox(`Dismiss ${c.name}`); route();
  });
  const saveTodos = async msg => { await save('data/todos.json', JSON.stringify(todos, null, 1) + '\n', msg); route(); };
  $view.querySelectorAll('[data-a]').forEach(cb => cb.onchange = () => { todos[cb.dataset.a].done = cb.checked; saveTodos('Check off to-do'); });
  $view.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { todos.splice(b.dataset.del, 1); saveTodos('Delete to-do'); });
  const nt = document.getElementById('newTodo');
  nt.onkeydown = ev => { if (ev.key === 'Enter' && nt.value.trim()) { todos.push({ t: nt.value.trim(), done: false, added: t }); saveTodos('Add to-do'); } };
  const cd = document.getElementById('clearDone');
  if (cd) cd.onclick = () => { todos.splice(0, todos.length, ...todos.filter(x => !x.done)); saveTodos('Clear checked to-dos'); };
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

// Notebook page: spiral rings, washi tape, binder clip, colored tabs, on a doodle backdrop.
const CLIP = `<svg class="clip" viewBox="0 0 60 64" aria-hidden="true"><path d="M8 26h44l-6 34H14z" fill="var(--ink)"/>
  <path d="M18 28 L14 4 Q14 0 18 0 L22 0 Q26 0 26 4 L24 28 M42 28 L36 4 Q36 0 40 0 L44 0 Q48 0 46 4 L40 28" fill="none" stroke="#b8b3c4" stroke-width="3"/></svg>`;
const notebook = (inner, extra = '') => `
  <div class="doodle ${extra}"><article class="notebook">
    <span class="tape"></span>${CLIP}<div class="tabs" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
    ${inner}
  </article></div>`;

async function viewJournal(date = today()) {
  const [text, projects] = await Promise.all([read(`journal/${date}.md`), readJSON('data/projects.json', [])]);
  const e = parse(text, date);
  if (!e.todo.length) e.todo.push({ t: '', done: false });
  setMood(e.mood);
  $view.innerHTML = notebook(`
      <div class="date">${esc(prettyDate(date))}</div><h1 class="nb-title">Dear diary</h1>
      <label class="field">How was today?</label>
      <div class="moods">${Object.entries(MOODS).map(([k, v]) => `<button type="button" data-mood="${k}" aria-pressed="${e.mood === k}">${v}</button>`).join('')}</div>
      <input type="text" id="moodOwn" placeholder="Or in your own words…" value="${MOODS[e.mood] ? '' : esc(e.mood)}" aria-label="Your own mood" style="margin-top:.6rem;max-width:22rem">
      <label class="field" for="thoughts">Thoughts</label>
      <textarea id="thoughts" class="big" placeholder="What happened, what you noticed, what's on your mind.">${esc(e.thoughts)}</textarea>
      <label class="field" for="wins">Wins today</label>
      <textarea id="wins" placeholder="Anything you finished, learned, or are proud of.">${esc(e.wins)}</textarea>
      <label class="field">Tomorrow's to-do <span class="muted">(emailed to you at 7am)</span></label>
      <ul class="checks" id="todo"></ul>
      <button type="button" class="ghost" id="addTodo">Add item</button>
      <label class="field">Which projects came up?</label>
      <div class="chips">${projects.map(p => `<button type="button" data-tag="${esc(p.id)}" aria-pressed="${e.tags.includes(p.id)}">${esc(p.name)}</button>`).join('')}</div>
      <p style="margin-top:1.6rem"><button id="saveEntry">Save entry</button></p>`);

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
  $view.querySelectorAll('.moods [data-mood]').forEach(b => b.onclick = () => {
    e.mood = e.mood === b.dataset.mood ? '' : b.dataset.mood; setMood(e.mood);
    $view.querySelectorAll('.moods [data-mood]').forEach(x => x.setAttribute('aria-pressed', x.dataset.mood === e.mood));
    document.getElementById('moodOwn').value = '';
  });
  document.getElementById('moodOwn').oninput = ev => {
    e.mood = ev.target.value.replace(/[\n:,]+/g, ' ').replace(/\s+/g, ' ').trim(); setMood(e.mood);
    $view.querySelectorAll('.moods [data-mood]').forEach(x => x.setAttribute('aria-pressed', false));
  };
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
    <div class="hero"><h1>Entries</h1><p class="muted">${entries.length} entries. Search words, projects, or moods to pull out threads.</p>
      <input type="search" id="q" placeholder="Search every entry" value="${esc(q)}" aria-label="Search entries" style="max-width:32rem"></div>
    <div id="results" class="pages"></div>
    <section><h2>Weekly summaries</h2><div class="pages">
      ${weeks.slice().reverse().map(w => `<a class="page" href="#week/${esc(w)}"><span class="tape"></span><span class="d">Week ${esc(w.replace('.md', '').split('-W')[1] || w)}</span><div class="small muted">${esc(w.replace('.md', ''))}</div></a>`).join('') || '<p class="muted">The first one arrives Sunday at 7am.</p>'}
    </div></section>`;
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
      return `<a class="page mood-${MOODS[e.mood] ? e.mood : 'calm'}" href="#entry/${e.date}"><span class="tape"></span>
        <span class="d">${esc(prettyDate(e.date))}</span>
        <div>${e.mood ? `<span class="tag">${esc(moodName(e.mood))}</span> ` : ''}${e.tags.map(t => `<span class="tag">${esc(t)}</span>`).join(' ')}</div>
        <p class="small">${snip}</p></a>`;
    }).join('') || '<p class="muted">No entries match.</p>';
  };
  qEl.oninput = draw; draw();
}

async function viewEntry(date) {
  const e = parse(await read(`journal/${date}.md`), date);
  setMood(e.mood);
  $view.innerHTML = notebook(`
      <div class="date">${esc(prettyDate(date))}</div><h1 class="nb-title">${esc(moodName(e.mood) || 'Entry')}</h1>
      <h3>Thoughts</h3><p class="prose ruled">${esc(e.thoughts) || '<span class="muted">—</span>'}</p>
      <h3>Wins</h3><p class="prose ruled">${esc(e.wins) || '<span class="muted">—</span>'}</p>
      <h3>Tomorrow</h3><ul class="checks">${e.todo.map(t => `<li><span class="${t.done ? 'done' : ''}">${esc(t.t)}</span></li>`).join('')}</ul>
      <p class="row"><a class="btn" href="#journal/${date}">Edit</a><a href="#entries" class="small">All entries</a></p>`);
}

async function viewWeek(name) {
  $view.innerHTML = `<div class="hero"><h1>Week ${esc(name.replace('.md', ''))}</h1></div><div class="card prose">${esc(await read('weekly/' + name))}</div>`;
}

const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'project';
const saveJSON = (path, obj, msg) => save(path, JSON.stringify(obj, null, 1) + '\n', msg);

async function viewProjects() {
  const [projects, deadlines] = await Promise.all([readJSON('data/projects.json', []), readJSON('data/deadlines.json', [])]);
  deadlines.sort((a, b) => a.date.localeCompare(b.date));
  const opts = sel => `<option value="">No project</option>` + projects.map(p => `<option value="${esc(p.id)}" ${p.id === sel ? 'selected' : ''}>${esc(p.name)}</option>`).join('');
  $view.innerHTML = `
    <div class="hero"><h1>Projects</h1></div>
    <div class="grid">${projects.map(p => `
      <a class="card" href="#project/${esc(p.id)}">
        <div class="kind">${esc(p.kind)}</div><h3>${esc(p.name)}</h3>
        <p class="small">${esc(p.status)}</p>
        ${p.next ? `<p class="small muted">Next: ${esc(p.next)}</p>` : ''}
      </a>`).join('')}
      <div class="card add"><h3>New project</h3>
        <input type="text" id="newP" placeholder="Project name" aria-label="New project name">
        <p><button id="addP">Add project</button></p></div>
    </div>

    <section><h2>Deadlines</h2>
      <div class="card">
        <div class="dl-row head small muted" aria-hidden="true"><span>Date</span><span>What's due</span><span>Project</span><span>Official page</span><span></span></div>
        <div id="dlRows">${deadlines.map((d, i) => `
          <div class="dl-row" data-i="${i}">
            <input type="date" value="${esc(d.date)}" data-f="date" aria-label="Date">
            <input type="text" value="${esc(d.label)}" data-f="label" aria-label="What's due">
            <select data-f="project" aria-label="Project">${opts(d.project)}</select>
            <input type="text" value="${esc(d.source)}" data-f="source" placeholder="URL, blank if unverified" aria-label="Official page">
            <button class="x" data-del="${i}" aria-label="Delete ${esc(d.label)}">×</button>
            ${d.note ? `<div class="small muted note">${esc(d.note)}</div>` : ''}
          </div>`).join('')}</div>
        <p class="row"><button class="ghost" id="addDl">Add deadline</button><button id="saveDl">Save deadlines</button></p>
        <p class="small muted">A deadline with an official page link counts as checked; one without shows "unverified".</p>
      </div>
    </section>`;

  document.getElementById('addP').onclick = async () => {
    const name = document.getElementById('newP').value.trim();
    if (!name) return toast('Give the project a name.');
    let id = slug(name); while (projects.some(p => p.id === id)) id += '-2';
    projects.push({ id, name, kind: 'Project', blurb: '', status: '', next: '', folder: '', links: [] });
    await saveJSON('data/projects.json', projects, `Add project ${name}`);
    location.hash = 'project/' + id;
  };
  const collect = () => [...document.querySelectorAll('#dlRows .dl-row')].map(row => {
    const old = deadlines[row.dataset.i] || {};
    const v = f => row.querySelector(`[data-f=${f}]`).value.trim();
    const source = v('source');
    return { date: v('date'), label: v('label'), project: v('project'), source, note: old.note || '',
      verified: !source ? false : (old.source === source && old.verified) ? old.verified : today() };
  }).filter(d => d.date && d.label);
  document.getElementById('saveDl').onclick = async () => { await saveJSON('data/deadlines.json', collect(), 'Edit deadlines'); route(); };
  document.getElementById('addDl').onclick = () => {
    const i = deadlines.length; deadlines.push({});
    document.getElementById('dlRows').insertAdjacentHTML('beforeend', `
      <div class="dl-row" data-i="${i}"><input type="date" data-f="date" aria-label="Date"><input type="text" data-f="label" placeholder="What's due" aria-label="What's due">
      <select data-f="project" aria-label="Project">${opts('')}</select><input type="text" data-f="source" placeholder="URL, blank if unverified" aria-label="Official page">
      <button class="x" onclick="this.parentElement.remove()" aria-label="Remove row">×</button></div>`);
    document.querySelector(`.dl-row[data-i="${i}"] input`).focus();
  };
  $view.querySelectorAll('#dlRows [data-del]').forEach(b => b.onclick = () => b.parentElement.remove());
}

async function viewProject(id) {
  const [projects, deadlines, entries] = await Promise.all([readJSON('data/projects.json', []), readJSON('data/deadlines.json', []), allEntries()]);
  const p = projects.find(x => x.id === id);
  if (!p) { $view.innerHTML = '<div class="hero"><h1>Not found</h1><p><a href="#projects">Back to projects</a></p></div>'; return; }
  const mine = deadlines.filter(d => d.project === id).sort((a, b) => a.date.localeCompare(b.date));
  const mentions = entries.filter(e => e.tags.includes(id));
  const field = (f, label, big) => `<label class="field" for="p-${f}">${label}</label>${big
    ? `<textarea id="p-${f}">${esc(p[f])}</textarea>` : `<input type="text" id="p-${f}" value="${esc(p[f])}">`}`;
  $view.innerHTML = `
    <div class="hero"><div class="date"><a href="#projects">Projects</a> · ${esc(p.kind)}</div><h1>${esc(p.name)}</h1>${p.blurb ? `<p class="quote">${esc(p.blurb)}</p>` : ''}</div>
    <div class="split">
      <div class="card">
        ${field('name', 'Name')}${field('kind', 'Type (Research, DECA, Study…)')}${field('blurb', 'One-line description', true)}
        ${field('status', 'Where it stands', true)}${field('next', 'Next step', true)}${field('folder', 'Folder on your laptop')}
        <label class="field" for="p-links">Links, one per line: label | url</label>
        <textarea id="p-links">${esc(p.links.map(l => `${l.label} | ${l.url}`).join('\n'))}</textarea>
        <p class="row"><button id="saveP">Save project</button><button class="ghost" id="delP">Delete project</button></p>
      </div>
      <div class="card">
        <h2>Deadlines</h2>
        ${mine.map(d => `<p><strong>${esc(d.date)}</strong> · ${esc(d.label)} ${d.verified ? '' : '<span class="tag warn">unverified</span>'}<br>
          <span class="small muted">${esc(d.note)} ${d.source ? `<a href="${esc(d.source)}" target="_blank" rel="noopener">source</a>` : ''}</span></p>`).join('') || '<p class="muted">None yet.</p>'}
        <p class="small"><a href="#projects">Add or edit deadlines</a></p>
        ${p.links.map(l => `<p class="small"><a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a></p>`).join('')}
      </div>
    </div>
    <section><h2>In your journal</h2><div class="pages">
      ${mentions.map(e => `<a class="page" href="#entry/${e.date}"><span class="tape"></span><span class="d">${esc(prettyDate(e.date))}</span><p class="small">${esc((e.thoughts || e.wins).slice(0, 200))}</p></a>`).join('') || '<p class="muted">Tag this project in a journal entry and it shows up here.</p>'}
    </div></section>`;
  document.getElementById('saveP').onclick = async () => {
    for (const f of ['name', 'kind', 'blurb', 'status', 'next', 'folder']) p[f] = document.getElementById('p-' + f).value.trim();
    p.links = document.getElementById('p-links').value.split('\n').map(l => l.split('|').map(s => s.trim())).filter(([a, b]) => a && b).map(([label, url]) => ({ label, url }));
    await saveJSON('data/projects.json', projects, `Update ${p.name}`); route();
  };
  document.getElementById('delP').onclick = async () => {
    if (!confirm(`Delete ${p.name}? Its journal entries and deadlines stay.`)) return;
    projects.splice(projects.indexOf(p), 1);
    await saveJSON('data/projects.json', projects, `Delete project ${p.name}`);
    location.hash = 'projects';
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
    <section><h2>Science Olympiad</h2><div class="grid">${Object.entries(study.scioly).map(([ev, items]) => block('scioly:' + ev, ev, items)).join('')}</div></section>
    <section><h2>Helpful sites</h2><div class="grid">${Object.entries(study.resources || {}).map(([k, links]) => `
      <div class="card"><h3>${esc(k)}</h3>${links.map(l => `<p class="small"><a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a></p>`).join('')}</div>`).join('')}</div></section>`;

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

// ---------- DECA Stock Market Game (copied from ~/deca-smg each morning by the 7am agent) ----------
async function viewSMG() {
  const [holdings, names] = await Promise.all([read('smg/holdings.txt'), list('smg/briefs', '.txt')]);
  const rows = (holdings || '').split('\n').filter(l => l.trim() && !l.startsWith('#')).map(l => {
    const [main, note = ''] = l.split(/#(.*)/s);
    const [ticker, shares, cost, cls] = main.split('|').map(s => s.trim());
    return { ticker, shares, cost, cls, note: note.trim() };
  });
  const updated = ((holdings || '').match(/Last updated:\s*(\S+)/) || [])[1];
  const latest = names.at(-1);
  const briefs = await Promise.all(names.slice(-14).reverse().map(async n => [n, await read('smg/briefs/' + n)]));
  $view.innerHTML = `
    <div class="hero"><div class="date">DECA Stock Market Game</div><h1>SMG</h1>
      <p class="muted">${updated ? `Holdings last updated ${esc(updated)}.` : 'Holdings arrive with the 7am run.'}</p></div>
    <div class="card"><h2>Holdings</h2>
      ${rows.map(r => `<div class="holding"><span class="d">${esc(r.ticker)}</span>
        <span>${esc(r.cls === 'CASH' ? '$' + Number(r.shares).toLocaleString() : r.shares + ' sh' + (r.cost && r.cost !== '-' ? ' @ $' + r.cost : ''))}
        ${Number(r.shares) < 0 ? '<span class="tag">short</span>' : ''}</span>
        <span class="small muted">${esc(r.note)}</span></div>`).join('') || '<p class="muted">No holdings yet.</p>'}
    </div>
    <section><h2>Briefs</h2>
      ${briefs.map(([n, t], i) => `<details class="card" ${i === 0 ? 'open' : ''} style="margin-bottom:1rem">
        <summary><span class="d">${esc(prettyDate(n.slice(0, 10)))}</span>${n === latest ? ' <span class="tag">latest</span>' : ''}</summary>
        <div class="prose small">${esc(t)}</div></details>`).join('') || '<p class="muted">Briefs arrive with the 7am run.</p>'}
    </section>`;
}

// ---------- email drafts (written by prof-scout into drafts/*.json) ----------
async function viewEmails() {
  const names = await list('drafts', '.json');
  const drafts = (await Promise.all(names.map(async n => ({ path: 'drafts/' + n, ...JSON.parse(await read('drafts/' + n)) }))))
    .sort((a, b) => b.date.localeCompare(a.date));
  const open = drafts.filter(d => d.status !== 'sent'), sent = drafts.filter(d => d.status === 'sent');
  const card = (d, i) => {
    const gaps = (d.body.match(/\[[^\]]*\]/g) || []).length;
    return `<div class="card draft" data-i="${i}">
      <div class="kind">${esc(d.date)} · ${esc(d.institution)}</div>
      <h3>${esc(d.name)}</h3>
      <p class="small">To: <strong>${esc(d.email)}</strong></p>
      ${d.paper ? `<p class="small muted">${esc(d.paper)}</p>` : ''}
      ${gaps ? `<p class="small"><span class="tag warn">${gaps} unfilled [bracket] ${gaps === 1 ? 'spot' : 'spots'}</span> Fix before sending.</p>` : ''}
      <details><summary class="small">Read and edit</summary>
        <label class="field">Subject</label><input type="text" data-f="subject" value="${esc(d.subject)}">
        <label class="field">Email</label><textarea data-f="body" class="big">${esc(d.body)}</textarea>
        <p><button class="ghost" data-act="save">Save edits</button></p>
      </details>
      <p class="row">
        <button data-act="gmail">Open in Gmail</button>
        <button class="ghost" data-act="mail">Mail app</button>
        <button class="ghost" data-act="copy">Copy</button>
      </p>
      <p class="row small"><button class="ghost" data-act="sent">I sent it</button><button class="x" data-act="del" aria-label="Delete draft">Delete</button></p>
    </div>`;
  };
  $view.innerHTML = `
    <div class="hero"><h1>Emails</h1><p class="muted">${open.length} professor drafts from prof-scout. Open one in Gmail, read it, then press send there.</p></div>
    <div class="grid">${open.map(d => card(d, drafts.indexOf(d))).join('') || '<p class="muted">No drafts right now. Prof-scout adds new ones on weekday mornings.</p>'}</div>
    ${sent.length ? `<section><h2>Sent</h2>${sent.map(d => `<p class="small">${esc(d.sent || '')} · <strong>${esc(d.name)}</strong> · ${esc(d.email)}</p>`).join('')}</section>` : ''}`;

  $view.querySelectorAll('.draft').forEach(el => {
    const d = drafts[el.dataset.i];
    const cur = () => ({ subject: el.querySelector('[data-f=subject]').value, body: el.querySelector('[data-f=body]').value });
    const persist = msg => { const { path, ...rest } = d; return save(path, JSON.stringify(rest, null, 1) + '\n', msg); };
    const ok = () => !/\[[^\]]*\]/.test(cur().body) || confirm('This draft still has an unfilled [bracket] spot. Open it anyway?');
    el.querySelectorAll('[data-act]').forEach(b => b.onclick = async () => {
      const { subject, body } = cur(), act = b.dataset.act;
      if (act === 'save') { Object.assign(d, { subject, body }); await persist(`Edit draft to ${d.name}`); }
      if (act === 'gmail' && ok()) window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(d.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank', 'noopener');
      if (act === 'mail' && ok()) location.href = `mailto:${d.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      if (act === 'copy') { await navigator.clipboard.writeText(`To: ${d.email}\nSubject: ${subject}\n\n${body}`); toast('Copied'); }
      if (act === 'sent' && confirm(`Mark the email to ${d.name} as sent?`)) { Object.assign(d, { subject, body, status: 'sent', sent: today() }); await persist(`Sent: ${d.name}`); route(); }
      if (act === 'del' && confirm(`Delete the draft to ${d.name}?`)) { await remove(d.path, `Delete draft to ${d.name}`); route(); }
    });
  });
}

// ---------- password unlock ----------
// vault.json (public, in the site repo) holds the GitHub token encrypted with her password:
// PBKDF2-SHA256 (600k rounds) -> AES-GCM. Without the password the file is useless, so the password must be long.
const SITE_REPO = 'jadalin100/jada-home';
const ITER = 600000;
const bytes = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const b64 = u8 => btoa(String.fromCharCode(...u8));
async function keyFrom(pw, salt, iter = ITER) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function lockToken(tok, pw) {
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await keyFrom(pw, salt), new TextEncoder().encode(tok)));
  return { v: 1, iter: ITER, salt: b64(salt), iv: b64(iv), ct: b64(ct) };
}
async function unlockToken(vault, pw) {
  const key = await keyFrom(pw, bytes(vault.salt), vault.iter);
  return new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes(vault.iv) }, key, bytes(vault.ct)));
}
function keepToken(tok, remember) {
  sessionStorage.setItem('ghToken', tok);
  if (remember) localStorage.setItem('ghToken', tok);
}
async function ghFetch(url, opts = {}, tok = token()) {
  return fetch('https://api.github.com/repos/' + url, { ...opts, cache: 'no-store',
    headers: { Authorization: `Bearer ${tok}`, Accept: 'application/vnd.github+json' } });
}

async function viewUnlock() {
  const r = await fetch('vault.json', { cache: 'no-store' }).catch(() => null);
  const vault = r && r.ok ? await r.json() : null;
  $view.innerHTML = `
    <div class="hero"><h1>Hello,<br>Jada.</h1></div>
    <div class="card" style="max-width:34rem">
      ${vault ? `
        <label class="field" for="pw">Password</label><input type="password" id="pw" autocomplete="current-password">
        <p class="small"><label><input type="checkbox" id="remember"> Stay unlocked on this device (skip on shared computers)</label></p>
        <p><button id="go">Open journal</button></p>
        <details class="small"><summary>Change password or token</summary><div id="setupSlot"></div></details>`
      : `<p>Set up your password once. After that, any browser opens with just the password.</p><div id="setupSlot"></div>`}
    </div>`;
  document.getElementById('setupSlot').innerHTML = `
    <label class="field" for="tok">New GitHub token</label><input type="password" id="tok" autocomplete="off">
    <p class="small muted">Fine-grained token. Repository access: <strong>${esc(REPO)}</strong> and <strong>${esc(SITE_REPO)}</strong>. Permission: Contents, read and write.</p>
    <label class="field" for="pw1">Password (at least 20 characters, e.g. 4 random words)</label><input type="password" id="pw1" autocomplete="new-password">
    <label class="field" for="pw2">Type it again</label><input type="password" id="pw2" autocomplete="new-password">
    <p><button id="setup">Save password</button></p>`;

  if (vault) {
    const go = async () => {
      const b = document.getElementById('go'); b.disabled = true; b.textContent = 'Unlocking…';
      try { keepToken(await unlockToken(vault, document.getElementById('pw').value), document.getElementById('remember').checked); route(); }
      catch { toast('Wrong password.'); b.disabled = false; b.textContent = 'Open journal'; }
    };
    document.getElementById('go').onclick = go;
    document.getElementById('pw').onkeydown = e => { if (e.key === 'Enter') go(); };
  }
  document.getElementById('setup').onclick = async () => {
    const tok = document.getElementById('tok').value.trim(), p1 = document.getElementById('pw1').value, p2 = document.getElementById('pw2').value;
    if (p1.length < 20) return toast('Use at least 20 characters.');
    if (p1 !== p2) return toast('The two passwords do not match.');
    if (!(await ghFetch(`${REPO}/contents/data`, {}, tok)).ok) return toast(`That token cannot read ${REPO}.`);
    const path = `${SITE_REPO}/contents/vault.json`;
    const old = await ghFetch(path, {}, tok);
    const sha = old.ok ? (await old.json()).sha : undefined;
    const put = await ghFetch(path, { method: 'PUT', body: JSON.stringify({ message: 'Update password vault', sha,
      content: b64encode(JSON.stringify(await lockToken(tok, p1)) + '\n') }) }, tok);
    if (!put.ok) return toast(`That token cannot write to ${SITE_REPO}. Add that repo to the token.`);
    keepToken(tok, false);
    toast('Password saved. It works everywhere in about a minute.');
    route();
  };
}

function lock() { sessionStorage.removeItem('ghToken'); localStorage.removeItem('ghToken'); }

// ---------- router ----------
async function route() {
  cache = {};
  const [page, arg] = decodeURIComponent(location.hash.slice(1) || 'home').split('/');
  document.querySelectorAll('nav a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + ({ archive: 'entries', entry: 'entries', week: 'entries', project: 'projects' }[page] || page)));
  if (page === 'lock') { lock(); location.hash = 'home'; return; }
  if (!DEMO && !token()) return viewUnlock();
  try {
    await ({ home: viewHome, journal: viewJournal, entries: viewArchive, archive: viewArchive, entry: viewEntry, week: viewWeek, projects: viewProjects, project: viewProject, study: viewStudy, emails: viewEmails, smg: viewSMG }[page] || viewHome)(arg);
    window.scrollTo(0, 0);
  } catch (e) {
    $view.innerHTML = `<div class="hero"><h1>Can't load</h1><p>${esc(e.message)}</p><p><button class="ghost" onclick="route()">Try again</button></p></div>`;
  }
}
addEventListener('hashchange', route);
route();
