// Dragon Den. Loaded before app.js; uses its globals (read, readJSON, save, esc, today, ...) at call time.
// Data: dragons/den.json in the private repo. dragons/dotd/<date>.json is written by the 7am task.

const TRAITS = [
  { k: 'builder', n: 'Builder', el: 'Forge', col: '#f7c9a8', w: 'build code launch start site app fix make ship deploy script program prototype setup' },
  { k: 'seeker', n: 'Seeker', el: 'Star', col: '#cfc6f5', w: 'read paper research analy data learn explore lit experiment figure result pubmed question' },
  { k: 'steady', n: 'Steady', el: 'Moss', col: '#c5e0c8', w: 'study practice homework hw viola review flashcard problem worksheet quiz test usabo scioly anki chapter' },
  { k: 'leader', n: 'Leader', el: 'Crown', col: '#fbe3a1', w: 'meeting club lead present deca plan organiz agenda officer treasur budget slides' },
  { k: 'connector', n: 'Connector', el: 'Cloud', col: '#c6dcf4', w: 'email tutor help call reach friend text message mentor thank reply volunteer family' },
  { k: 'original', n: 'Original', el: 'Bloom', col: '#f6c3d6', w: 'write essay draft design idea story draw art poster edit creative compose' },
  { k: 'recharge', n: 'Recharge', el: 'Moon', col: '#c9ead8', w: 'sleep rest walk clean journal quiet self-care nap stretch tidy shower meditat break' },
];
const TR = Object.fromEntries(TRAITS.map(t => [t.k, t]));
const KIND_DEFAULT = { hw: 'steady', study: 'steady', club: 'leader' };
const PLACES = { Forge: 'glowing workshop caves', Star: 'observatory peaks', Moss: 'quiet moss gardens', Crown: 'castle courtyards', Cloud: 'drifting cloud villages', Bloom: 'wildflower valleys', Moon: 'moonlit tide pools' };
const RARE = {
  Phoenix: ['bounces back brighter after rough days', '#ffb38a'], Moonglow: ['gentle with itself and everyone around it', '#d8d0ff'],
  Hearth: ['feels like a warm blanket on a cold night', '#ffc7a8'], Starwish: ['always believes tomorrow will be good', '#fff1a8'],
  Rainbell: ['finds joy right after the rain', '#bfe6ff'],
};
const DOWN_MOODS = ['low', 'sad', 'stressed', 'anxious', 'tired'];
const DOWN_RE = /\b(down|sad|rough|overwhelm\w*|exhausted|lonely|cried|awful|stressed|anxious|bad day|burn(ed|t)? out)\b/i;

const POWERS = {
  builder: ['turns a blank page into a blueprint in one breath', 'snaps any broken thing back together with a flick of its tail'],
  seeker: ['can smell an unanswered question from a mile away', 'its eyes glow brighter the closer it gets to a discovery'],
  steady: ['never loses count of reps, pages, or days', 'its scales get a tiny bit shinier every day you practice'],
  leader: ['its tiny roar makes a whole room go quiet and listen', 'can carry a whole team on its back (if they hold on)'],
  connector: ['can deliver a message to anyone, anywhere, by sunset', 'its hugs are warm enough to fix a bad day'],
  original: ['breathes sparks that turn into brand-new ideas', 'nothing it makes has ever been made before'],
  recharge: ['naps so well it refills everyone nearby', 'can dim any room to the perfect cozy glow'],
};
const SNACKS = ['strawberry mochi', 'honey toast', 'blueberry dumplings', 'peach rings', 'matcha cookies', 'warm milk tea', 'sugar snap peas', 'cloud cotton candy'];
const QUIRKS = ['hums when it is concentrating', 'sleeps curled around its tail like a cinnamon roll', 'collects shiny paper clips', 'sneezes tiny sparkles',
  'tilts its head at every question', 'hides behind your laptop when it is shy', 'does a little hop when it is happy', 'insists on sitting on warm laptops'];

// ---------- voices ----------
const HATCH = {
  builder: ['Brick by brick! Nice.', 'You built something today. I saw.', 'More blueprints, please!'],
  seeker: ['Ooh, what did you find?', 'Curious minds win. Good work!', 'One more mystery poked at.'],
  steady: ['One more rep. That is how it is done.', 'Slow and steady, you are doing it.', 'Same time tomorrow? I will be here.'],
  leader: ['Look at you, running the show!', 'The team is lucky. Good job.', 'Captain Jada, reporting in!'],
  connector: ['Someone\'s day got better because of you.', 'Yay, people stuff! Proud of you.', 'You showed up for someone. That counts.'],
  original: ['Nobody else could have made that.', 'So you. I love it.', 'Fresh idea alert!'],
  recharge: ['Resting is part of the work.', 'Mmm, cozy. Good call.', 'Recharged dragons fly farther. You too.'],
};
const FLEDGE = {
  builder: 'You built on {p} today, and "{w}" sounds like real progress to me. Builders don\'t wait for permission, and neither do you.',
  seeker: 'Ooh, {p}! I read your log and "{w}" made my ears perk up. What question are you chasing next?',
  steady: 'Another day on {p}. "{w}" is exactly the kind of quiet rep that adds up, and I am keeping count for you.',
  leader: 'You moved {p} forward today. "{w}" sounds like you were steering, and the team is lucky to have you at the front.',
  connector: 'You showed up for people with {p} today. "{w}" will mean more to someone than you think.',
  original: '{p} got a little more you-shaped today. "{w}" is not something anyone else would have come up with.',
  recharge: 'You logged {p} and still took care of yourself. "{w}" counts, and a rested Jada is a dangerous Jada.',
};
const ELDER = {
  builder: 'I\'ve watched you build for a while now, and {p} is starting to look like something only you could have made. "{w}" is the kind of step that turns a sketch into a real thing.',
  seeker: 'I\'ve been reading your logs for a while, and on {p} your questions keep getting sharper. "{w}" tells me you\'re not just collecting answers, you\'re finding better questions.',
  steady: 'Do you know how many days I\'ve watched you show up? On {p}, "{w}" looks small today, but stacked with all the others it is a mountain.',
  leader: 'You\'ve been steering {p} for a long time now, and "{w}" shows it. Leading isn\'t bossy when people get somewhere because of it.',
  connector: 'I keep noticing how you take care of people through the work itself. With {p}, "{w}" is one more way someone feels looked after.',
  original: 'Every time I visit, {p} sounds more like you and less like anyone else. "{w}" is proof your ideas are yours.',
  recharge: 'I\'ve been around long enough to see your rhythm: sprint, then recharge. Logging {p} ("{w}") and still resting is how you keep sprinting.',
};
const INTRO = {
  builder: 'I built a little pedestal for today\'s quote:', seeker: 'I went exploring this morning and found this for you:',
  steady: 'Same as every morning, right on time, here is your quote:', leader: 'Okay team, gather round. Today\'s quote:',
  connector: 'I picked this one just for you, Jada:', original: 'I wanted a quote nobody else would give you today:', recharge: 'Deep breath first. Then this:',
};

// ---------- small helpers ----------
const pick = xs => xs[Math.floor(Math.random() * xs.length)];
const r1 = x => Math.round(x * 10) / 10;
const hash = s => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const mainTrait = tr => TRAITS.map(t => t.k).sort((a, b) => tr[b] - tr[a])[0];
const secondTrait = tr => TRAITS.map(t => t.k).sort((a, b) => tr[b] - tr[a])[1];
const sum = tr => TRAITS.reduce((n, t) => n + (tr[t.k] || 0), 0);
const growth = d => r1(sum(d.traits) - sum(d.born));
const stage = d => growth(d) < 1 ? 'Hatchling' : growth(d) < 3 ? 'Fledgling' : 'Elder';
const isBirthday = d => d.hatched.slice(5) === today().slice(5) && d.hatched.slice(0, 4) !== today().slice(0, 4);
const dname = d => d.name || 'Unnamed';
const closeness = due => !due ? 1 : daysUntil(due) <= 1 ? 3 : daysUntil(due) <= 7 ? 2 : 1;   // 3 = Now, 2 = this week, 1 = later

