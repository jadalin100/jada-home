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
// 10 colors from 4 blending alleles (incomplete dominance)
const COLORS = { PP: ['pink', '#f6c3d6'], BB: ['blue', '#c6dcf4'], YY: ['butter', '#fbe0a0'], EE: ['moss', '#b3d4a4'], BP: ['lavender', '#d9c8f5'], PY: ['peach', '#f9cdb0'], BY: ['mint', '#c9ead8'],
  BE: ['sea glass', '#b7d9d6'], EP: ['oat', '#e6d8bf'], EY: ['lime', '#d9eaa6'] };
// wing-decoration color: 4 more blending alleles. name: [fill, rim, flower center]
const SECOND = { WW: ['white', '#ffffff', '#b9c9b2', '#fbe7a0'], PP: ['pink', '#fbcfe0', '#e79bb9', '#fff3c4'], BB: ['sky', '#cbe6fc', '#86b6e0', '#fff3c4'], YY: ['butter', '#fde9a6', '#d9b65a', '#ffffff'],
  BP: ['lavender', '#ddd0fa', '#a993e0', '#fff3c4'], PY: ['peach', '#fcd3b8', '#e3a07c', '#fff3c4'], PW: ['blush', '#fde6ee', '#e7a9c1', '#fff3c4'], BW: ['mist', '#e6f2fd', '#93bde3', '#fff3c4'],
  WY: ['cream', '#fff6d6', '#d8bf75', '#ffffff'], BY: ['mint', '#d3f0e0', '#86c4a2', '#fff3c4'] };
// al = alleles from most to least dominant; a = what each one looks like; dna = each allele's codon. Letters only need to be unique inside one gene.
const LOCI = [
  { k: 'h', n: 'Horns', al: ['A', 'H', 'K', 'X', 'R', 'J', 'U', 'h'], a: ['swept-back', 'crescent', 'twin', 'tall', 'branched', 'hooked', 'upright', 'stubby'], dna: ['CAA', 'CAT', 'CAG', 'CGA', 'CGT', 'CGG', 'CGC', 'CAC'] },
  { k: 'r', n: 'Frills', al: ['D', 'T', 'P', 'O', 'w'], a: ['double', 'triple', 'pointed', 'droopy', 'webbed'], dna: ['TTC', 'TTA', 'TTT', 'TCA', 'TTG'] },
  { k: 't', n: 'Tail tip', al: ['T', 'S', 'C', 'F', 'U', 't'], a: ['heart', 'spade', 'club', 'fins', 'curl', 'leaf'], dna: ['ACA', 'ACT', 'ACC', 'AAA', 'AAT', 'ACG'] },
  { k: 'p', n: 'Wing pattern', al: ['B', 'S', 'L', 'R', 'O', 'p'], a: ['blossoms', 'stardust', 'lace', 'pearls', 'ombre', 'plain'], dna: ['AGA', 'AGT', 'AGG', 'ATA', 'ATT', 'AGC'] },
  { k: 'g', n: 'Glitter', al: ['G', 'g'], a: ['no sparkle', 'sparkly'], dna: ['GGA', 'GGT'] },
  // codominance, like a roan cow: gold and pearl are equal, so one of each shows both as stripes
  { k: 'k', n: 'Horn color', al: ['G', 'P', 'n'], a: ['gold', 'pearl', 'plain'], dna: ['GAG', 'GAC', 'GTA'], show: p => p.includes('G') && p.includes('P') ? 'roan' : p.includes('G') ? 'gold' : p.includes('P') ? 'pearl' : 'plain' },
  { k: 'o', n: 'Ghost', al: ['O', 'o'], a: ['colored', 'ghost'], dna: ['GAA', 'GAT'] },   // epistasis: oo hides the color genes
];
const CODE = { P: 'GCA', B: 'GCT', Y: 'GCG', E: 'GCC', '*': 'TAC', '-': 'TAT', W: 'TGG' };   // body color, star, W chromosome
const CODE2 = { W: 'CTA', P: 'CTT', B: 'CTG', Y: 'CTC' };   // wing-decoration color
// the ultra-rare traits each come with their own body color, which wins over the color genes
const RARE_COLOR = { Starwish: 'galaxy', Moonglow: 'pearl', Hearth: 'gold', Phoenix: 'sunset', Rainbell: 'opal' };
const colorOf = c => COLORS[[...c].sort().join('')];
const secondOf = w => SECOND[[...w].sort().join('')];
const rank = (L, x) => L.al.indexOf(x);
const sortPair = (L, pair) => [...pair].sort((x, y) => rank(L, x) - rank(L, y));
const showOf = (L, pair) => L.show ? L.show(pair) : L.a[rank(L, sortPair(L, pair)[0])];
const codon = (L, x) => L.dna[rank(L, x)];
const hasStar = (z, sex) => sex === 'F' ? z[0] === '*' : z.every(a => a === '*');
function pheno(g, sex) {
  const o = { color: colorOf(g.c), second: secondOf(g.w), star: hasStar(g.z, sex) };
  for (const L of LOCI) o[L.k] = showOf(L, g[L.k]);
  return o;
}
function randomGenes(sex) {
  const two = xs => [pick(xs), pick(xs)], g = { c: two('PBYE'), w: two('WPBY') };
  for (const L of LOCI) g[L.k] = two(L.k === 'g' ? 'GGGg' : L.k === 'o' ? 'OOOo' : L.k === 'k' ? 'GPnn' : L.al);
  g.z = (sex === 'F' ? [0] : [0, 0]).map(() => Math.random() < .3 ? '*' : '-');
  return g;
}
function cross(mom, dad, sex) {   // mom is ZW, dad is ZZ
  const g = {};
  for (const k of ['c', 'w', ...LOCI.map(L => L.k)]) g[k] = [pick(mom[k]), pick(dad[k])];
  g.z = sex === 'F' ? [pick(dad.z)] : [pick(dad.z), mom.z[0]];   // daughters get dad's Z + mom's W
  return g;
}
const genotype = (g, sex) => [[...g.c].sort().join(''), [...g.w].sort().join('').toLowerCase(), ...LOCI.map(L => sortPair(L, g[L.k]).join('')),
  sex === 'F' ? `Z${g.z[0] === '*' ? '*' : ''}W` : g.z.map(a => 'Z' + (a === '*' ? '*' : '')).sort().join('')].join(' ');
const sequence = (g, sex) => [g.c.map(a => CODE[a]).join(''), g.w.map(a => CODE2[a]).join(''), ...LOCI.map(L => g[L.k].map(a => codon(L, a)).join('')),
  (sex === 'F' ? [g.z[0], 'W'] : g.z).map(a => CODE[a]).join('')].join(' ');
// exact offspring odds, Punnett-square style
function offspringOdds(mom, dad) {
  const out = {};
  const tally = (k, f) => { const n = {}; for (const a of mom[k]) for (const b of dad[k]) { const v = f([a, b]); n[v] = (n[v] || 0) + 25; } return n; };
  out.Color = tally('c', p => colorOf(p)[0]);
  out['Wing color'] = tally('w', p => secondOf(p)[0]);
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
const FIXED_COLOR = { steady: 'E', leader: 'Y', original: 'P' };   // Steady dragons always come out moss green, Leaders butter, Originals pink
const STEADY_GREEN = (g, main) => FIXED_COLOR[main] ? { ...g, c: [FIXED_COLOR[main], FIXED_COLOR[main]] } : g;
const babyBorn = (mom, dad) => Object.fromEntries(TRAITS.map(t => [t.k, r1((mom.born[t.k] + dad.born[t.k]) / 2)]));   // parents' traits at adoption
function newDragon(trait, task, rare) {
  const sex = Math.random() < .5 ? 'F' : 'M';
  const born = Object.fromEntries(TRAITS.map(t => [t.k, r1(t.k === trait ? 6 + Math.random() * 2 : 1 + Math.random() * 4)]));
  return { id: uid(), name: '', sex, genes: STEADY_GREEN(randomGenes(sex), trait), born, traits: { ...born }, rare, hatched: today(), from: task, gen: 1, points: 0, visits: [], ...facts(trait, task) };
}
function makeBaby(mom, dad) {
  const sex = Math.random() < .5 ? 'F' : 'M';
  const born = babyBorn(mom, dad);
  const rares = [mom.rare, dad.rare].filter(Boolean);
  const rare = rares.length && Math.random() < .1 ? pick(rares) : null;
  return { id: uid(), name: '', sex, genes: STEADY_GREEN(cross(mom.genes, dad.genes, sex), mainTrait(born)), born, traits: { ...born }, rare, hatched: today(),
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
// Shapes from the approved mockup (dragon-mockup/gen.py, exported by export.py). Right side only where a part is mirrored. {X} = a color filled in per dragon.
const DPARTS = {"sil":"<path stroke=\"{OL}\" stroke-width=\"1.7\" stroke-linejoin=\"round\" stroke-linecap=\"round\" fill=\"{B}\" d=\"M60 30C74 30 84 36 86 45C88 53 88 59 86 63C84 66 81 68 78.5 69C80.5 76.77 82 90.59 80 100.95C79 105.27 72 107 60 107C48 107 41 105.27 40 100.95C38 90.59 39.5 76.77 41.5 69C39 68 36 66 34 63C32 59 32 53 34 45C36 36 46 30 60 30Z\"/>","chin":"<path fill=\"none\" stroke=\"{OL}\" stroke-width=\"1.6\" stroke-linecap=\"round\" d=\"M47 71.59Q60 76.77 73 71.59\"/>","belly":"<path fill=\"{BE}\" d=\"M60 77.64C53 77.64 50 85.41 50 92.32C50 99.23 54 103.55 60 103.55C66 103.55 70 99.23 70 92.32C70 85.41 67 77.64 60 77.64Z\"/>\n<path fill=\"none\" stroke=\"{OL}\" stroke-width=\"1\" stroke-linecap=\"round\" opacity=\".35\" d=\"M52 87.14q8 2.5 16 0M51 93.18q9 2.5 18 0M52 99.23q8 2.5 16 0\"/>","freck":"<g fill=\"{RI}\"><circle cx=\"76\" cy=\"88.86\" r=\"1.4\"/><circle cx=\"77.5\" cy=\"93.18\" r=\"1\"/><circle cx=\"75.5\" cy=\"96.64\" r=\"1.2\"/><g transform=\"translate(120 0) scale(-1 1)\"><circle cx=\"76\" cy=\"88.86\" r=\"1.4\"/><circle cx=\"77.5\" cy=\"93.18\" r=\"1\"/><circle cx=\"75.5\" cy=\"96.64\" r=\"1.2\"/></g></g>","feet":"<path stroke=\"{OL}\" stroke-width=\"1.7\" stroke-linejoin=\"round\" stroke-linecap=\"round\" fill=\"{B}\" d=\"M63 108.5C62 103.98 66 102.25 72 102.25C77 102.25 81 103.98 81 108.5C81 110.5 77 111.5 72 111.5C67 111.5 63 110.5 63 108.5Z\"/><path fill=\"none\" stroke=\"{OL}\" stroke-width=\"1.3\" stroke-linecap=\"round\" d=\"M69 107.5v3M74 107.5v3\"/><g transform=\"translate(120 0) scale(-1 1)\"><path stroke=\"{OL}\" stroke-width=\"1.7\" stroke-linejoin=\"round\" stroke-linecap=\"round\" fill=\"{B}\" d=\"M63 108.5C62 103.98 66 102.25 72 102.25C77 102.25 81 103.98 81 108.5C81 110.5 77 111.5 72 111.5C67 111.5 63 110.5 63 108.5Z\"/><path fill=\"none\" stroke=\"{OL}\" stroke-width=\"1.3\" stroke-linecap=\"round\" d=\"M69 107.5v3M74 107.5v3\"/></g>","paw":"<path fill=\"{B}\" d=\"M76.5 80.23C82 82.39 83.5 87.14 81.5 91.89C79.5 95.77 75 98.19 70.5 97.67C67.5 97.33 66.8 95.08 68.2 93.35C70.5 90.85 72 88 71.5 84.11Z\"/><path stroke=\"{OL}\" stroke-width=\"1.7\" stroke-linejoin=\"round\" stroke-linecap=\"round\" fill=\"none\" d=\"M76.5 80.23C82 82.39 83.5 87.14 81.5 91.89C79.5 95.77 75 98.19 70.5 97.67C67.5 97.33 66.8 95.08 68.2 93.35C70.2 91.28 71.6 89.04 71.7 86.45\"/><path fill=\"none\" stroke=\"{OL}\" stroke-width=\"1.2\" stroke-linecap=\"round\" d=\"M68.9 96.81l.7 -1.9M71.6 97.76l.3 -2M74.5 97.24l-.2 -2\"/>","crest":"<path stroke=\"{OL}\" stroke-width=\"1.5\" stroke-linejoin=\"round\" stroke-linecap=\"round\" fill=\"{RI}\" d=\"M54 32l2.5 -5 3.5 4 3.5 -4 2.5 5\"/>","snout":"<ellipse cx=\"60\" cy=\"64.5\" rx=\"9.5\" ry=\"5.6\" fill=\"{MZ}\"/>","blush":"<ellipse cx=\"83\" cy=\"62\" rx=\"4.2\" ry=\"2.6\" fill=\"{BL}\" opacity=\".75\"/><g transform=\"translate(120 0) scale(-1 1)\"><ellipse cx=\"83\" cy=\"62\" rx=\"4.2\" ry=\"2.6\" fill=\"{BL}\" opacity=\".75\"/></g>","nose":"<ellipse cx=\"62.6\" cy=\"62.6\" rx=\"1.1\" ry=\".85\" fill=\"{OL}\"/><g transform=\"translate(120 0) scale(-1 1)\"><ellipse cx=\"62.6\" cy=\"62.6\" rx=\"1.1\" ry=\".85\" fill=\"{OL}\"/></g>","freckFace":"<g fill=\"{RI}\"><circle cx=\"65.5\" cy=\"37.5\" r=\"1.1\"/><circle cx=\"69\" cy=\"40\" r=\"0.9\"/><circle cx=\"63\" cy=\"41\" r=\"0.8\"/><circle cx=\"86\" cy=\"64\" r=\"1\"/><circle cx=\"84\" cy=\"67\" r=\"0.8\"/><g transform=\"translate(120 0) scale(-1 1)\"><circle cx=\"65.5\" cy=\"37.5\" r=\"1.1\"/><circle cx=\"69\" cy=\"40\" r=\"0.9\"/><circle cx=\"63\" cy=\"41\" r=\"0.8\"/><circle cx=\"86\" cy=\"64\" r=\"1\"/><circle cx=\"84\" cy=\"67\" r=\"0.8\"/></g></g>","wing":{"plain":"<clipPath id=\"{CID}\"><path d=\"M74.5 76.51Q92.4 57.9 115.4 56.7Q108.5 64.3 112.6 76.86Q103.7 75.39 98.9 85.75Q89.2 81.18 80.5 85.93Z\"/></clipPath><path fill=\"{MB}\" d=\"M74.5 76.51Q92.4 57.9 115.4 56.7Q108.5 64.3 112.6 76.86Q103.7 75.39 98.9 85.75Q89.2 81.18 80.5 85.93Z\"/><g clip-path=\"url(#{CID})\"></g><path stroke=\"{OL}\" stroke-width=\"1.7\" stroke-linejoin=\"round\" stroke-linecap=\"round\" fill=\"none\" d=\"M74.5 76.51Q92.4 57.9 115.4 56.7Q108.5 64.3 112.6 76.86Q103.7 75.39 98.9 85.75Q89.2 81.18 80.5 85.93Z\"/><path fill=\"none\" stroke=\"{OL}\" stroke-width=\"1.3\" stroke-linecap=\"round\" opacity=\".6\" d=\"M93.4 62.6L114.4 57.5M93.4 62.6L111.9 76.51M93.4 62.6L98.7 85.24\"/>","ombre":"<clipPath id=\"{CID}\"><path d=\"M74.5 76.51Q92.4 57.9 115.4 56.7Q108.5 64.3 112.6 76.86Q103.7 75.39 98.9 85.75Q89.2 81.18 80.5 85.93Z\"/></clipPath><path fill=\"{MB}\" d=\"M74.5 76.51Q92.4 57.9 115.4 56.7Q108.5 64.3 112.6 76.86Q103.7 75.39 98.9 85.75Q89.2 81.18 80.5 85.93Z\"/><g clip-path=\"url(#{CID})\"><linearGradient id=\"g{CID}\" gradientUnits=\"userSpaceOnUse\" x1=\"81.1\" y1=\"78.4136\" x2=\"114.4\" y2=\"69.1727\"><stop offset=\".1\" stop-color=\"{MB}\" stop-opacity=\"0\"/><stop offset=\".75\" stop-color=\"{BE}\"/><stop offset=\"1\" stop-color=\"{AC}\"/></linearGradient><path fill=\"url(#g{CID})\" d=\"M74.5 76.51Q92.4 57.9 115.4 56.7Q108.5 64.3 112.6 76.86Q103.7 75.39 98.9 85.75Q89.2 81.18 80.5 85.93Z\"/></g><path stroke=\"{OL}\" stroke-width=\"1.7\" stroke-linejoin=\"round\" stroke-linecap=\"round\" fill=\"none\" d=\"M74.5 76.51Q92.4 57.9 115.4 56.7Q108.5 64.3 112.6 76.86Q103.7 75.39 98.9 85.75Q89.2 81.18 80.5 85.93Z\"/><path fill=\"none\" stroke=\"{OL}\" stroke-width=\"1.3\" stroke-linecap=\"round\" opacity=\".6\" d=\"M93.4 62.6L114.4 57.5M93.4 62.6L111.9 76.51M93.4 62.6L98.7 85.24\"/>","lace":"<clipPath id=\"{CID}\"><path d=\"M74.5 76.51Q92.4 57.9 115.4 56.7Q108.5 64.3 112.6 76.86Q103.7 75.39 98.9 85.75Q89.2 81.18 80.5 85.93Z\"/></clipPath><path fill=\"{MB}\" d=\"M74.5 76.51Q92.4 57.9 115.4 56.7Q108.5 64.3 112.6 76.86Q103.7 75.39 98.9 85.75Q89.2 81.18 80.5 85.93Z\"/><g clip-path=\"url(#{CID})\"><path fill=\"none\" stroke=\"{AC}\" stroke-width=\"1.1\" opacity=\".9\" d=\"M110.6 58L109 59.7L107.6 61.3L106.7 63.1L106.3 65L106.3 67L106.7 69.26L107.5 71.59L108.8 74.1L106.1 73.75L103.8 73.92L101.9 74.7L100.3 76.17L99.1 78.5L97.8 81.52L95.2 80.23L92.6 79.36L90.3 79.19L87.8 79.62L85.3 80.66\"/><circle cx=\"110.5\" cy=\"59.6\" r=\"1.35\" fill=\"{AC}\" stroke=\"{AD}\" stroke-width=\".45\"/><circle cx=\"108.6\" cy=\"63.2\" r=\"1.35\" fill=\"{AC}\" stroke=\"{AD}\" stroke-width=\".45\"/><circle cx=\"108.1\" cy=\"67.5\" r=\"1.35\" fill=\"{AC}\" stroke=\"{AD}\" stroke-width=\".45\"/><circle cx=\"109.0\" cy=\"72.02\" r=\"1.35\" fill=\"{AC}\" stroke=\"{AD}\" stroke-width=\".45\"/><circle cx=\"107.0\" cy=\"74.87\" r=\"1.35\" fill=\"{AC}\" stroke=\"{AD}\" stroke-width=\".45\"/><circle cx=\"103.0\" cy=\"76.08\" r=\"1.35\" fill=\"{AC}\" stroke=\"{AD}\" stroke-width=\".45\"/><circle cx=\"99.9\" cy=\"79.54\" r=\"1.35\" fill=\"{AC}\" stroke=\"{AD}\" stroke-width=\".45\"/><circle cx=\"94.8\" cy=\"81.61\" r=\"1.35\" fill=\"{AC}\" stroke=\"{AD}\" stroke-width=\".45\"/><circle cx=\"90.0\" cy=\"80.92\" r=\"1.35\" fill=\"{AC}\" stroke=\"{AD}\" stroke-width=\".45\"/><circle cx=\"85.1\" cy=\"81.95\" r=\"1.35\" fill=\"{AC}\" stroke=\"{AD}\" stroke-width=\".45\"/></g><path stroke=\"{OL}\" stroke-width=\"1.7\" stroke-linejoin=\"round\" stroke-linecap=\"round\" fill=\"none\" d=\"M74.5 76.51Q92.4 57.9 115.4 56.7Q108.5 64.3 112.6 76.86Q103.7 75.39 98.9 85.75Q89.2 81.18 80.5 85.93Z\"/><path fill=\"none\" stroke=\"{OL}\" stroke-width=\"1.3\" stroke-linecap=\"round\" opacity=\".6\" d=\"M93.4 62.6L114.4 57.5M93.4 62.6L111.9 76.51M93.4 62.6L98.7 85.24\"/>","stardust":"<clipPath id=\"{CID}\"><path d=\"M74.5 76.51Q92.4 57.9 115.4 56.7Q108.5 64.3 112.6 76.86Q103.7 75.39 98.9 85.75Q89.2 81.18 80.5 85.93Z\"/></clipPath><path fill=\"{MB}\" d=\"M74.5 76.51Q92.4 57.9 115.4 56.7Q108.5 64.3 112.6 76.86Q103.7 75.39 98.9 85.75Q89.2 81.18 80.5 85.93Z\"/><g clip-path=\"url(#{CID})\"><path transform=\"translate(102.6 65.5)\" d=\"M0 2.4Q0.6 5.4 3.6 6Q0.6 6.6 0 9.6Q-0.6 6.6 -3.6 6Q-0.6 5.4 0 2.4Z\" fill=\"{AC}\" stroke=\"{AD}\" stroke-width=\".45\" stroke-linejoin=\"round\"/><path transform=\"translate(89.3 76.95)\" d=\"M0 3.4Q0.6 5.4 2.6 6Q0.6 6.6 0 8.6Q-0.6 6.6 -2.6 6Q-0.6 5.4 0 3.4Z\" fill=\"{AC}\" stroke=\"{AD}\" stroke-width=\".45\" stroke-linejoin=\"round\"/><path transform=\"translate(110.5 73.06)\" d=\"M0 3.8Q0.6 5.4 2.2 6Q0.6 6.6 0 8.2Q-0.6 6.6 -2.2 6Q-0.6 5.4 0 3.8Z\" fill=\"{AC}\" stroke=\"{AD}\" stroke-width=\".45\" stroke-linejoin=\"round\"/><path transform=\"translate(98.5 79.45)\" d=\"M0 4.4Q0.6 5.4 1.6 6Q0.6 6.6 0 7.6Q-0.6 6.6 -1.6 6Q-0.6 5.4 0 4.4Z\" fill=\"{AC}\" stroke=\"{AD}\" stroke-width=\".45\" stroke-linejoin=\"round\"/><circle cx=\"97.7\" cy=\"71.16\" r=\".8\" fill=\"{AC}\" stroke=\"{AD}\" stroke-width=\".45\"/><circle cx=\"85.4\" cy=\"80.83\" r=\".8\" fill=\"{AC}\" stroke=\"{AD}\" stroke-width=\".45\"/><circle cx=\"111.7\" cy=\"62.4\" r=\".8\" fill=\"{AC}\" stroke=\"{AD}\" stroke-width=\".45\"/><circle cx=\"104.4\" cy=\"78.41\" r=\".8\" fill=\"{AC}\" stroke=\"{AD}\" stroke-width=\".45\"/><circle cx=\"92.0\" cy=\"67.8\" r=\".8\" fill=\"{AC}\" stroke=\"{AD}\" stroke-width=\".45\"/><circle cx=\"107.1\" cy=\"69.43\" r=\".8\" fill=\"{AC}\" stroke=\"{AD}\" stroke-width=\".45\"/></g><path stroke=\"{OL}\" stroke-width=\"1.7\" stroke-linejoin=\"round\" stroke-linecap=\"round\" fill=\"none\" d=\"M74.5 76.51Q92.4 57.9 115.4 56.7Q108.5 64.3 112.6 76.86Q103.7 75.39 98.9 85.75Q89.2 81.18 80.5 85.93Z\"/><path fill=\"none\" stroke=\"{OL}\" stroke-width=\"1.3\" stroke-linecap=\"round\" opacity=\".6\" d=\"M93.4 62.6L114.4 57.5M93.4 62.6L111.9 76.51M93.4 62.6L98.7 85.24\"/>","blossoms":"<clipPath id=\"{CID}\"><path d=\"M74.5 76.51Q92.4 57.9 115.4 56.7Q108.5 64.3 112.6 76.86Q103.7 75.39 98.9 85.75Q89.2 81.18 80.5 85.93Z\"/></clipPath><path fill=\"{MB}\" d=\"M74.5 76.51Q92.4 57.9 115.4 56.7Q108.5 64.3 112.6 76.86Q103.7 75.39 98.9 85.75Q89.2 81.18 80.5 85.93Z\"/><g clip-path=\"url(#{CID})\"><g transform=\"translate(101.9 68.1)\"><ellipse cx=\"0\" cy=\"2.64\" rx=\"2.3100000000000005\" ry=\"3.57\" fill=\"{AC}\" stroke=\"{AD}\" stroke-width=\".4\" transform=\"rotate(0)\"/><ellipse cx=\"0\" cy=\"2.64\" rx=\"2.3100000000000005\" ry=\"3.57\" fill=\"{AC}\" stroke=\"{AD}\" stroke-width=\".4\" transform=\"rotate(72)\"/><ellipse cx=\"0\" cy=\"2.64\" rx=\"2.3100000000000005\" ry=\"3.57\" fill=\"{AC}\" stroke=\"{AD}\" stroke-width=\".4\" transform=\"rotate(144)\"/><ellipse cx=\"0\" cy=\"2.64\" rx=\"2.3100000000000005\" ry=\"3.57\" fill=\"{AC}\" stroke=\"{AD}\" stroke-width=\".4\" transform=\"rotate(216)\"/><ellipse cx=\"0\" cy=\"2.64\" rx=\"2.3100000000000005\" ry=\"3.57\" fill=\"{AC}\" stroke=\"{AD}\" stroke-width=\".4\" transform=\"rotate(288)\"/><circle r=\"1.8900000000000001\" fill=\"{A2}\"/></g><g transform=\"translate(89.8 78.93)\"><ellipse cx=\"0\" cy=\"3.44\" rx=\"1.7600000000000002\" ry=\"2.72\" fill=\"{AC}\" stroke=\"{AD}\" stroke-width=\".4\" transform=\"rotate(0)\"/><ellipse cx=\"0\" cy=\"3.44\" rx=\"1.7600000000000002\" ry=\"2.72\" fill=\"{AC}\" stroke=\"{AD}\" stroke-width=\".4\" transform=\"rotate(72)\"/><ellipse cx=\"0\" cy=\"3.44\" rx=\"1.7600000000000002\" ry=\"2.72\" fill=\"{AC}\" stroke=\"{AD}\" stroke-width=\".4\" transform=\"rotate(144)\"/><ellipse cx=\"0\" cy=\"3.44\" rx=\"1.7600000000000002\" ry=\"2.72\" fill=\"{AC}\" stroke=\"{AD}\" stroke-width=\".4\" transform=\"rotate(216)\"/><ellipse cx=\"0\" cy=\"3.44\" rx=\"1.7600000000000002\" ry=\"2.72\" fill=\"{AC}\" stroke=\"{AD}\" stroke-width=\".4\" transform=\"rotate(288)\"/><circle r=\"1.4400000000000002\" fill=\"{A2}\"/></g><ellipse cx=\"111.4\" cy=\"71.85\" rx=\"1.2\" ry=\"1.9\" fill=\"{AC}\" stroke=\"{AD}\" stroke-width=\".4\" transform=\"rotate(30 111.4 66.3)\"/><ellipse cx=\"98.8\" cy=\"80.49\" rx=\"1.2\" ry=\"1.9\" fill=\"{AC}\" stroke=\"{AD}\" stroke-width=\".4\" transform=\"rotate(30 98.8 76.3)\"/><ellipse cx=\"93.7\" cy=\"69.78\" rx=\"1.2\" ry=\"1.9\" fill=\"{AC}\" stroke=\"{AD}\" stroke-width=\".4\" transform=\"rotate(30 93.7 63.9)\"/></g><path stroke=\"{OL}\" stroke-width=\"1.7\" stroke-linejoin=\"round\" stroke-linecap=\"round\" fill=\"none\" d=\"M74.5 76.51Q92.4 57.9 115.4 56.7Q108.5 64.3 112.6 76.86Q103.7 75.39 98.9 85.75Q89.2 81.18 80.5 85.93Z\"/><path fill=\"none\" stroke=\"{OL}\" stroke-width=\"1.3\" stroke-linecap=\"round\" opacity=\".6\" d=\"M93.4 62.6L114.4 57.5M93.4 62.6L111.9 76.51M93.4 62.6L98.7 85.24\"/>","pearls":"<clipPath id=\"{CID}\"><path d=\"M74.5 76.51Q92.4 57.9 115.4 56.7Q108.5 64.3 112.6 76.86Q103.7 75.39 98.9 85.75Q89.2 81.18 80.5 85.93Z\"/></clipPath><path fill=\"{MB}\" d=\"M74.5 76.51Q92.4 57.9 115.4 56.7Q108.5 64.3 112.6 76.86Q103.7 75.39 98.9 85.75Q89.2 81.18 80.5 85.93Z\"/><g clip-path=\"url(#{CID})\"><circle cx=\"99.8\" cy=\"61.4\" r=\"1.24\" fill=\"{AC}\" stroke=\"{AD}\" stroke-width=\".45\"/><circle cx=\"104.4\" cy=\"60.6\" r=\"1.64\" fill=\"{AC}\" stroke=\"{AD}\" stroke-width=\".45\"/><circle cx=\"109.0\" cy=\"59.7\" r=\"2.03\" fill=\"{AC}\" stroke=\"{AD}\" stroke-width=\".45\"/><circle cx=\"98.8\" cy=\"66.9\" r=\"1.24\" fill=\"{AC}\" stroke=\"{AD}\" stroke-width=\".45\"/><circle cx=\"102.7\" cy=\"69.95\" r=\"1.64\" fill=\"{AC}\" stroke=\"{AD}\" stroke-width=\".45\"/><circle cx=\"106.6\" cy=\"72.63\" r=\"2.03\" fill=\"{AC}\" stroke=\"{AD}\" stroke-width=\".45\"/><circle cx=\"95.0\" cy=\"69.95\" r=\"1.24\" fill=\"{AC}\" stroke=\"{AD}\" stroke-width=\".45\"/><circle cx=\"96.1\" cy=\"74.61\" r=\"1.64\" fill=\"{AC}\" stroke=\"{AD}\" stroke-width=\".45\"/><circle cx=\"97.3\" cy=\"79.28\" r=\"2.03\" fill=\"{AC}\" stroke=\"{AD}\" stroke-width=\".45\"/></g><path stroke=\"{OL}\" stroke-width=\"1.7\" stroke-linejoin=\"round\" stroke-linecap=\"round\" fill=\"none\" d=\"M74.5 76.51Q92.4 57.9 115.4 56.7Q108.5 64.3 112.6 76.86Q103.7 75.39 98.9 85.75Q89.2 81.18 80.5 85.93Z\"/><path fill=\"none\" stroke=\"{OL}\" stroke-width=\"1.3\" stroke-linecap=\"round\" opacity=\".6\" d=\"M93.4 62.6L114.4 57.5M93.4 62.6L111.9 76.51M93.4 62.6L98.7 85.24\"/>"},"tail":{"heart":"<path stroke=\"{OL}\" stroke-width=\"1.7\" stroke-linejoin=\"round\" stroke-linecap=\"round\" fill=\"{B}\" d=\"M70 100.09C80 105.27 95 107 104 102.68C109 100.52 112 97.5 111 93.18C110.5 91.45 107.5 91.45 107 93.18C106.5 96.64 103 98.36 96 98.8C88 99.66 79 97.5 72 93.18Z\"/>\n<path stroke=\"{OL}\" stroke-width=\"1.3\" stroke-linejoin=\"round\" stroke-linecap=\"round\" fill=\"{RI}\" d=\"M84 98.88l2.5 -4.5 2.5 5zM95 99.05l3 -4.5 2 5z\"/>\n<g transform=\"translate(113.2 83.16) rotate(25)\"><path stroke=\"{OL}\" stroke-width=\"1.6\" stroke-linejoin=\"round\" stroke-linecap=\"round\" fill=\"{RI}\" d=\"M0 11C-7 6 -7 -1 -2.5 -1 0 -1 0 2 0 2S0 -1 2.5 -1C7 -1 7 6 0 11Z\"/></g><g fill=\"{RI}\"><circle cx=\"84\" cy=\"102.25\" r=\"1.1\"/><circle cx=\"91\" cy=\"103.37\" r=\"1.3\"/><circle cx=\"98\" cy=\"102.68\" r=\"1\"/></g>","leaf":"<path stroke=\"{OL}\" stroke-width=\"1.7\" stroke-linejoin=\"round\" stroke-linecap=\"round\" fill=\"{B}\" d=\"M70 100.09C80 105.27 95 107 104 102.68C109 100.52 112 97.5 111 93.18C110.5 91.45 107.5 91.45 107 93.18C106.5 96.64 103 98.36 96 98.8C88 99.66 79 97.5 72 93.18Z\"/>\n<path stroke=\"{OL}\" stroke-width=\"1.3\" stroke-linejoin=\"round\" stroke-linecap=\"round\" fill=\"{RI}\" d=\"M84 98.88l2.5 -4.5 2.5 5zM95 99.05l3 -4.5 2 5z\"/>\n<g transform=\"translate(113.2 83.16) rotate(25)\"><path stroke=\"{OL}\" stroke-width=\"1.6\" stroke-linejoin=\"round\" stroke-linecap=\"round\" fill=\"{RI}\" d=\"M0 9Q8 1 0 -7Q-8 1 0 9Z\"/><path fill=\"none\" stroke=\"{OL}\" stroke-width=\"1\" stroke-linecap=\"round\" opacity=\".55\" d=\"M0 7V-4\"/></g><g fill=\"{RI}\"><circle cx=\"84\" cy=\"102.25\" r=\"1.1\"/><circle cx=\"91\" cy=\"103.37\" r=\"1.3\"/><circle cx=\"98\" cy=\"102.68\" r=\"1\"/></g>","spade":"<path stroke=\"{OL}\" stroke-width=\"1.7\" stroke-linejoin=\"round\" stroke-linecap=\"round\" fill=\"{B}\" d=\"M70 100.09C80 105.27 95 107 104 102.68C109 100.52 112 97.5 111 93.18C110.5 91.45 107.5 91.45 107 93.18C106.5 96.64 103 98.36 96 98.8C88 99.66 79 97.5 72 93.18Z\"/>\n<path stroke=\"{OL}\" stroke-width=\"1.3\" stroke-linejoin=\"round\" stroke-linecap=\"round\" fill=\"{RI}\" d=\"M84 98.88l2.5 -4.5 2.5 5zM95 99.05l3 -4.5 2 5z\"/>\n<g transform=\"translate(113.2 83.16) rotate(25)\"><path stroke=\"{OL}\" stroke-width=\"1.6\" stroke-linejoin=\"round\" stroke-linecap=\"round\" fill=\"{RI}\" d=\"M0 -6C5 0 8 4 4 8C2 9 1 8 0 10C-1 8 -2 9 -4 8C-8 4 -5 0 0 -6Z\"/></g><g fill=\"{RI}\"><circle cx=\"84\" cy=\"102.25\" r=\"1.1\"/><circle cx=\"91\" cy=\"103.37\" r=\"1.3\"/><circle cx=\"98\" cy=\"102.68\" r=\"1\"/></g>","club":"<path stroke=\"{OL}\" stroke-width=\"1.7\" stroke-linejoin=\"round\" stroke-linecap=\"round\" fill=\"{B}\" d=\"M70 100.09C80 105.27 95 107 104 102.68C109 100.52 112 97.5 111 93.18C110.5 91.45 107.5 91.45 107 93.18C106.5 96.64 103 98.36 96 98.8C88 99.66 79 97.5 72 93.18Z\"/>\n<path stroke=\"{OL}\" stroke-width=\"1.3\" stroke-linejoin=\"round\" stroke-linecap=\"round\" fill=\"{RI}\" d=\"M84 98.88l2.5 -4.5 2.5 5zM95 99.05l3 -4.5 2 5z\"/>\n<g transform=\"translate(113.2 83.16) rotate(25)\"><circle stroke=\"{OL}\" stroke-width=\"1.6\" stroke-linejoin=\"round\" stroke-linecap=\"round\" fill=\"{RI}\" cx=\"0\" cy=\"3\" r=\"5.5\"/><circle cx=\"-1.8\" cy=\"1\" r=\"1.4\" fill=\"#fff\" opacity=\".5\"/></g><g fill=\"{RI}\"><circle cx=\"84\" cy=\"102.25\" r=\"1.1\"/><circle cx=\"91\" cy=\"103.37\" r=\"1.3\"/><circle cx=\"98\" cy=\"102.68\" r=\"1\"/></g>","fins":"<path stroke=\"{OL}\" stroke-width=\"1.7\" stroke-linejoin=\"round\" stroke-linecap=\"round\" fill=\"{B}\" d=\"M70 100.09C80 105.27 95 107 104 102.68C109 100.52 112 97.5 111 93.18C110.5 91.45 107.5 91.45 107 93.18C106.5 96.64 103 98.36 96 98.8C88 99.66 79 97.5 72 93.18Z\"/>\n<path stroke=\"{OL}\" stroke-width=\"1.3\" stroke-linejoin=\"round\" stroke-linecap=\"round\" fill=\"{RI}\" d=\"M84 98.88l2.5 -4.5 2.5 5zM95 99.05l3 -4.5 2 5z\"/>\n<g transform=\"translate(113.2 83.16) rotate(25)\"><path stroke=\"{OL}\" stroke-width=\"1.5\" stroke-linejoin=\"round\" stroke-linecap=\"round\" fill=\"{MB}\" d=\"M0 8C-2 3 -8 0 -11 2C-9 5 -5 7 0 8Z\"/><path stroke=\"{OL}\" stroke-width=\"1.5\" stroke-linejoin=\"round\" stroke-linecap=\"round\" fill=\"{MB}\" d=\"M0 8C2 3 8 0 11 2C9 5 5 7 0 8Z\"/></g><g fill=\"{RI}\"><circle cx=\"84\" cy=\"102.25\" r=\"1.1\"/><circle cx=\"91\" cy=\"103.37\" r=\"1.3\"/><circle cx=\"98\" cy=\"102.68\" r=\"1\"/></g>","curl":"<path stroke=\"{OL}\" stroke-width=\"1.7\" stroke-linejoin=\"round\" stroke-linecap=\"round\" fill=\"{B}\" d=\"M70 100.09C80 105.27 95 107 104 102.68C109 100.52 112 97.5 111 93.18C110.5 91.45 107.5 91.45 107 93.18C106.5 96.64 103 98.36 96 98.8C88 99.66 79 97.5 72 93.18Z\"/>\n<path stroke=\"{OL}\" stroke-width=\"1.3\" stroke-linejoin=\"round\" stroke-linecap=\"round\" fill=\"{RI}\" d=\"M84 98.88l2.5 -4.5 2.5 5zM95 99.05l3 -4.5 2 5z\"/>\n<g transform=\"translate(113.2 83.16) rotate(25)\"><path fill=\"none\" stroke=\"{OL}\" stroke-width=\"6.4\" stroke-linecap=\"round\" d=\"M0 9C-1 1 8 -2 9 4C10 8 5 9 4.5 6\"/><path fill=\"none\" stroke=\"{B}\" stroke-width=\"3\" stroke-linecap=\"round\" d=\"M0 9C-1 1 8 -2 9 4C10 8 5 9 4.5 6\"/></g><g fill=\"{RI}\"><circle cx=\"84\" cy=\"102.25\" r=\"1.1\"/><circle cx=\"91\" cy=\"103.37\" r=\"1.3\"/><circle cx=\"98\" cy=\"102.68\" r=\"1\"/></g>"},"frill":{"double":"<path stroke=\"{OL}\" stroke-width=\"1.7\" stroke-linejoin=\"round\" stroke-linecap=\"round\" fill=\"{B}\" d=\"M85 47Q94 43 97 47Q95 51 88 52Q97 52 97 57Q94 61 86 59Z\"/>","triple":"<path stroke=\"{OL}\" stroke-width=\"1.7\" stroke-linejoin=\"round\" stroke-linecap=\"round\" fill=\"{B}\" d=\"M85 44Q93 39 96 42Q95 46 89 47Q97 47 97 51Q95 54 89 54Q96 56 95 60Q91 63 86 60Z\"/>","pointed":"<path stroke=\"{OL}\" stroke-width=\"1.7\" stroke-linejoin=\"round\" stroke-linecap=\"round\" fill=\"{B}\" d=\"M85 46Q93 43 100 42Q95 47 93 50Q98 52 100 55Q93 58 86 59Z\"/>","droopy":"<path stroke=\"{OL}\" stroke-width=\"1.7\" stroke-linejoin=\"round\" stroke-linecap=\"round\" fill=\"{B}\" d=\"M85 48Q95 47 99 56Q100 61 95 61Q90 61 86 58Z\"/>","webbed":"<path stroke=\"{OL}\" stroke-width=\"1.7\" stroke-linejoin=\"round\" stroke-linecap=\"round\" fill=\"{B}\" d=\"M85 45Q96 37 100 42Q101 52 86 60Z\"/><path fill=\"none\" stroke=\"{OL}\" stroke-width=\"1\" stroke-linecap=\"round\" opacity=\".5\" d=\"M86 53L98 42M86 55L99.5 48M86 57L97 53\"/>"},"horn":{"swept-back":"<path stroke=\"{OL}\" stroke-width=\"1.7\" stroke-linejoin=\"round\" stroke-linecap=\"round\" fill=\"{RI}\" d=\"M70 33C73 26 77 21 83 18C82 25 80 31 77 36Z\"/><path fill=\"none\" stroke=\"{OL}\" stroke-width=\"1\" stroke-linecap=\"round\" opacity=\".55\" d=\"M73 28l3.5 1M76 23l3 1\"/>","crescent":"<path stroke=\"{OL}\" stroke-width=\"1.7\" stroke-linejoin=\"round\" stroke-linecap=\"round\" fill=\"{RI}\" d=\"M70 34C70 26 75 20 84 17C80 21 79 24 80 28C80 31 79 34 77 36Z\"/><path fill=\"none\" stroke=\"{OL}\" stroke-width=\"1\" stroke-linecap=\"round\" opacity=\".55\" d=\"M71.5 28l4.5 .5M74 23l4 .5\"/>","twin":"<path stroke=\"{OL}\" stroke-width=\"1.7\" stroke-linejoin=\"round\" stroke-linecap=\"round\" fill=\"{RI}\" d=\"M77 37C80 32 84 30 89 29C88 33 85 37 81 39Z\"/><path stroke=\"{OL}\" stroke-width=\"1.7\" stroke-linejoin=\"round\" stroke-linecap=\"round\" fill=\"{RI}\" d=\"M70 33C72 27 76 23 81 20C80 26 78 31 76 35Z\"/><path fill=\"none\" stroke=\"{OL}\" stroke-width=\"1\" stroke-linecap=\"round\" opacity=\".55\" d=\"M72.5 28l3.5 1M81 33.5l2.5 1.5\"/>","tall":"<path stroke=\"{OL}\" stroke-width=\"1.7\" stroke-linejoin=\"round\" stroke-linecap=\"round\" fill=\"{RI}\" d=\"M70 33C72 24 76 16 81 10C81 19 79 28 77 36Z\"/><path fill=\"none\" stroke=\"{OL}\" stroke-width=\"1\" stroke-linecap=\"round\" opacity=\".55\" d=\"M72.5 28l4 .5M74.5 21l3.5 .5M77 15l2.5 .5\"/>","branched":"<path stroke=\"{OL}\" stroke-width=\"1.7\" stroke-linejoin=\"round\" stroke-linecap=\"round\" fill=\"{RI}\" d=\"M77 28C80 25 84 23 88 23C86 26 83 29 79 31Z\"/><path stroke=\"{OL}\" stroke-width=\"1.7\" stroke-linejoin=\"round\" stroke-linecap=\"round\" fill=\"{RI}\" d=\"M70 33C73 26 77 21 83 18C82 25 80 31 77 36Z\"/><path fill=\"none\" stroke=\"{OL}\" stroke-width=\"1\" stroke-linecap=\"round\" opacity=\".55\" d=\"M73 28l3.5 1\"/>","hooked":"<path stroke=\"{OL}\" stroke-width=\"1.7\" stroke-linejoin=\"round\" stroke-linecap=\"round\" fill=\"{RI}\" d=\"M70 33C72 24 78 18 86 18C88 18 89.5 20 88.5 22.5C85.5 21.5 82.5 22.5 80.5 26C79.5 30 78 33 77 36Z\"/><path fill=\"none\" stroke=\"{OL}\" stroke-width=\"1\" stroke-linecap=\"round\" opacity=\".55\" d=\"M72.5 28l3.5 1M76 22.5l3 1.5\"/>","upright":"<path stroke=\"{OL}\" stroke-width=\"1.7\" stroke-linejoin=\"round\" stroke-linecap=\"round\" fill=\"{RI}\" d=\"M70 34C70.5 26 72 20 74 15C76 20 77.5 27 77 35Z\"/><path fill=\"none\" stroke=\"{OL}\" stroke-width=\"1\" stroke-linecap=\"round\" opacity=\".55\" d=\"M71 28h5M72 22h3.5\"/>","stubby":"<path stroke=\"{OL}\" stroke-width=\"1.7\" stroke-linejoin=\"round\" stroke-linecap=\"round\" fill=\"{RI}\" d=\"M70 34C71 30 73 26 77 24C77.5 28 77.5 32 77 36Z\"/><path fill=\"none\" stroke=\"{OL}\" stroke-width=\"1\" stroke-linecap=\"round\" opacity=\".55\" d=\"M72 30l3.5 .5\"/>"},"stars":"<path d=\"M50 33l.8 2.2 2.2 .8 -2.2 .8 -.8 2.2 -.8 -2.2 -2.2 -.8 2.2 -.8z\" fill=\"#ffe9a3\"/><path d=\"M72 31l.8 2.2 2.2 .8 -2.2 .8 -.8 2.2 -.8 -2.2 -2.2 -.8 2.2 -.8z\" fill=\"#ffe9a3\"/><path d=\"M44 84.55l.8 2.2 2.2 .8 -2.2 .8 -.8 2.2 -.8 -2.2 -2.2 -.8 2.2 -.8z\" fill=\"#ffe9a3\"/><path d=\"M77 93.18l.8 2.2 2.2 .8 -2.2 .8 -.8 2.2 -.8 -2.2 -2.2 -.8 2.2 -.8z\" fill=\"#ffe9a3\"/><path d=\"M97 65l.8 2.2 2.2 .8 -2.2 .8 -.8 2.2 -.8 -2.2 -2.2 -.8 2.2 -.8z\" fill=\"#ffe9a3\"/><path d=\"M22 65l.8 2.2 2.2 .8 -2.2 .8 -.8 2.2 -.8 -2.2 -2.2 -.8 2.2 -.8z\" fill=\"#ffe9a3\"/><path d=\"M62 77.64l.8 2.2 2.2 .8 -2.2 .8 -.8 2.2 -.8 -2.2 -2.2 -.8 2.2 -.8z\" fill=\"#ffe9a3\"/>"};
const sat = (hex, k) => { const p = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)), m = (p[0] + p[1] + p[2]) / 3;
  return '#' + p.map(v => Math.max(0, Math.min(255, Math.round(m + (v - m) * k))).toString(16).padStart(2, '0')).join(''); };
const grad = (id, dir, stops) => `<linearGradient id="${id}" x1="0" y1="0" x2="${dir[0]}" y2="${dir[1]}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;
const LOOKS = {   // rare body colors: outline, belly, ridge, membrane, muzzle, gradient
  galaxy: { OL: '#1c1d47', BE: '#7a6fc4', RI: '#3b3a8a', MZ: '#3e3f96', wingGrad: true, g: [[0, 1], [[0, '#2c2d73'], [1, '#5b4aa8']]] },
  pearl: { OL: '#7d7391', BE: '#fffdf8', RI: '#e6dcf2', MB: '#f7f1ff', MZ: '#fbf6ff', g: [[1, 1], [[0, '#fdf6ff'], [.5, '#e9f3ff'], [1, '#fbe9f3']]] },
  gold: { OL: '#86622a', BE: '#fff3c9', RI: '#e5b955', MB: '#fbe6a6', MZ: '#fbe1a0', g: [[1, 1], [[0, '#ffe7a0'], [1, '#f0c35e']]] },
  sunset: { OL: '#8a4a3c', BE: '#fff0dc', RI: '#f39a86', MB: '#ffd6c2', MZ: '#ffc9b0', g: [[0, 1], [[0, '#ffb3a1'], [.55, '#ffc98f'], [1, '#f7a1c4']]] },
  opal: { OL: '#6f7a9a', BE: '#fffaf3', RI: '#c9b8f0', MZ: '#e6f4ff', wingGrad: true, g: [[1, 1], [[0, '#ffd1e3'], [.35, '#fff1b8'], [.65, '#c8f0dc'], [1, '#c9dcff']]] },
};
let DID = 0;
function dragonSVG(d, { pose = 'stand', hat = isBirthday(d) } = {}) {
  DRAG[d.id] = d;
  const P = pheno(d.genes, d.sex), id = 'd' + (++DID), look = LOOKS[RARE_COLOR[d.rare]];
  const ghost = P.o === 'ghost', c = ghost ? mix(P.color[1], '#ffffff', .8) : P.color[1], [, AC, AD, A2] = P.second;
  const v = look ? { B: `url(#b${id})`, MB: look.wingGrad ? `url(#b${id})` : look.MB, ...look }
    : { B: c, OL: ghost ? mix(sat(shade(P.color[1], -.55), 1.6), '#ffffff', .38) : sat(shade(c, -.55), 1.6), BE: mix(c, '#fffbe6', .75), RI: shade(c, -.1), MB: mix(c, '#ffffff', .4), MZ: mix(c, '#ffffff', .18) };
  Object.assign(v, { BL: '#f2a7a7', AC, AD, A2, CID: id + 'w' });
  const GOLD = '#f4d27c', PEARL = '#f8f2fb';   // horn colors; roan = both as stripes
  v.HF = { gold: GOLD, pearl: PEARL, roan: `url(#r${id})`, plain: v.RI }[P.k];
  const f = s => s.replace(/\{(\w+)\}/g, (m, k) => v[k] ?? m);
  const flip = s => `<g transform="translate(120 0) scale(-1 1)">${s}</g>`, both = s => s + flip(s);
  const eye = '#33281f', S = (w = 1.7) => `stroke="${v.OL}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

  // a raised front paw: the same curved paw, swung up around where it joins the body (that edge stays open, so it blends in like the resting paw)
  const lift1 = deg => `<g transform="rotate(${deg} 74 83)">${f(DPARTS.paw)}</g>`;
  const up = { wave: lift1(186), cheer: lift1(206), shy: lift1(183) }[pose];
  const paws = !up ? f(DPARTS.paw) + flip(f(DPARTS.paw)) : pose === 'wave' ? up + flip(f(DPARTS.paw)) : up + flip(up);   // wave raises only the right paw
  const wingTurn = { fly: -18, cheer: -6, sleep: 10 }[pose] || 0;
  const wings = both(`<g transform="rotate(${wingTurn} 75 78.5)">${f(DPARTS.wing[P.p])}</g>`);
  const tail = pose === 'egg' ? '' : pose === 'sit' ? flip(f(DPARTS.tail[P.t])) : f(DPARTS.tail[P.t]);
  const lift = { fly: -8, sit: 1 }[pose] || 0;

  const open = (dx = 0, ry = 6.6) => [47, 73].map(x => `<ellipse cx="${x + dx}" cy="53" rx="5.6" ry="${ry}" fill="${eye}"/><circle cx="${x + dx + 2}" cy="50.2" r="2.2" fill="#fff"/><circle cx="${x + dx - 1.6}" cy="56" r=".9" fill="#fff"/>`);
  const arc = (x, up) => `<path d="M${x - 5} ${up ? 54.5 : 52.5}q5 ${up ? -6.5 : 4.5} 10 0" fill="none" stroke="${eye}" stroke-width="2.3" stroke-linecap="round"/>`;
  const eyes = { cheer: arc(47, 1) + arc(73, 1), heart: arc(47, 1) + arc(73, 1), sleep: arc(47, 0) + arc(73, 0), shy: open(-1.5).join(''),
    wink: open()[0] + arc(73, 1), egg: open(0, 7.2).join('') }[pose] || open().join('');
  const mouth = { wave: 'open', cheer: 'open', egg: 'open', sleep: 'o', wink: 'tongue' }[pose] || 'smile';
  const mouthSvg = mouth === 'open' ? `<path d="M56 66q4 6.5 8 0Z" fill="#e98a9c" stroke="${eye}" stroke-width="1.4" stroke-linejoin="round"/>`
    : mouth === 'o' ? `<circle cx="60" cy="67.8" r="1.3" fill="none" stroke="${eye}" stroke-width="1.2"/>`
    : `<path d="M56 66.5q4 3.2 8 0" fill="none" stroke="${v.OL}" stroke-width="1.6" stroke-linecap="round"/>${mouth === 'tongue' ? '<path d="M60.5 68.1q1.6 3.6 3.2 0" fill="#f29aab"/>' : ''}`;
  const face = `${f(DPARTS.snout)}${eyes}${pose === 'shy' ? f(DPARTS.blush).replace(/opacity="\.75"/g, 'opacity="1"') + both('<path d="M80.5 59.5l1.5 2M83.5 59l1.5 2" stroke="#e07a9a" stroke-width="1" stroke-linecap="round"/>') : f(DPARTS.blush)}
    ${f(DPARTS.nose)}${mouthSvg}${f(DPARTS.freckFace)}
    ${P.star ? '<path d="M60 35.5l1 2.1 2.3.3-1.7 1.6.4 2.3-2-1.1-2 1.1.4-2.3-1.7-1.6 2.3-.3z" fill="#fff6b0" stroke="#e8c860" stroke-width=".6"/>' : ''}
    ${hat ? '<path d="M51 31 60 7 69 31Z" fill="#f4a6b6" stroke="#e07a9a" stroke-width="1.2" stroke-linejoin="round"/><circle cx="60" cy="7" r="3" fill="#fbe0a0"/>' : ''}`;
  const shell = pose === 'egg' ? `<path d="M30 88 37 82 44 89 52 81 60 89 68 81 76 89 83 82 90 88Q93 116 60 117 27 116 30 88Z" fill="#fffaf2" ${S()}/>
    <circle cx="44" cy="102" r="2.5" fill="${c}" opacity=".7"/><circle cx="74" cy="107" r="3" fill="${c}" opacity=".7"/><circle cx="67" cy="98" r="1.8" fill="${c}" opacity=".7"/>` : '';
  const prop = pose === 'heart' ? `<path d="M60 99C50.5 93 50.5 84.5 55.3 84.5 58 84.5 60 87 60 87S62 84.5 64.7 84.5C69.5 84.5 69.5 93 60 99Z" fill="#f48aa5" ${S(1.6)}/>` : '';
  const extra = {
    sleep: `<text x="88" y="32" font-size="9" fill="${v.OL}" font-family="Figtree,sans-serif">z</text><text x="95" y="23" font-size="12" fill="${v.OL}" font-family="Figtree,sans-serif">Z</text>`,
    fly: `<path d="M48 117q4-3 8 0M64 117q4-3 8 0" fill="none" stroke="${v.OL}" stroke-width="1.4" opacity=".5" stroke-linecap="round"/>`,
    wave: `<path d="M99 56q3 4 0 8M103 53q4 6 0 12" fill="none" stroke="${v.OL}" stroke-width="1.4" opacity=".5" stroke-linecap="round"/>`,
    cheer: `<g fill="#ffd96b">${[[24, 44], [96, 40], [20, 64]].map(([x, y]) => `<path d="M${x} ${y - 4}l1 3 3 1-3 1-1 3-1-3-3-1 3-1z"/>`).join('')}</g>`,
  }[pose] || '';
  const glit = P.g === 'sparkly' ? `<g class="glit" fill="#ffe27a" stroke="#fff" stroke-width=".6">${[[18, 60], [102, 30], [100, 84], [22, 100], [64, 8]].map(([x, y]) => `<path d="M${x} ${y - 4}l1 3 3 1-3 1-1 3-1-3-3-1 3-1z"/>`).join('')}</g>` : '';
  const aura = d.rare ? `<ellipse class="aura" cx="60" cy="64" rx="54" ry="52" fill="${RARE[d.rare][1]}" opacity=".35"/>` : '';
  const defs = `<defs>${look ? grad('b' + id, ...look.g) : ''}${P.k === 'roan' ? `<pattern id="r${id}" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(35)"><rect width="4" height="4" fill="${PEARL}"/><rect width="2" height="4" fill="${GOLD}"/></pattern>` : ''}</defs>`;
  const body = `${wings}${tail}${both(f(DPARTS.frill[P.r]))}${both(f(DPARTS.horn[P.h].replaceAll('fill="{RI}"', 'fill="{HF}"')))}${f(DPARTS.sil)}${f(DPARTS.chin)}${f(DPARTS.belly)}${f(DPARTS.freck)}
    ${pose === 'egg' ? '' : f(DPARTS.feet)}${shell}${prop}${paws}${f(DPARTS.crest)}${face}${RARE_COLOR[d.rare] === 'galaxy' ? DPARTS.stars : ''}`;
  return `<svg viewBox="0 0 120 120" class="dragon" aria-hidden="true">${defs}${aura}<ellipse cx="60" cy="113" rx="${pose === 'fly' ? 14 : 24}" ry="3" fill="#000" opacity=".07"/>
    <g transform="translate(0 ${lift})">${body}</g>${extra}${glit}</svg>`;
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
const loadDen = async () => {
  const den = { dragons: [], tamed: {}, rested: {}, history: [], ...(await readJSON('dragons/den.json', {})) };
  for (const d of den.dragons) { const r = randomGenes(d.sex); for (const k in r) d.genes[k] ||= r[k]; }   // a gene added later gets a random value
  return den;
};
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
  let box = document.querySelector('.visits');
  if (!box) { box = document.createElement('div'); box.className = 'visits'; document.body.append(box); }
  const el = document.createElement('div');
  el.className = 'visit card'; el.setAttribute('role', 'status');
  el.innerHTML = `<div class="v-pic" data-dragon="${d.id}">${dragonSVG(d, { pose: 'wave' })}</div><div><div class="kind">${esc(dname(d))} came to visit · ${stage(d)}</div>
    <p>${esc(msg)}</p><p class="small muted">${TR[trait].n} +0.1 → ${d.traits[trait]}</p></div><button class="x" aria-label="Close">×</button>`;
  el.querySelector('.x').onclick = () => el.remove();
  box.append(el);
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
          <tr><td>Color</td><td>${[...d.genes.c].sort().join('')}</td><td>${d.genes.c.map(a => CODE[a]).join('')}</td><td>${RARE_COLOR[d.rare] ? `${RARE_COLOR[d.rare]} <span class="muted">(${d.rare} color; genes say ${p.color[0]})</span>` : p.o === 'ghost' ? `ghost <span class="muted">(hiding ${p.color[0]})</span>` : p.color[0]}</td></tr>
          <tr><td>Wing color</td><td>${[...d.genes.w].sort().join('').toLowerCase()}</td><td>${d.genes.w.map(a => CODE2[a]).join('')}</td><td>${p.second[0]}</td></tr>
          ${LOCI.map(L => { const g = sortPair(L, d.genes[L.k]); return `<tr><td>${L.n}</td><td>${g.join('')}</td><td>${d.genes[L.k].map(a => codon(L, a)).join('')}</td>
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
      <p><strong>Horns, frills, tail tips, and wing patterns are dominance chains</strong>, like rabbit coat colors. A dragon shows whichever of its two letters is higher in the chain.
        ${LOCI.filter(L => !'gok'.includes(L.k)).map(L => `${L.n}: ${L.al.map((a, i) => `${L.a[i]} ${a}`).join(' &gt; ')}.`).join(' ')}
        So a stubby-horned dragon must be hh, and two AK parents can still have a twin-horned (KK) baby 1 time in 4.</p>
      <p><strong>Horn color is codominant</strong>, like a roan cow: gold G and pearl P are equal, so a GP dragon shows both as striped (roan) horns. Plain n is recessive to both.</p>
      <p><strong>Ghost hides color</strong> (epistasis, like albinism): an oo dragon is pale no matter what its color genes say. It still carries those colors and passes them to its babies. Ultra-rare colors still win over ghost.</p>
      <p><strong>Glitter is recessive</strong>: only gg dragons sparkle. Two Gg parents have a 1 in 4 chance of a sparkly baby.</p>
      <p><strong>Color blends</strong> (incomplete dominance): pink P, blue B, butter Y, green E → PP pink, BB blue, YY butter, EE moss, BP lavender, PY peach, BY mint, BE sea glass, EP oat, EY lime. Steady dragons are always EE, so they always come out moss, and Leaders are always YY, so they always come out butter.</p>
      <p><strong>Wing color blends too</strong> and colors the wing decorations: white W, pink P, sky B, butter Y → ${Object.entries(SECOND).map(([k, x]) => `${k.toLowerCase()} ${x[0]}`).join(', ')}.</p>
      <p><strong>Ultra-rare colors</strong>: each ultra-rare trait brings its own body color, which beats the color genes (even Steady green): ${Object.entries(RARE_COLOR).map(([r, c]) => `${r} = ${c}`).join(', ')}. Every dragon has freckles.</p>
      <p><strong>Personality</strong>: a baby starts at the average of its parents' traits from the day they joined the den, not their grown ones. Ultra-rare traits pass on 10% of the time.</p>
      <p><strong>DNA decoder</strong>: color ${Object.entries(CODE).map(([a, c]) => `${a === '*' ? 'Z★' : a === '-' ? 'Z' : a === 'W' ? 'W chromosome' : a} = ${c}`).join(' · ')}
        · wing color ${Object.entries(CODE2).map(([a, c]) => `${a.toLowerCase()} = ${c}`).join(' · ')}
        ${LOCI.map(L => `· ${L.n.toLowerCase()} ${L.al.map((a, i) => `${a} = ${L.dna[i]}`).join(' · ')}`).join(' ')}</p>
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
    if (mainTrait(babyBorn(m, f)) === 'steady') odds.Color = { moss: 100 };   // baby will be Steady, so always green
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
  const gg = { c: ['P', 'P'], w: ['W', 'W'], h: ['h', 'h'], r: ['w', 'w'], t: ['t', 't'], p: ['p', 'p'], g: ['g', 'g'], o: ['O', 'o'], k: ['n', 'n'], z: ['*'] };
  const dad = { ...gg, c: ['B', 'B'], z: ['-', '-'] };
  for (let i = 0; i < 20; i++) {
    const kid = cross(gg, dad, 'F');
    ok(kid.g.join('') === 'gg' && pheno(kid, 'F').g === 'sparkly', 'gg x gg is always sparkly');
    ok(colorOf(kid.c)[0] === 'lavender', 'PP x BB is always lavender');
    ok(colorOf(['E', 'E'])[0] === 'moss' && colorOf(['Y', 'E'])[0] === 'lime', 'EE is moss, EY is lime');
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
  ok(colorOf(newDragon('steady', 'x').genes.c)[0] === 'moss', 'wild Steady dragon is moss');
  ok(colorOf(newDragon('original', 'x').genes.c)[0] === 'pink', 'wild Original dragon is pink');
  const s1 = newDragon('steady', 'x'), s2 = newDragon('steady', 'y'); s1.sex = 'F'; s2.sex = 'M';
  ok(colorOf(makeBaby(s1, s2).genes.c)[0] === 'moss', 'Steady x Steady baby is moss');
  ok(pheno({ ...gg, k: ['G', 'P'] }, 'F').k === 'roan' && pheno({ ...gg, k: ['n', 'G'] }, 'F').k === 'gold' && pheno({ ...gg, k: ['n', 'n'] }, 'F').k === 'plain', 'horn color is codominant');
  ok(offspringOdds({ ...gg, k: ['G', 'G'] }, { ...dad, k: ['P', 'P'] })['Horn color'].roan === 100, 'GG x PP = all roan');
  ok(dragonSVG({ ...newDragon('seeker', 'x'), genes: { ...gg, k: ['G', 'P'] } }).includes('<pattern'), 'roan horns draw stripes');
  ok(pheno(gg, 'F').o === 'colored' && pheno({ ...gg, o: ['o', 'o'] }, 'F').o === 'ghost', 'only oo is ghost');
  ok(offspringOdds({ ...gg, o: ['O', 'o'] }, { ...dad, o: ['O', 'o'] }).Ghost.ghost === 25, 'Oo x Oo = 25% ghost');
  ok(dragonSVG({ ...newDragon('seeker', 'x'), genes: { ...gg, o: ['o', 'o'] } }).includes(mix(colorOf(gg.c)[1], '#ffffff', .8)), 'ghost dragon draws pale');
  ok(secondOf(['P', 'W'])[0] === 'blush' && secondOf(['Y', 'B'])[0] === 'mint', 'wing colors blend');
  ok(pheno(gg, 'F').h === 'stubby' && pheno({ ...gg, h: ['h', 'A'] }, 'F').h === 'swept-back', 'horn dominance chain');
  ok(LOCI.every(L => L.al.length === L.a.length && L.al.length === L.dna.length && new Set(L.al).size === L.al.length), 'every gene has a look + codon per allele');
  const all = [...Object.values(CODE), ...Object.values(CODE2), ...LOCI.flatMap(L => L.dna)];
  ok(new Set(all).size === all.length, 'every codon is unique');
  for (const pose of POSES) {
    const svg = dragonSVG({ ...newDragon('seeker', 'x'), rare: pose === 'egg' ? 'Starwish' : null }, { pose });
    ok(!/\{[A-Z]\w*\}|undefined|NaN/.test(svg), `pose ${pose} draws with every color filled in`);
  }
  console.log('dragon self-test done');
}
if (new URLSearchParams(location.search).has('demo')) addEventListener('load', dragonSelfTest);