function traitScores(text) {
  const s = (text || '').toLowerCase();
  return Object.fromEntries(TRAITS.map(t => [t.k, t.w.split(' ').filter(w => new RegExp('\\b' + w.replace('-', '\\-')).test(s)).length]));
}
function leastDone(den) {
  const since = addDays(today(), -14), n = Object.fromEntries(TRAITS.map(t => [t.k, 0]));
  den.history.filter(h => h.k === 'tame' && h.d >= since).forEach(h => n[h.tr]++);
  return TRAITS.map(t => t.k).sort((a, b) => n[a] - n[b])[0];
}
function traitOf(text, fallback, den) {
  const sc = traitScores(text), best = Math.max(...Object.values(sc));
  return best ? TRAITS.find(t => sc[t.k] === best).k : fallback || leastDone(den);
}
// her #1 trait today: what most of today's finished tasks (including this one) map to
function topTraitToday(den, current) {
  const n = {}; [...den.history.filter(h => h.k === 'tame' && h.d === today()).map(h => h.tr), current].forEach(k => n[k] = (n[k] || 0) + 1);
  const best = Math.max(...Object.values(n));
  return n[current] === best ? current : Object.keys(n).find(k => n[k] === best);
}
// effort, close, imp are each 1-3
const tameChance = ({ effort, close, imp, project, match }) => 10 + 2 * (effort + close + imp - 3) + (project ? 3 : 0) + (match ? 5 : 0);   // 10-30%
const pointChance = streakDays => Math.min(30, 12 + 2 * streakDays);
const breedChance = match => 25 + (match ? 5 : 0);

// ---------- genetics ----------
// 6 colors from 3 blending alleles (incomplete dominance)
const COLORS = { PP: ['pink', '#f6c3d6'], BB: ['blue', '#c6dcf4'], YY: ['butter', '#fbe0a0'], BP: ['lavender', '#d9c8f5'], PY: ['peach', '#f9cdb0'], BY: ['mint', '#c9ead8'] };
// al = alleles from most to least dominant; a = what each one looks like. Horns and wings have 4 alleles (a dominance series).
const LOCI = [
  { k: 'h', n: 'Horns', al: ['A', 'H', 'K', 'h'], a: ['swept-back', 'ram curl', 'spiky', 'nubs'] },
  { k: 'f', n: 'Wings', al: ['M', 'F', 'L', 'f'], a: ['bat', 'feathered', 'fin', 'tiny'] },
  { k: 's', n: 'Spots', al: ['S', 's'], a: ['freckles', 'plain'] },
  { k: 't', n: 'Tail tip', al: ['T', 't'], a: ['heart', 'leaf'] },
  { k: 'g', n: 'Glitter', al: ['G', 'g'], a: ['no sparkle', 'sparkly'] },
];
const CODE = { P: 'GCA', B: 'GCT', Y: 'GCG', A: 'CAA', H: 'CAT', K: 'CAG', h: 'CAC', M: 'TTC', F: 'TTA', L: 'TTT', f: 'TTG',
  S: 'AGT', s: 'AGC', T: 'ACA', t: 'ACG', G: 'GGA', g: 'GGT', '*': 'TAC', '-': 'TAT', W: 'TGG' };
const colorOf = c => COLORS[[...c].sort().join('')];
const rank = (L, x) => L.al.indexOf(x);
const sortPair = (L, pair) => [...pair].sort((x, y) => rank(L, x) - rank(L, y));
const showOf = (L, pair) => L.a[rank(L, sortPair(L, pair)[0])];
const hasStar = (z, sex) => sex === 'F' ? z[0] === '*' : z.every(a => a === '*');
function pheno(g, sex) {
  const o = { color: colorOf(g.c), star: hasStar(g.z, sex) };
  for (const L of LOCI) o[L.k] = showOf(L, g[L.k]);
  return o;
}
function randomGenes(sex) {
  const two = xs => [pick(xs), pick(xs)];
  return { c: two('PBY'), h: two('AHKh'), f: two('MFLf'), s: two('Ss'), t: two('Tt'), g: two('GGGg'),
    z: (sex === 'F' ? [0] : [0, 0]).map(() => Math.random() < .3 ? '*' : '-') };
}
function cross(mom, dad, sex) {   // mom is ZW, dad is ZZ
  const g = {};
  for (const k of ['c', 'h', 'f', 's', 't', 'g']) g[k] = [pick(mom[k]), pick(dad[k])];
  g.z = sex === 'F' ? [pick(dad.z)] : [pick(dad.z), mom.z[0]];   // daughters get dad's Z + mom's W
  return g;
}
const genotype = (g, sex) => [[...g.c].sort().join(''), ...LOCI.map(L => sortPair(L, g[L.k]).join('')),
  sex === 'F' ? `Z${g.z[0] === '*' ? '*' : ''}W` : g.z.map(a => 'Z' + (a === '*' ? '*' : '')).sort().join('')].join(' ');
const sequence = (g, sex) => [g.c, ...LOCI.map(L => g[L.k]), sex === 'F' ? [g.z[0], 'W'] : g.z].map(p => p.map(a => CODE[a]).join('')).join(' ');
// exact offspring odds, Punnett-square style
function offspringOdds(mom, dad) {
  const out = {};
  const tally = (k, f) => { const n = {}; for (const a of mom[k]) for (const b of dad[k]) { const v = f([a, b]); n[v] = (n[v] || 0) + 25; } return n; };
  out.Color = tally('c', p => colorOf(p)[0]);
  for (const L of LOCI) out[L.n] = tally(L.k, p => showOf(L, p));
  const dStar = dad.z.filter(a => a === '*').length * 50;
  out['Star (daughters)'] = { star: dStar, none: 100 - dStar };
  out['Star (sons)'] = { star: mom.z[0] === '*' ? dStar : 0, none: 100 - (mom.z[0] === '*' ? dStar : 0) };
  return out;
}

// ---------- making dragons ----------
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
function facts(main, task, bredFrom) {
  return { power: pick(POWERS[main]), snack: pick(SNACKS), quirk: pick(QUIRKS),
    story: bredFrom ? `Hatched in the den from ${bredFrom}'s egg, kept warm by both of them until it wobbled out.`
      : `Born in the ${PLACES[TR[main].el]}, it found you while you were finishing "${task}" and decided anyone who finishes things like that is worth following home.` };
}
function newDragon(trait, task, rare) {
  const sex = Math.random() < .5 ? 'F' : 'M';
  const born = Object.fromEntries(TRAITS.map(t => [t.k, r1(t.k === trait ? 6 + Math.random() * 2 : 1 + Math.random() * 4)]));
  return { id: uid(), name: '', sex, genes: randomGenes(sex), born, traits: { ...born }, rare, hatched: today(), from: task, gen: 1, points: 0, visits: [], ...facts(trait, task) };
}
function makeBaby(mom, dad) {
  const sex = Math.random() < .5 ? 'F' : 'M';
  const born = Object.fromEntries(TRAITS.map(t => [t.k, r1((mom.born[t.k] + dad.born[t.k]) / 2)]));   // parents' traits at adoption
  const rares = [mom.rare, dad.rare].filter(Boolean);
  const rare = rares.length && Math.random() < .1 ? pick(rares) : null;
  return { id: uid(), name: '', sex, genes: cross(mom.genes, dad.genes, sex), born, traits: { ...born }, rare, hatched: today(),
    from: `${dname(mom)} + ${dname(dad)}`, parents: [mom.id, dad.id], gen: Math.max(mom.gen, dad.gen) + 1, points: 0, visits: [],
    ...facts(mainTrait(born), '', `${dname(mom)} and ${dname(dad)}`) };
}

// ---------- the cute part ----------
function shade(hex, amt) {   // amt < 0 darkens, > 0 lightens toward white
  const n = parseInt(hex.slice(1), 16), ch = [n >> 16, (n >> 8) & 255, n & 255];
  return '#' + ch.map(c => Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt).toString(16).padStart(2, '0')).join('');
}
const mix = (a, b, t) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), A = p(a), B = p(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
const POSES = ['stand', 'wave', 'cheer', 'sit', 'sleep', 'fly', 'egg', 'heart', 'wink', 'shy'];
const POSE_NAMES = { stand: 'Standing', wave: 'Waving', cheer: 'Cheering', sit: 'Sitting', sleep: 'Napping', fly: 'Flying', egg: 'Peeking from its egg', heart: 'Holding a heart', wink: 'Winking', shy: 'Feeling shy' };
const DRAG = {};   // id -> dragon, so hovering can redraw it in a new pose
// Three-quarter view facing left, snout sticking out sideways. Shoulders: near (51,74), far (68,75).
const ARMS = {
  stand: ['M51 74Q45 82 48 89', 'M68 75Q72 83 67 89'], wave: ['M51 74Q45 82 48 89', 'M68 75Q81 68 80 53'], cheer: ['M51 74Q39 66 42 53', 'M68 75Q81 68 80 53'],
  sit: ['M51 74Q47 84 53 90', 'M68 75Q71 84 65 90'], sleep: ['M51 76Q50 86 57 88', 'M68 76Q70 86 63 88'], fly: ['M51 74Q40 76 38 84', 'M68 75Q78 78 80 86'],
  egg: ['M50 77Q42 81 45 86', 'M70 77Q78 81 75 86'], heart: ['M51 74Q49 86 56 87', 'M68 75Q70 86 64 87'], wink: ['M51 74Q45 82 48 89', 'M68 75Q77 82 73 89'],
  shy: ['M51 74Q39 66 44 56', 'M68 75Q77 66 67 56'],
};
function dragonSVG(d, { pose = 'stand', hat = isBirthday(d) } = {}) {
  DRAG[d.id] = d;
  const P = pheno(d.genes, d.sex), c = P.color[1];
  const ol = mix(shade(c, -.5), '#5a3a2e', .45);   // outline: a deep version of the body color, warmed toward brown
  const belly = mix(c, '#fff6e6', .72), ridge = shade(c, -.12), eye = '#4a2e22', membrane = mix(c, '#ffffff', .4);
  const horn = mix(shade(c, -.16), '#fff4e0', .35), hornLine = shade(c, -.35);
  const S = (w = 2) => `stroke="${ol}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const limb = (path, w = 8.5) => `<path d="${path}" fill="none" stroke="${ol}" stroke-width="${w}" stroke-linecap="round"/><path d="${path}" fill="none" stroke="${c}" stroke-width="${w - 3.6}" stroke-linecap="round"/>`;
  const low = pose === 'sit' || pose === 'sleep', lift = { sit: 5, sleep: 9, fly: -8, egg: 2 }[pose] || 0;

  // wings, drawn from the shoulder (0,0) reaching up and out
  const WING = {
    bat: `<path d="M0 0C3-13 13-25 29-30C28-24 29-20 34-16C28-16 24-13 24-8C20-10 15-8 14-3C10-4 5-2 2 4Z" fill="${membrane}" ${S()}/>
      <path d="M17-22Q27-19 34-16M17-22Q21-14 24-8M17-22Q15-11 14-3" fill="none" stroke="${ol}" stroke-width="1.3" stroke-linecap="round" opacity=".55"/>
      <path d="M27-29C29-33 32-33 33-31" fill="none" ${S(1.6)}/>`,
    feathered: `<path d="M0 0C2-14 14-26 30-28C33-27 34-24 32-22C35-21 35-17 32-16C34-14 33-10 29-10C30-7 27-4 24-5C24-1 19 1 16 0C12 3 6 3 2 4Z" fill="#fffaf5" ${S()}/>
      <path d="M8-8C14-15 21-19 29-21M8-3C14-8 20-11 27-12M7 1C12-2 16-3 21-3" fill="none" stroke="${ol}" stroke-width="1.1" stroke-linecap="round" opacity=".4"/>`,
    fin: `<path d="M0 0C2-8 6-16 10-24C12-19 14-17 17-16C19-22 23-27 28-30C28-24 29-20 31-18C33-21 36-22 40-22C37-14 30-6 20-2C13 1 6 3 2 4Z" fill="${membrane}" ${S()}/>
      <path d="M3 1Q7-11 10-22M4 2Q16-13 27-28M5 3Q22-6 38-21" fill="none" stroke="${ol}" stroke-width="1.1" stroke-linecap="round" opacity=".45"/>`,
    tiny: `<path d="M0 0C2-8 8-13 16-14C15-11 16-9 18-7C14-7 12-5 12-2C9-3 5-1 2 3Z" fill="${membrane}" ${S()}/>
      <path d="M9-10Q13-8 18-7M9-10Q11-6 12-2" fill="none" stroke="${ol}" stroke-width="1.1" stroke-linecap="round" opacity=".5"/>`,
  }[P.f];
  const fly = pose === 'fly';
  const wings = `<g transform="translate(73 70) rotate(${fly ? -16 : 0}) scale(${fly ? 1.35 : 1.12})">${WING}</g>`;

  const tipShape = P.t === 'heart' ? `<path d="M0 4C-6 0-6-6-2.2-6 0-6 0-3.6 0-3.6S0-6 2.2-6C6-6 6 0 0 4Z" fill="${ridge}" ${S(1.6)}/>`
    : `<path d="M0 2Q8-6 0-14Q-8-6 0 2Z" fill="${ridge}" ${S(1.6)}/>`;
  const tail = pose === 'egg' ? '' : low
    ? `<path d="M70 102C80 110 92 110 98 102C100 98 99 95 97 94C95 100 89 104 82 103C77 102 73 100 72 97Z" fill="${c}" ${S()}/>
       <path d="M77 101 78 95 82 102ZM85 103 88 97 90 103ZM93 100 97 95 96 101Z" fill="${ridge}" ${S(1.4)}/><g transform="translate(98 91) rotate(20)">${tipShape}</g>`
    : `<path d="M76 90C88 98 100 98 105 88C108 82 107 77 104 75C103 82 98 88 90 89C84 90 80 88 77 85Z" fill="${c}" ${S()}/>
       <path d="M83 89 85 83 88 89ZM91 89 95 83 96 87ZM98 85 103 80 102 85Z" fill="${ridge}" ${S(1.4)}/><g transform="translate(105 72) rotate(20)">${tipShape}</g>`;

  const foot = (x, y, k = 1) => `<g transform="translate(${x} ${y}) scale(${k})"><path d="M-9 0C-10-4-6-5-1-5C4-5 7-4 7 0C7 2 4 2-1 2C-6 2-9 2-9 0Z" fill="${c}" ${S()}/><path d="M-5-1.5v3M-1-1.5v3" ${S(1.2)}/></g>`;
  const farLeg = pose === 'egg' || low ? '' : fly ? `<ellipse cx="71" cy="97" rx="6" ry="7" fill="${c}" ${S()}/>${foot(71, 106, .7)}`
    : `<ellipse cx="72" cy="96" rx="8" ry="9" fill="${c}" ${S()}/>${foot(72, 106, .9)}`;
  const nearLeg = pose === 'egg' || low ? '' : fly ? `<ellipse cx="51" cy="97" rx="7" ry="8" fill="${c}" ${S()}/>${foot(50, 107, .75)}`
    : `<ellipse cx="51" cy="95" rx="9" ry="10" fill="${c}" ${S()}/>${foot(48, 106)}`;
  const bean = (x, y, k) => `<g transform="translate(${x} ${y}) scale(${k})"><ellipse rx="8.5" ry="6.5" fill="${c}" ${S()}/><ellipse cy="1.5" rx="4" ry="3" fill="${belly}"/>
    <circle cx="-3.5" cy="-2.5" r="1.3" fill="${belly}"/><circle cy="-3.5" r="1.3" fill="${belly}"/><circle cx="3.5" cy="-2.5" r="1.3" fill="${belly}"/></g>`;
  const feetFront = low ? bean(68, 105, .85) + bean(48, 104, 1) : '';
  const body = `<path d="M52 66C44 72 42 84 44 94C46 103 53 107 62 107C72 107 79 102 80 93C81 83 77 72 70 66Z" fill="${c}" ${S()}/>
    <path d="M78 72 83 74 79 78ZM80 80 85 82 80 86ZM80 88 85 90 80 93Z" fill="${ridge}" ${S(1.3)}/>`;
  const bellySvg = `<path d="M57 70C50 74 48 84 49 93C50 100 54 104 60 104C66 104 69 99 69 91C69 81 66 73 57 70Z" fill="${belly}" stroke="${ol}" stroke-width="1.1" stroke-opacity=".45"/>
    <path d="M51 80Q58 83 66 80M50 88Q59 91 68 88M51 96Q59 99 67 96" fill="none" stroke="${ol}" stroke-width="1.1" opacity=".3"/>
    ${P.s === 'freckles' ? `<g fill="${ol}" opacity=".3"><circle cx="74" cy="82" r="1.3"/><circle cx="76" cy="88" r="1"/><circle cx="73" cy="94" r="1.2"/></g>` : ''}`;

  // horns, drawn from the base (0,0) sweeping up and back
  const ring = 'fill="none" stroke-width="1" stroke-linecap="round"';
  const HORN = {
    'swept-back': `<path d="M-4 0C-4-9 1-17 13-22C7-15 5-8 4 0Z" fill="${horn}" ${S(1.6)}/><path d="M-2-6Q1-5 4-6M0-11Q3-10 6-12M4-15Q6-15 8-17" ${ring} stroke="${hornLine}" opacity=".6"/>`,
    'ram curl': `<path d="M0 0C-3-10 5-17 12-13C16-10 13-4 9-6" fill="none" stroke="${ol}" stroke-width="7.5" stroke-linecap="round"/>
      <path d="M0 0C-3-10 5-17 12-13C16-10 13-4 9-6" fill="none" stroke="${horn}" stroke-width="4.3" stroke-linecap="round"/>
      <path d="M-1-6Q1-5 2-7M3-12Q4-10 6-11" ${ring} stroke="${hornLine}" opacity=".6"/>`,
    spiky: `<path d="M-3.5 0C-2-6 1-12 5-19C5-12 5-6 4 0Z" fill="${horn}" ${S(1.6)}/><path d="M4-2C6-6 8-9 11-11C10-7 9-4 8-1Z" fill="${horn}" ${S(1.4)}/>
      <path d="M-2-5Q1-4 4-5M0-10Q2-9 4-10" ${ring} stroke="${hornLine}" opacity=".6"/>`,
    nubs: `<path d="M-4 0C-4-5 0-8 3-7C5-5 4-2 4 0Z" fill="${horn}" ${S(1.6)}/>`,
  }[P.h];

  const eyeAt = [[46, 42, 3.5, 4.5], [64, 42, 4.3, 5.3]];   // far eye (by the snout) is a little smaller
  const eyesOpen = (dx = 0, k = 1) => eyeAt.map(([x, y, rx, ry]) => `<ellipse cx="${x + dx}" cy="${y}" rx="${rx}" ry="${ry * k}" fill="${eye}"/>
    <circle cx="${x + dx + rx * .38}" cy="${y - ry * .4}" r="${rx * .42}" fill="#fff"/><circle cx="${x + dx - rx * .3}" cy="${y + ry * .45}" r="${rx * .2}" fill="#fff"/>`).join('');
  const arc = ([x, y, rx], up) => `<path d="M${x - rx - .5} ${y + 1}q${rx + .5} ${up ? -5.5 : 3.5} ${2 * rx + 1} 0" fill="none" stroke="${eye}" stroke-width="2.1" stroke-linecap="round"/>`;
  const both = up => arc(eyeAt[0], up) + arc(eyeAt[1], up);
  const eyes = { cheer: both(1), heart: both(1), sleep: both(0), shy: eyesOpen(-1.5),
    wink: eyesOpen().split('<ellipse').slice(0, 2).join('<ellipse') + arc(eyeAt[1], 1), egg: eyesOpen(0, 1.1) }[pose] || eyesOpen();
  const mouth = { wave: 'open', cheer: 'open', egg: 'open', sleep: 'o', wink: 'tongue' }[pose] || 'smile';
  const mouthSvg = mouth === 'open' ? `<path d="M35 56.5Q39 63 45 57.5Z" fill="#e98a9c" stroke="${eye}" stroke-width="1.4" stroke-linejoin="round"/>`
    : mouth === 'o' ? `<circle cx="40" cy="58" r="1.3" fill="none" stroke="${eye}" stroke-width="1.2"/>`
    : `<path d="M35 57Q39.5 60.5 45 57.5" fill="none" stroke="${eye}" stroke-width="1.5" stroke-linecap="round"/>${mouth === 'tongue' ? '<path d="M40 59.4q1.6 3.4 3.2-.2" fill="#f29aab"/>' : ''}`;
  const tilt = { sleep: 'rotate(-10 60 64)', shy: 'rotate(6 60 64)', heart: 'rotate(-4 60 64)' }[pose] || '';
  const head = `<g transform="${tilt}">
    <path d="M84 46C90 43 94 42 97 44C93 46 92 48 91 50C95 50 97 52 98 55C94 55 91 55 89 56C91 58 91 61 90 63C86 61 83 58 82 55Z" fill="${c}" ${S(1.7)}/>
    <path d="M66 21C68 15 72 12 75 12C73 16 73 19 74 22C77 18 81 16 84 17C82 20 81 24 81 27C84 25 87 25 89 26C87 29 86 32 85 34Z" fill="${ridge}" ${S(1.6)}/>
    <g transform="translate(71 25) scale(.82)">${HORN}</g><g transform="translate(57 24)">${HORN}</g>
    <path d="M62 20C77 20 88 30 88 43C88 56 79 65 66 66C60 67 55 66 50 65C41 64 32 61 30 54C29 49 32 45 38 44C40 43 41 41 41 37C43 27 51 20 62 20Z" fill="${c}" ${S()}/>
    <path d="M31 55C34 60 43 62 52 61C47 58 39 57 31 55Z" fill="${belly}" opacity=".7"/>
    ${eyes}<ellipse cx="33.5" cy="49" rx="1" ry=".75" fill="${ol}"/>${mouthSvg}
    <ellipse cx="66" cy="52" rx="4" ry="2.4" fill="#f4a3b4" opacity="${pose === 'shy' ? 1 : .7}"/><ellipse cx="46" cy="51.5" rx="2.8" ry="1.8" fill="#f4a3b4" opacity="${pose === 'shy' ? 1 : .7}"/>
    ${pose === 'shy' ? '<path d="M63 49l1.5 2M66 48.5l1.5 2" stroke="#e07a9a" stroke-width="1"/>' : ''}
    ${P.star ? `<path d="M58 28l1.3 2.7 3 .4-2.2 2 .6 3-2.7-1.5-2.7 1.5.6-3-2.2-2 3-.4z" fill="#fff6b0" stroke="#e8c860" stroke-width=".6"/>` : ''}
    ${hat ? `<path d="M54 24 62 2 70 23Z" fill="#f4a6b6" stroke="#e07a9a" stroke-width="1.2" stroke-linejoin="round"/><circle cx="62" cy="2" r="3" fill="#fbe0a0"/>` : ''}</g>`;
  const egg = pose === 'egg' ? `<path d="M32 84 38 78 45 85 52 77 60 85 68 77 75 85 82 78 88 84Q91 113 60 114 29 113 32 84Z" fill="#fffaf2" ${S()}/>
    <circle cx="46" cy="98" r="2.5" fill="${c}" opacity=".7"/><circle cx="72" cy="104" r="3" fill="${c}" opacity=".7"/><circle cx="66" cy="94" r="1.8" fill="${c}" opacity=".7"/>
    <path d="M52 93l4 4-2 4" fill="none" stroke="${ol}" stroke-width="1.2"/>` : '';
  const arms = ARMS[pose].map(p => limb(p)).join('');
  const prop = pose === 'heart' ? `<path d="M60 96C51 90 51 82 55.5 82 58 82 60 84.5 60 84.5S62 82 64.5 82C69 82 69 90 60 96Z" fill="#f48aa5" ${S(1.6)}/>` : '';
  const extra = {
    sleep: `<text x="84" y="22" font-size="9" fill="${ol}" font-family="Figtree,sans-serif">z</text><text x="91" y="13" font-size="12" fill="${ol}" font-family="Figtree,sans-serif">Z</text>`,
    fly: `<path d="M48 116q4-3 8 0M64 116q4-3 8 0" fill="none" stroke="${ol}" stroke-width="1.4" opacity=".5" stroke-linecap="round"/>`,
    wave: `<path d="M88 44q3 4 0 8M92 41q4 6 0 12" fill="none" stroke="${ol}" stroke-width="1.4" opacity=".5" stroke-linecap="round"/>`,
    cheer: `<g fill="#ffd96b">${[[24, 36], [92, 36], [20, 58]].map(([x, y]) => `<path d="M${x} ${y - 4}l1 3 3 1-3 1-1 3-1-3-3-1 3-1z"/>`).join('')}</g>`,
  }[pose] || '';
  const glit = P.g === 'sparkly' ? `<g class="glit" fill="#ffe27a" stroke="#fff" stroke-width=".6">${[[18, 66], [100, 22], [100, 100], [24, 100], [48, 8]].map(([x, y]) => `<path d="M${x} ${y - 4}l1 3 3 1-3 1-1 3-1-3-3-1 3-1z"/>`).join('')}</g>` : '';
  const aura = d.rare ? `<ellipse class="aura" cx="62" cy="62" rx="54" ry="54" fill="${RARE[d.rare][1]}" opacity=".35"/>` : '';
  return `<svg viewBox="0 0 120 120" class="dragon" aria-hidden="true">${aura}<ellipse cx="62" cy="112" rx="${fly ? 14 : 22}" ry="3" fill="#000" opacity=".07"/>
    <g transform="translate(0 ${lift})">${wings}${tail}${farLeg}${body}${bellySvg}${nearLeg}${feetFront}${head}${egg}${arms}${prop}</g>${extra}${glit}</svg>`;
}
// hovering (or tapping) any dragon picture redraws it in another pose; card pictures step through all 10 in order
document.addEventListener('mouseover', e => {
  const host = e.target.closest('[data-dragon]');
  if (!host || (e.relatedTarget && host.contains(e.relatedTarget))) return;
  const d = DRAG[host.dataset.dragon], svg = host.querySelector('svg.dragon');
  if (!d || !svg) return;
  const cur = host.dataset.pose || 'stand';
  const next = host.dataset.cycle ? POSES[(POSES.indexOf(cur) + 1) % POSES.length] : pick(POSES.filter(p => p !== cur && p !== 'egg'));
  host.dataset.pose = next; host.title = POSE_NAMES[next];
  svg.outerHTML = dragonSVG(d, { pose: next });
});
function heptagon(tr) {
  const ks = TRAITS.map(t => t.k), max = Math.max(10, ...ks.map(k => tr[k]));
  const pt = (i, r) => { const a = -Math.PI / 2 + i * 2 * Math.PI / 7; return [100 + r * Math.cos(a), 100 + r * Math.sin(a)]; };
  const poly = f => ks.map((k, i) => pt(i, f(k)).map(v => v.toFixed(1)).join(',')).join(' ');
  return `<svg viewBox="-50 0 300 200" class="hepta" role="img" aria-label="${ks.map(k => `${TR[k].n} ${tr[k]}`).join(', ')}">
    ${[1 / 3, 2 / 3, 1].map(s => `<polygon points="${poly(() => 70 * s)}" fill="none" stroke="var(--line)"/>`).join('')}
    <polygon points="${poly(k => 70 * tr[k] / max)}" fill="${TR[mainTrait(tr)].col}" fill-opacity=".7" stroke="var(--ink-soft)" stroke-width="1"/>
    ${ks.map((k, i) => { const [x, y] = pt(i, 88); return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${x < 95 ? 'end' : x > 105 ? 'start' : 'middle'}" dominant-baseline="middle">${TR[k].n} ${tr[k]}</text>`; }).join('')}</svg>`;
}

// ---------- den storage ----------
const loadDen = async () => ({ dragons: [], tamed: {}, rested: {}, history: [], ...(await readJSON('dragons/den.json', {})) });
const saveDen = (den, msg) => { dotdMemo = null; return save('dragons/den.json', JSON.stringify(den, null, 1) + '\n', msg); };
async function isDownDay(den) {
  if (den.down === today()) return true;
  for (const d of [today(), addDays(today(), -1)]) {
    const e = parse(await read(`journal/${d}.md`), d);
    if (DOWN_MOODS.includes(e.mood) || DOWN_RE.test(e.mood + ' ' + e.thoughts)) return true;
  }
  return false;
}

// ---------- modal + die ----------
let queue = Promise.resolve();
const enqueue = fn => (queue = queue.then(fn).catch(e => { closeModal(); toast(e.message); }));
function modal(html) {
  let dlg = document.getElementById('dmodal');
  if (!dlg) { dlg = document.createElement('dialog'); dlg.id = 'dmodal'; dlg.className = 'dmodal'; document.body.append(dlg); }
  dlg.innerHTML = html; if (!dlg.open) dlg.showModal();
  return dlg;
}
const closeModal = () => document.getElementById('dmodal')?.close();
const choice = dlg => new Promise(res => {
  dlg.querySelectorAll('[data-v]').forEach(b => b.onclick = () => res(b.dataset.v));
  dlg.addEventListener('cancel', () => res(null), { once: true });
});
const DIE = `<div class="die" aria-live="polite"><svg viewBox="0 0 100 100" aria-hidden="true">
  <polygon points="50,4 92,28 92,72 50,96 8,72 8,28" fill="#fbe3ef" stroke="#e7a9c4" stroke-width="3" stroke-linejoin="round"/>
  <polygon points="50,18 80,66 20,66" fill="#fff6fa" stroke="#f0c4d7" stroke-width="2" stroke-linejoin="round"/>
  <circle cx="40" cy="72" r="2.4" fill="#2b2320"/><circle cx="60" cy="72" r="2.4" fill="#2b2320"/><path d="M46 77q4 3 8 0" fill="none" stroke="#2b2320" stroke-width="1.6" stroke-linecap="round"/>
  <ellipse cx="33" cy="76" rx="3.5" ry="2" fill="#f4a6b6" opacity=".8"/><ellipse cx="67" cy="76" rx="3.5" ry="2" fill="#f4a6b6" opacity=".8"/></svg><span class="num">?</span></div>`;
function rollDie(dlg, chance) {
  const el = dlg.querySelector('.die'), num = el.querySelector('.num'), roll = 1 + Math.floor(Math.random() * 100);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { num.textContent = roll; return Promise.resolve({ roll, ok: roll <= chance }); }
  el.classList.add('rolling');
  const spin = setInterval(() => num.textContent = 1 + Math.floor(Math.random() * 100), 70);
  return new Promise(res => setTimeout(() => {
    clearInterval(spin); num.textContent = roll; el.classList.remove('rolling'); el.classList.add(roll <= chance ? 'win' : 'miss');
    res({ roll, ok: roll <= chance });
  }, 1300));
}
const oddsHtml = (chance, parts) => `<p class="odds"><strong>${chance}%</strong> chance <span class="muted small">${parts.filter(Boolean).join(' · ')}</span></p>
  <p class="small muted">Roll ${chance} or lower to win.</p>`;
async function askName(dlg, d, title) {
  dlg.innerHTML = `<div class="dm-pic">${dragonSVG(d, { pose: 'cheer' })}</div><h3>${title}</h3>
    <p class="small">${d.sex === 'F' ? '♀ girl' : '♂ boy'} · ${TR[mainTrait(d.traits)].n}${d.rare ? ` · <span class="rare">✦ ${d.rare}</span>` : ''}</p>
    <label class="field" for="dmName">What will you call ${d.sex === 'F' ? 'her' : 'him'}?</label><input type="text" id="dmName" maxlength="24">
    <p class="row"><button data-v="ok">Welcome home</button><button class="ghost" data-v="later">Name later</button></p>`;
  const inp = dlg.querySelector('#dmName'); inp.focus();
  inp.onkeydown = e => { if (e.key === 'Enter') dlg.querySelector('[data-v=ok]').click(); };
  const v = await choice(dlg);
  d.name = v === 'ok' ? inp.value.trim() : '';
}

// ---------- 1. taming: called when any checkbox is checked ----------
// task = { key, text, kind?, effort?, due?, imp?, project? }
function tameFlow(task) {
  return enqueue(async () => {
    const den = await loadDen(), t = today();
    if (den.tamed[task.key] === t) return;
    let effort = task.effort;
    if (!effort) {
      const dlg = modal(`<h3>Done! ✓</h3><p>How big was <strong>${esc(task.text)}</strong>?</p>
        <p class="row">${['Quick', 'Solid', 'Big'].map((l, i) => `<button class="ghost" data-v="${i + 1}">${l}</button>`).join('')}</p>`);
      effort = +(await choice(dlg)); if (!effort) return closeModal();
    }
    const close = closeness(task.due), imp = task.imp || 2;
    const trait = traitOf(task.text, KIND_DEFAULT[task.kind], den);
    const rare = Math.random() < (await isDownDay(den) ? .15 : .02) ? pick(Object.keys(RARE)) : null;
    const d = newDragon(trait, task.text, rare);
    const match = topTraitToday(den, trait) === trait;
    const chance = tameChance({ effort, close, imp, project: !!task.project, match });
    den.tamed = Object.fromEntries(Object.entries(den.tamed).filter(([, v]) => v === t));
    den.tamed[task.key] = t;
    const dlg = modal(`<div class="dm-pic">${dragonSVG(d, { pose: 'egg' })}</div>
      <h3>A little ${TR[trait].n} dragon peeked out!</h3>
      ${rare ? `<p class="rare">✦ Ultra-rare: ${rare}, ${RARE[rare][0]}</p>` : ''}
      ${oddsHtml(chance, [`${10 + 2 * (effort + close + imp - 3)}% from the task`, task.project && '+3% project', match && `+5% ${TR[trait].n} is your #1 today`])}
      ${DIE}<p class="row center"><button data-v="roll">Roll</button></p>`);
    const go = await choice(dlg);
    const { roll, ok } = go ? await rollDie(dlg, chance) : { roll: 100, ok: false };
    den.history.push({ d: t, k: 'tame', ok, tr: trait });
    if (ok) {
      await new Promise(r => setTimeout(r, 700));
      await askName(dlg, d, `You tamed a ${TR[trait].n} dragon!`);
      den.dragons.push(d);
    } else if (go) {
      dlg.querySelector('.row.center').outerHTML = `<p>Rolled ${roll}. It waved its tiny wings and flew home. Maybe next time!</p><p class="row center"><button data-v="ok">OK</button></p>`;
      await choice(dlg);
    }
    closeModal();
    await saveDen(den, ok ? `Tamed ${dname(d)}` : `Tame missed (${TR[trait].n})`);
    if (location.hash.startsWith('#dragons')) route(); else refreshMascot();
  });
}

// ---------- 2. breeding points: called after a study streak day is logged ----------
function breedPointRoll(streakDays) {
  return enqueue(async () => {
    const den = await loadDen();
    if (!den.dragons.length) return;
    const chance = pointChance(streakDays);
    const dlg = modal(`<h3>Streak day ${streakDays}! 🔥</h3><p>Roll for a breeding point.</p>
      ${oddsHtml(chance, ['12% base', `+${Math.min(18, 2 * streakDays)}% for your ${streakDays}-day streak`])}
      ${DIE}<p class="row center"><button data-v="roll">Roll</button></p>`);
    const go = await choice(dlg);
    const { roll, ok } = go ? await rollDie(dlg, chance) : { roll: 100, ok: false };
    den.history.push({ d: today(), k: 'point', ok });
    if (ok) {
      await new Promise(r => setTimeout(r, 600));
      dlg.innerHTML = `<h3>You won a breeding point!</h3><p>Who gets it?</p><div class="dm-pick">${den.dragons.map(d => `
        <button class="ghost" data-v="${d.id}">${dragonSVG(d)}<span>${esc(dname(d))} ${d.sex === 'F' ? '♀' : '♂'} · ${d.points} pt</span></button>`).join('')}</div>`;
      const id = await choice(dlg);
      const d = den.dragons.find(x => x.id === id) || den.dragons[0];
      d.points++;
      toast(`${dname(d)} now has ${d.points} breeding point${d.points === 1 ? '' : 's'}`);
    } else if (go) {
      dlg.querySelector('.row.center').outerHTML = `<p>Rolled ${roll}. No point this time. Keep the streak going!</p><p class="row center"><button data-v="ok">OK</button></p>`;
      await choice(dlg);
    }
    closeModal();
    await saveDen(den, ok ? 'Breeding point won' : 'Breeding point missed');
  });
}

// ---------- 3. log visits: called after a work or impact log is saved ----------
const STOP = new Set('about after again because before being could doing going really should their there these thing things today which while would worked working started finished'.split(' '));
function dragonVisit(text, project) {
  return enqueue(async () => {
    const den = await loadDen();
    if (!den.dragons.length || !text.trim()) return;
    if (DOWN_RE.test(text)) den.down = today();   // only the date is kept, never the words
    const trait = traitOf(text, null, den);
    const d = den.dragons.slice().sort((a, b) => a.traits[trait] - b.traits[trait])[0];
    const words = (text.match(/[A-Za-z][A-Za-z'-]{4,}/g) || []).filter(w => !STOP.has(w.toLowerCase()));
    const w = words.sort((a, b) => b.length - a.length)[0] || 'that';
    const fill = s => s.replace('{p}', project || 'your work').replace('{w}', w);
    const st = stage(d), last = d.visits.at(-1);
    let msg;
    if (st === 'Hatchling') msg = pick(HATCH[mainTrait(d.traits)]);
    else if (st === 'Fledgling') msg = fill(FLEDGE[mainTrait(d.traits)]);
    else {
      const study = await readJSON('data/study.json', { tracks: [] });
      const best = Math.max(0, ...study.tracks.map(tr => streak(tr.days || [])));
      msg = [fill(ELDER[mainTrait(d.traits)]),
        last && last.p ? `Last time I came by (${last.d}), you were on ${last.p}. Look how far that's gone.` : '',
        best ? `And your ${best}-day study streak is still glowing.` : '',
        pick(HATCH[secondTrait(d.traits)])].filter(Boolean).join(' ');
    }
    d.traits[trait] = r1(d.traits[trait] + .1);
    d.visits = [...d.visits, { d: today(), tr: trait, p: project || '' }].slice(-5);
    showVisit(d, msg, trait);
    await saveDen(den, `${dname(d)} visited (+0.1 ${TR[trait].n})`);
  });
}
function showVisit(d, msg, trait) {
  document.querySelector('.visit')?.remove();
  const el = document.createElement('div');
  el.className = 'visit card'; el.setAttribute('role', 'status');
  el.innerHTML = `<div class="v-pic" data-dragon="${d.id}">${dragonSVG(d, { pose: 'wave' })}</div><div><div class="kind">${esc(dname(d))} came to visit · ${stage(d)}</div>
    <p>${esc(msg)}</p><p class="small muted">${TR[trait].n} +0.1 → ${d.traits[trait]}</p></div><button class="x" aria-label="Close">×</button>`;
  el.querySelector('.x').onclick = () => el.remove();
  document.body.append(el);
  setTimeout(() => el.remove(), 15000);
}

// ---------- 4. dragon of the day ----------
let dotdMemo = null;
async function dragonOfDay() {
  const t = today();
  if (dotdMemo && dotdMemo.t === t) return dotdMemo.r;
  const den = await loadDen();
  let r = null;
  if (den.dragons.length) {
    let f = null; try { f = JSON.parse(await read(`dragons/dotd/${t}.json`) || 'null'); } catch { }
    let d = f && den.dragons.find(x => x.id === f.id), intro = f && f.intro;
    if (!d) { try { d = den.dragons.find(x => x.id === localStorage.getItem('dotd-' + t)); } catch { } }
    if (!d) {   // 7am task didn't pick one: match today's quote + to-dos, then remember the pick for the rest of the day
      let pool = den.dragons.filter(x => x.hatched < t); if (!pool.length) pool = den.dragons;
      const todos = await readJSON('data/todos.json', []);
      const sc = traitScores((await read(`quotes/${t}.md`) || '') + ' ' + todos.filter(x => !x.done).map(x => x.t).join(' '));
      const best = Math.max(...Object.values(sc));
      const tr = best ? TRAITS.find(x => sc[x.k] === best).k : TRAITS[hash(t) % 7].k;
      d = pool.slice().sort((a, b) => b.traits[tr] - a.traits[tr] || hash(t + a.id) - hash(t + b.id))[0];
      try { localStorage.setItem('dotd-' + t, d.id); } catch { }
    }
    intro = intro || INTRO[mainTrait(d.traits)];
    r = { d, intro: isBirthday(d) ? `It's my hatch day! 🎂 ${intro}` : intro };
  }
  dotdMemo = { t, r };
  return r;
}
async function fillDotd(el) {
  const r = await dragonOfDay().catch(() => null);
  if (!r || !el) return;
  el.innerHTML = `<a class="dotd" href="#dragons"><span class="dotd-pic" data-dragon="${r.d.id}">${dragonSVG(r.d, { pose: 'wave' })}</span><span>
    <span class="kind">Dragon of the day</span><br><strong>${esc(dname(r.d))}</strong> <span class="muted small">the ${TR[mainTrait(r.d.traits)].n} dragon</span>
    <span class="small dotd-say">“${esc(r.intro)}”</span></span></a>`;
}
async function refreshMascot() {
  if (!window.mascot) return;
  const r = await dragonOfDay().catch(() => null);
  if (!r) return;
  window.mascot.set(dragonSVG(r.d), dname(r.d), HATCH[mainTrait(r.d.traits)]);
  document.getElementById('ram').dataset.dragon = r.d.id;
}

// ---------- 5. the Dragons tab ----------
async function viewDragons() {
  const den = await loadDen();
  const ds = den.dragons;
  const tames = den.history.filter(h => h.k === 'tame'), won = tames.filter(h => h.ok).length;
  const byTrait = TRAITS.map(t => [t, ds.filter(d => mainTrait(d.traits) === t.k).length]);
  const canBreed = sex => ds.filter(d => d.sex === sex && d.points > 0);
  const hour = new Date().getHours();
  const sky = hour < 6 || hour >= 20 ? 'night' : hour < 9 ? 'dawn' : hour < 17 ? 'day' : 'dusk';
  const card = d => {
    const p = pheno(d.genes, d.sex), mt = mainTrait(d.traits);
    const age = Math.max(0, daysUntil(today()) - daysUntil(d.hatched));
    return `<div class="card dcard" id="dc-${d.id}">
      <div class="dc-pic" data-dragon="${d.id}" data-cycle="1" title="Hover to change pose">${dragonSVG(d)}</div>
      <h3>${d.name ? esc(d.name) : `<button class="ghost small" data-name="${d.id}">Name me</button>`} <span class="sex">${d.sex === 'F' ? '♀' : '♂'}</span></h3>
      <p class="small"><span class="tag" style="background:${TR[mt].col}">${TR[mt].n}</span> ${d.rare ? `<span class="tag rare-tag">✦ ${d.rare}</span>` : ''} <span class="tag">${stage(d)}</span>
        ${d.points ? `<span class="tag">♥ ${d.points} breeding pt</span>` : ''}${isBirthday(d) ? ' <span class="tag">🎂 hatch day!</span>' : ''}</p>
      <p class="small muted">Hatched ${esc(d.hatched)} · ${age} day${age === 1 ? '' : 's'} old · gen ${d.gen}<br>${d.parents ? 'Parents' : 'Tamed from'}: ${esc(d.from)}</p>
      ${heptagon(d.traits)}
      <ul class="facts small">
        <li><strong>Superpower:</strong> ${esc(d.power)}</li>
        ${d.rare ? `<li><strong>${d.rare}:</strong> ${RARE[d.rare][0]}</li>` : ''}
        <li><strong>Backstory:</strong> ${esc(d.story)}</li>
        <li><strong>Favorite snack:</strong> ${esc(d.snack)}</li>
        <li><strong>Quirk:</strong> ${esc(d.quirk)}</li>
      </ul>
      <details class="genes"><summary class="small">Genes</summary>
        <p class="geno">${genotype(d.genes, d.sex)}</p><p class="seq">${sequence(d.genes, d.sex)}</p>
        <table class="small"><tr><th>Gene</th><th>Alleles</th><th>DNA</th><th>Shows</th></tr>
          <tr><td>Color</td><td>${[...d.genes.c].sort().join('')}</td><td>${d.genes.c.map(a => CODE[a]).join('')}</td><td>${p.color[0]}</td></tr>
          ${LOCI.map(L => { const g = sortPair(L, d.genes[L.k]); return `<tr><td>${L.n}</td><td>${g.join('')}</td><td>${d.genes[L.k].map(a => CODE[a]).join('')}</td>
            <td>${p[L.k]}${g[0] !== g[1] ? ` <span class="muted">(carries ${L.a[rank(L, g[1])]})</span>` : ''}</td></tr>`; }).join('')}
          <tr><td>Sex + star</td><td>${genotype(d.genes, d.sex).split(' ').pop()}</td><td>${(d.sex === 'F' ? [d.genes.z[0], 'W'] : d.genes.z).map(a => CODE[a]).join('')}</td>
            <td>${d.sex === 'F' ? 'girl' : 'boy'}, ${p.star ? 'star mark' : 'no star'}${d.sex === 'M' && !p.star && d.genes.z.includes('*') ? ' <span class="muted">(carries star)</span>' : ''}</td></tr></table>
        <p class="small muted">How to read it: each letter pair is one gene, one letter from each parent, with the stronger (dominant) letter first. The dominant one is what shows; the other is carried and can show up in babies.
          Color blends instead: one pink + one blue = lavender. Each letter is written in DNA as a 3-base codon (decoder below the den).</p>
      </details>
    </div>`;
  };
  $view.innerHTML = `
    <div class="hero"><h1>Dragon Den</h1><p class="muted">${ds.length ? `${ds.length} dragon${ds.length === 1 ? '' : 's'} live here.` : 'Check off a to-do to meet your first dragon.'}</p></div>
    <div class="meadow ${sky}" aria-label="The meadow where your dragons play">
      <i class="sun"></i><i class="hill h1"></i><i class="hill h2"></i><i class="pond"></i>
      ${Array.from({ length: 14 }, (_, i) => `<i class="flower" style="left:${(i * 37 + 5) % 96}%;top:${58 + (i * 23) % 38}%">✿</i>`).join('')}
      ${ds.map(d => `<button class="md" data-id="${d.id}" data-dragon="${d.id}" aria-label="${esc(dname(d))}">${dragonSVG(d, { pose: pick(['stand', 'sit', 'wave', 'wink']) })}<span class="bub">♡ ○</span></button>`).join('')}
    </div>
    <div class="split" style="margin-top:1.2rem">
      <div class="card"><h2>Breed</h2>
        ${canBreed('F').length && canBreed('M').length ? `
          <div class="row"><select id="mom" aria-label="Mother">${canBreed('F').map(d => `<option value="${d.id}">${esc(dname(d))} ♀ (${d.points} pt)</option>`).join('')}</select>
          <select id="dad" aria-label="Father">${canBreed('M').map(d => `<option value="${d.id}">${esc(dname(d))} ♂ (${d.points} pt)</option>`).join('')}</select></div>
          <div id="breedInfo"></div><p><button id="breed">Try to breed</button></p>`
          : '<p class="muted small">You need one ♀ and one ♂ that each have a breeding point. Log a study streak day to roll for points.</p>'}
      </div>
      <div class="card"><h2>Den stats</h2>
        <p class="small">${ds.length} dragons · ${ds.filter(d => d.sex === 'F').length} ♀ · ${ds.filter(d => d.sex === 'M').length} ♂ · ${ds.filter(d => d.rare).length} ultra-rare · ${ds.filter(d => d.parents).length} bred · oldest generation ${Math.max(0, ...ds.map(d => d.gen))}</p>
        <p class="small">Taming: ${won} of ${tames.length} rolls won${tames.length ? ` (${Math.round(100 * won / tames.length)}%)` : ''}</p>
        <ul class="streaks small">${byTrait.map(([t, n]) => `<li><span><i class="swatch" style="background:${t.col}"></i>${t.n}</span><span class="d">${n}</span></li>`).join('')}</ul>
        <p class="small muted">Main traits in your den: a quiet read on where your time goes.</p>
      </div>
    </div>
    <section><h2>Your dragons</h2><div class="grid dgrid">${ds.map(card).join('') || '<p class="muted">None yet.</p>'}</div></section>
    <section><details class="card"><summary><strong>Dragon genetics guide</strong></summary><div class="small">
      <p><strong>Sex uses the ZW system</strong>, like birds and many reptiles: girls are ZW, boys are ZZ. Daughters get their Z from dad (and W from mom); sons get one Z from each parent.</p>
      <p><strong>The star mark rides on the Z.</strong> A girl shows it with one starred Z. A boy needs two. That is the reverse of human X-linked traits like color blindness, where boys show it more.</p>
      <p><strong>Horns and wings have 4 versions each</strong> in a dominance chain, like rabbit coat colors.
        Horns: swept-back A &gt; ram curl H &gt; spiky K &gt; nubs h. Wings: bat M &gt; feathered F &gt; fin L &gt; tiny f.
        A dragon shows whichever of its two letters is higher in the chain, so a nubs-horned dragon must be hh, and two AK parents can still have a spiky (KK) baby 1 time in 4.</p>
      <p><strong>Glitter is recessive</strong>: only gg dragons sparkle. Two Gg parents have a 1 in 4 chance of a sparkly baby.</p>
      <p><strong>Color blends</strong> (incomplete dominance): pink P, blue B, butter Y → PP pink, BB blue, YY butter, BP lavender, PY peach, BY mint.</p>
      <p><strong>Personality</strong>: a baby starts at the average of its parents' traits from the day they joined the den, not their grown ones. Ultra-rare traits pass on 10% of the time.</p>
      <p><strong>DNA decoder</strong>: ${Object.entries(CODE).map(([a, c]) => `${a === '*' ? 'Z★' : a === '-' ? 'Z' : a === 'W' ? 'W chromosome' : a} = ${c}`).join(' · ')}</p>
    </div></details></section>`;

  // breeding preview + roll
  const info = document.getElementById('breedInfo');
  const pair = () => [ds.find(d => d.id === document.getElementById('mom').value), ds.find(d => d.id === document.getElementById('dad').value)];
  const drawInfo = async () => {
    const [m, f] = pair(), key = m.id + '|' + f.id;
    const top = TRAITS.map(t => t.k).reduce((a, k) => {
      const n = den.history.filter(h => h.k === 'tame' && h.d === today() && h.tr === k).length; return n > a[1] ? [k, n] : a; }, [null, 0])[0];
    const match = !!top && [mainTrait(m.traits), mainTrait(f.traits)].includes(top);
    const odds = offspringOdds(m.genes, f.genes);
    info.innerHTML = `${oddsHtml(breedChance(match), ['25% base', match && `+5% a parent is ${TR[top].n}, your #1 today`])}
      ${den.rested[key] === today() ? '<p class="small"><span class="tag warn">This pair is resting until tomorrow.</span></p>' : ''}
      <details class="small"><summary>What babies could look like</summary><ul class="facts">${Object.entries(odds).map(([g, o]) =>
        `<li><strong>${g}:</strong> ${Object.entries(o).filter(([, p]) => p).map(([v, p]) => `${p}% ${v}`).join(', ')}</li>`).join('')}</ul></details>`;
    document.getElementById('breed').disabled = den.rested[key] === today();
    return { m, f, key, chance: breedChance(match) };
  };
  if (info) {
    document.getElementById('mom').onchange = document.getElementById('dad').onchange = drawInfo;
    drawInfo();
    document.getElementById('breed').onclick = () => enqueue(async () => {
      const { m, f, key, chance } = await drawInfo();
      const dlg = modal(`<div class="dm-pair">${dragonSVG(m, { pose: 'heart' })}<span>♡</span>${dragonSVG(f, { pose: 'heart' })}</div><h3>${esc(dname(m))} + ${esc(dname(f))}</h3>
        ${oddsHtml(chance, [])}${DIE}<p class="row center"><button data-v="roll">Roll</button></p>`);
      const go = await choice(dlg);
      if (!go) return closeModal();
      const { roll, ok } = await rollDie(dlg, chance);
      den.history.push({ d: today(), k: 'breed', ok });
      if (ok) {
        m.points--; f.points--;
        const baby = makeBaby(m, f);
        await new Promise(r => setTimeout(r, 700));
        await askName(dlg, baby, 'An egg hatched! 🥚');
        den.dragons.push(baby);
      } else {
        den.rested[key] = today();
        dlg.querySelector('.row.center').outerHTML = `<p>Rolled ${roll}. No egg this time. They keep their points and rest until tomorrow.</p><p class="row center"><button data-v="ok">OK</button></p>`;
        await choice(dlg);
      }
      den.rested = Object.fromEntries(Object.entries(den.rested).filter(([, v]) => v === today()));
      closeModal();
      await saveDen(den, ok ? `Bred ${dname(m)} + ${dname(f)}` : 'Breeding missed');
      route();
    });
  }
  $view.querySelectorAll('[data-name]').forEach(b => b.onclick = () => enqueue(async () => {
    const d = den.dragons.find(x => x.id === b.dataset.name);
    await askName(modal(''), d, 'Name your dragon'); closeModal();
    if (d.name) { await saveDen(den, `Named ${d.name}`); route(); }
  }));
  startMeadow($view.querySelector('.meadow'), ds);
}

function startMeadow(el, ds) {
  const bodies = [...el.querySelectorAll('.md')];
  const byId = Object.fromEntries(ds.map(d => [d.id, d]));
  const place = (b, x, y) => {
    const old = parseFloat(b.style.left) || 0;
    if (x !== old) b.classList.toggle('flip', x > old);   // drawn facing left
    b.style.left = x + '%'; b.style.top = y + '%'; b.style.zIndex = Math.round(y);
  };
  const spot = () => [4 + Math.random() * 82, 40 + Math.random() * 42];
  const strike = (b, pose) => { b.dataset.pose = pose; b.querySelector('svg').outerHTML = dragonSVG(byId[b.dataset.id], { pose }); };
  const nap = (b, on) => { b.classList.toggle('nap', on); strike(b, on ? 'sleep' : 'stand'); };
  bodies.forEach(b => { place(b, ...spot()); b.onclick = () => document.getElementById('dc-' + b.dataset.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !bodies.length) return;
  const flash = (b, cls, ms = 2400) => { b.classList.add(cls); setTimeout(() => b.classList.remove(cls), ms); };
  const iv = setInterval(() => {
    if (!document.body.contains(el)) return clearInterval(iv);
    if (document.hidden) return;
    bodies.forEach(b => {
      const r = Math.random();
      if (b.classList.contains('nap')) { if (r < .3) nap(b, false); return; }
      if (r < .4) { strike(b, Math.random() < .25 ? 'fly' : 'stand'); place(b, ...spot()); flash(b, 'walk'); }
      else if (r < .5) nap(b, true);
      else if (r < .6) { strike(b, 'cheer'); flash(b, 'hop', 900); }
      else if (r < .75) strike(b, pick(['sit', 'wink', 'shy', 'wave']));
    });
    if (bodies.length > 1 && Math.random() < .3) {   // two of them play together
      const [a, c] = bodies.filter(b => !b.classList.contains('nap')).sort(() => Math.random() - .5);
      if (a && c) { place(c, Math.min(88, parseFloat(a.style.left) + 9), parseFloat(a.style.top)); a.classList.toggle('flip', true); c.classList.toggle('flip', false); strike(a, 'heart'); strike(c, pick(['wave', 'cheer'])); flash(a, 'play'); flash(c, 'play'); }
    }
  }, 3400);
}

// ---------- self-check (runs in demo mode; open the console) ----------
function dragonSelfTest() {
  const ok = (c, m) => console.assert(c, 'dragon self-test: ' + m);
  ok(tameChance({ effort: 1, close: 1, imp: 1 }) === 10, 'lowest task = 10%');
  ok(tameChance({ effort: 3, close: 3, imp: 3, project: true, match: true }) === 30, 'highest = 30%');
  ok(pointChance(1) === 14 && pointChance(20) === 30 && breedChance(true) === 30, 'point + breed odds cap at 30%');
  const gg = { c: ['P', 'P'], h: ['h', 'h'], f: ['f', 'f'], s: ['s', 's'], t: ['t', 't'], g: ['g', 'g'], z: ['*'] };
  const dad = { ...gg, c: ['B', 'B'], z: ['-', '-'] };
  for (let i = 0; i < 20; i++) {
    const kid = cross(gg, dad, 'F');
    ok(kid.g.join('') === 'gg' && pheno(kid, 'F').g === 'sparkly', 'gg x gg is always sparkly');
    ok(colorOf(kid.c)[0] === 'lavender', 'PP x BB is always lavender');
    ok(!hasStar(kid.z, 'F'), 'daughter gets dad\'s plain Z, so no star');
    ok(hasStar(cross(gg, { ...dad, z: ['*', '*'] }, 'M').z, 'M'), 'son of starred mom + double-starred dad has a star');
  }
  const o = offspringOdds({ ...gg, g: ['G', 'g'] }, { ...dad, g: ['G', 'g'] });
  ok(o.Glitter.sparkly === 25, 'Gg x Gg = 25% sparkly');
  const a = newDragon('seeker', 'x'), b = newDragon('builder', 'y'); a.sex = 'F'; b.sex = 'M';
  a.traits.seeker += 5;   // growth must not pass to babies
  const baby = makeBaby(a, b);
  ok(TRAITS.every(t => Math.abs(baby.born[t.k] - r1((a.born[t.k] + b.born[t.k]) / 2)) < .001), 'baby = average of adoption traits');
  ok(traitOf('Email Prof about the paper draft', null, { history: [] }) !== undefined, 'traitOf returns a trait');
  ok(traitOf('Viola practice', null, { history: [] }) === 'steady', 'viola -> Steady');
  console.log('dragon self-test done');
}
if (new URLSearchParams(location.search).has('demo')) addEventListener('load', dragonSelfTest);
