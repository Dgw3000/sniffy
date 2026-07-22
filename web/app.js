'use strict';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const STORAGE_KEY = 'sniffy-ranking-v1';

let peopleCount = 2;
let people = [];
let results = [];
let currentScreen = 'peopleScreen';
let rankingReturnScreen = 'peopleScreen';
let rankingPeriod = 'week';
let sequenceRunning = false;
let sequenceVersion = 0;
let resultsSaved = false;

const firstNames = ['Graf','Doktor','Baron','Captain','Professor','DJ','Sir','Lady','Agent','Kaiser','Prinz','General'];
const lastNames = ['Nasenberg','Puderzucker','Schniefowitz','Koksula','Staubinger','Rüsselmann','Schneesturm','Pulverfass','Knister','Linienhorst','Niesbert','Discopulver'];
const rankingJourneys = [
  ['vom Sofa bis zum Kühlschrank','ohne Zwischenstopp und mit Rückenwind.'],
  ['einmal quer durch Brandenburg','die Feldwege wurden großzügig mitgezählt.'],
  ['von Berlin nach München','der Maßstab wurde vorsichtshalber entfernt.'],
  ['von Sylt bis zur Zugspitze','die Deutsche Bahn war daran nicht beteiligt.'],
  ['einmal um den Äquator','die Kurvenlage bleibt wissenschaftlich ungeklärt.'],
  ['bis zum Mond','die Rückfahrt ist im Tarif nicht enthalten.'],
  ['am Mond vorbei bis zum Mars','die NASA hat den Vorgang nicht bestätigt.'],
  ['dreimal durch Bielefeld','obwohl weiterhin niemand beweisen kann, dass es existiert.'],
  ['einmal um den Saturnring','Parkplätze waren ausreichend vorhanden.'],
  ['bis ans Ende des bekannten Universums','Google Maps berechnet die Route noch.']
];

function show(id) {
  if (currentScreen === 'resultScreen' && id !== 'resultScreen') cancelSequence();
  $$('.screen').forEach(screen => screen.classList.remove('active'));
  const next = $('#' + id);
  if (next) next.classList.add('active');
  currentScreen = id;
  scrollTo(0, 0);
}

function setCount(value) {
  peopleCount = clamp(Number(value) || 1, 1, 8);
  $('#peopleValue').textContent = peopleCount;
}

function hash(value) {
  let h = 2166136261;
  for (const char of String(value)) {
    h ^= char.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function cap(value) {
  const text = String(value || '');
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
}

function formatCm(value) {
  return Number(value).toLocaleString('de-DE', {minimumFractionDigits: 1, maximumFractionDigits: 1}) + ' cm';
}

function localDateKey(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeName(name) {
  return String(name || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('de-DE');
}

function cleanName(name) {
  return String(name || '').trim().replace(/\s+/g, ' ').slice(0, 28);
}

function loadStore() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      knownNames: Array.isArray(parsed.knownNames) ? parsed.knownNames.filter(Boolean) : [],
      events: Array.isArray(parsed.events) ? parsed.events : []
    };
  } catch {
    return {knownNames: [], events: []};
  }
}

function saveStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function renderKnownNames() {
  const store = loadStore();
  $('#knownNames').innerHTML = store.knownNames
    .sort((a, b) => a.localeCompare(b, 'de'))
    .map(name => `<option value="${escapeHtml(name)}"></option>`)
    .join('');
}

function makeAlias(person, index) {
  const seed = hash(`${person.gender}|${person.weight}|${person.height}|${person.age}|${index}`);
  return `${firstNames[seed % firstNames.length]} ${lastNames[(seed >>> 8) % lastNames.length]}`;
}

function savedName(person) {
  return cleanName(person.saveFor) || person.alias;
}

function displayName(person) {
  return savedName(person);
}

function buildProfiles() {
  const previous = people;
  people = Array.from({length: peopleCount}, (_, index) => previous[index] || {
    saveFor: '', gender: 'divers', weight: 75, height: 175, age: 30
  });
  $('#profileCards').innerHTML = people.map((person, index) => `
    <article class="paper-card person-card">
      <div class="person-title"><span>PERSON ${index + 1}</span><b>Alias folgt später</b></div>
      <label>Geschlecht</label>
      <select data-i="${index}" data-key="gender">
        <option value="weiblich" ${person.gender === 'weiblich' ? 'selected' : ''}>Weiblich</option>
        <option value="männlich" ${person.gender === 'männlich' ? 'selected' : ''}>Männlich</option>
        <option value="divers" ${person.gender === 'divers' ? 'selected' : ''}>Divers / keine Angabe</option>
      </select>
      <div class="field-grid">
        <label>Gewicht<input data-i="${index}" data-key="weight" type="number" min="35" max="250" value="${person.weight}"><small>kg</small></label>
        <label>Größe<input data-i="${index}" data-key="height" type="number" min="120" max="230" value="${person.height}"><small>cm</small></label>
        <label>Alter<input data-i="${index}" data-key="age" type="number" min="18" max="99" value="${person.age}"><small>Jahre</small></label>
      </div>
    </article>`).join('');
}

function readProfiles() {
  $$('[data-key]').forEach(element => {
    const index = Number(element.dataset.i);
    const key = element.dataset.key;
    if (!people[index]) return;
    people[index][key] = ['weight','height','age'].includes(key) ? Number(element.value) : element.value.trim();
  });
  people = people.map((person, index) => ({...person, alias: makeAlias(person, index)}));
}

function renderReview() {
  renderKnownNames();
  $('#reviewList').innerHTML = people.map((person, index) => `
    <article class="paper-card review-card">
      <span>${index + 1}</span>
      <div>
        <h3 class="alias">${escapeHtml(person.alias)}</h3>
        <p>${cap(person.gender)} · ${person.weight} kg · ${person.height} cm · ${person.age} Jahre</p>
        <label class="save-for-field">Speichern für:
          <input data-save-i="${index}" list="knownNames" maxlength="28" autocomplete="off" value="${escapeHtml(person.saveFor || '')}" placeholder="z. B. Tobi">
        </label>
        <small class="alias-save-hint">Leer lassen = unter „${escapeHtml(person.alias)}“ als Alias speichern.</small>
      </div>
    </article>`).join('');
}

function readSaveForFields() {
  $$('[data-save-i]').forEach(input => {
    const index = Number(input.dataset.saveI);
    if (people[index]) people[index].saveFor = cleanName(input.value);
  });
}

function calculateResults() {
  resultsSaved = false;
  results = people.map((person, index) => {
    const seed = hash(`${person.saveFor}|${person.alias}|${person.weight}|${person.height}|${person.age}|${person.gender}`);
    const weightFactor = clamp((person.weight - 35) / 135, 0, 1);
    const heightFactor = clamp((person.height - 120) / 110, 0, 1);
    const ageArc = 1 - clamp(Math.abs(person.age - 32) / 75, 0, .72);
    const genderNudge = person.gender === 'weiblich' ? -.12 : person.gender === 'männlich' ? .12 : 0;
    const jitter = ((seed % 21) - 10) / 32;
    const centimeters = clamp(1.15 + weightFactor * 4.35 + heightFactor * 1.25 + ageArc * .95 + genderNudge + jitter, 1.0, 8.4);
    const cm = Math.round(centimeters * 10) / 10;
    const thickness = clamp(2.6 + weightFactor * 3.8 + ((seed >>> 5) % 8) / 10, 2.7, 7.4);
    const remark = cm >= 7 ? 'Schneeschieber mit Überbreite angefordert' : cm >= 5 ? 'kommunal auffällig' : cm >= 3 ? 'solide Mittelklasse' : 'mikroskopisch motiviert';
    return {...person, seed, cm, thickness, remark, index};
  });
}

function saveAllResultsToRanking() {
  if (!results.length || resultsSaved) return;
  const store = loadStore();
  const now = Date.now();

  for (const result of results) {
    const name = savedName(result);
    if (!store.knownNames.some(existing => normalizeName(existing) === normalizeName(name))) {
      store.knownNames.push(name);
    }
    store.events.push({
      name,
      key: normalizeName(name),
      alias: result.alias,
      cm: result.cm,
      ts: now,
      day: localDateKey(now)
    });
  }

  const cutoff = now - 400 * 24 * 60 * 60 * 1000;
  store.events = store.events.filter(event => Number(event.ts) >= cutoff).slice(-5000);
  saveStore(store);
  resultsSaved = true;
  renderKnownNames();
  updateSaveState();
}

function shovelerMarkup() {
  return `<div class="shoveler" aria-hidden="true"><i class="worker-head"></i><i class="worker-body"></i><i class="worker-arm a1"></i><i class="worker-arm a2"></i><i class="worker-leg l1"></i><i class="worker-leg l2"></i><i class="shovel-handle"></i><i class="shovel-blade"></i></div>`;
}

function renderResults() {
  const totalWeight = Math.round(results.reduce((sum, result) => sum + result.weight, 0));
  const totalCm = results.reduce((sum, result) => sum + result.cm, 0);
  $('#groupSummary').textContent = `${results.length} ${results.length === 1 ? 'Person' : 'Personen'} · ${formatCm(totalCm)} Gesamtunsinn · ${totalWeight} kg Teamgewicht`;
  $('#lineCountLabel').textContent = `${results.length} ${results.length === 1 ? 'Linie' : 'Linien'}`;
  $('#lineStage').style.height = `${clamp(260 + results.length * 38, 300, 565)}px`;
  $('#sequenceStatus').textContent = 'Alle Linien liegen bereit · Countdowns noch nicht gestartet';
  $('#animateBtn').textContent = 'COUNTDOWNS STARTEN';
  $('#animateBtn').disabled = false;
  $('#finishSaveBtn').disabled = false;
  $('#finishSaveBtn').textContent = 'FERTIG UND SPEICHERN';
  $('#saveStatus').textContent = 'Noch nichts gespeichert.';

  $('#powderLines').innerHTML = results.map((result, index) => `
    <div class="powder-row" data-row="${index}" style="--t:${result.thickness}mm">
      <div class="row-meta"><span>${index + 1} · ${escapeHtml(displayName(result))}</span><strong>${formatCm(result.cm)}</strong></div>
      <div class="line-lane">
        <div class="powder-line draw"></div>
        <div class="line-countdown" aria-live="polite"></div>
        ${shovelerMarkup()}
      </div>
    </div>`).join('');

  $('#resultCards').innerHTML = results.map((result, index) => {
    const storedAs = savedName(result);
    const title = result.saveFor
      ? `${escapeHtml(result.saveFor)} <span class="alias">aka ${escapeHtml(result.alias)}</span>`
      : escapeHtml(result.alias);
    return `<article class="paper-card result-person" data-result-card="${index}"><span>${index + 1}</span><div><h3>${title}</h3><p>${result.weight} kg · ${result.height} cm · ${result.age} Jahre</p><strong>${formatCm(result.cm)}</strong><small>${cap(result.remark)} – laut vollständig erfundener Sniffy-Mathematik.</small><span class="saved-badge pending-badge">WIRD GESPEICHERT ALS: ${escapeHtml(storedAs)}</span></div></article>`;
  }).join('');

  requestAnimationFrame(applyLineWidths);
}

function updateSaveState() {
  $('#finishSaveBtn').disabled = resultsSaved;
  $('#finishSaveBtn').textContent = resultsSaved ? 'GESPEICHERT ✓' : 'FERTIG UND SPEICHERN';
  $('#saveStatus').textContent = resultsSaved
    ? `${results.length} ${results.length === 1 ? 'Ergebnis wurde' : 'Ergebnisse wurden'} lokal addiert.`
    : 'Noch nichts gespeichert.';
  $$('#resultCards .saved-badge').forEach(badge => {
    badge.classList.toggle('pending-badge', !resultsSaved);
    if (resultsSaved) badge.textContent = '✓ IM RANKING ADDIERT';
  });
}

function applyLineWidths() {
  $$('#powderLines .powder-row').forEach((row, index) => {
    const lane = row.querySelector('.line-lane');
    const result = results[index];
    if (!lane || !result) return;
    const cssPixelsPerCm = 96 / 2.54;
    const desired = result.cm * cssPixelsPerCm;
    const width = Math.max(34, Math.min(desired, lane.clientWidth - 45));
    row.style.setProperty('--w', `${width}px`);
    row.style.setProperty('--travel', `${Math.max(12, width - 4)}px`);
  });
}

function resetSequence() {
  $$('#powderLines .powder-row').forEach(row => {
    row.classList.remove('active', 'done');
    const line = row.querySelector('.powder-line');
    const counter = row.querySelector('.line-countdown');
    const shoveler = row.querySelector('.shoveler');
    line.classList.remove('clearing');
    line.classList.add('draw');
    line.style.clipPath = '';
    counter.classList.remove('visible');
    counter.textContent = '';
    shoveler.classList.remove('run');
  });
  void $('#powderLines').offsetWidth;
}

function cancelSequence() {
  sequenceVersion += 1;
  sequenceRunning = false;
  const button = $('#animateBtn');
  if (button) button.disabled = false;
}

async function runLineSequence() {
  if (sequenceRunning || !results.length) return;
  const token = ++sequenceVersion;
  sequenceRunning = true;
  $('#animateBtn').disabled = true;
  $('#animateBtn').textContent = 'COUNTDOWNS LAUFEN …';
  applyLineWidths();
  resetSequence();
  const rows = $$('#powderLines .powder-row');

  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    const line = row.querySelector('.powder-line');
    const counter = row.querySelector('.line-countdown');
    const shoveler = row.querySelector('.shoveler');
    const result = results[index];

    row.classList.add('active');
    counter.classList.add('visible');

    for (const value of [5, 4, 3, 2, 1, 0]) {
      counter.textContent = value;
      $('#sequenceStatus').textContent = `${displayName(result)} · Countdown ${value}`;
      await sleep(value === 0 ? 400 : 1000);
      if (token !== sequenceVersion) return;
    }

    $('#sequenceStatus').textContent = `${displayName(result)} · Schneeschieber im Einsatz`;
    shoveler.classList.add('run');
    line.classList.add('clearing');
    await sleep(1500);
    if (token !== sequenceVersion) return;
    counter.classList.remove('visible');
    row.classList.remove('active');
    row.classList.add('done');
    await sleep(220);
    if (token !== sequenceVersion) return;
  }

  $('#sequenceStatus').textContent = 'Alle Linien beseitigt · Tatort besenrein';
  $('#animateBtn').disabled = false;
  $('#animateBtn').textContent = 'COUNTDOWNS NOCHMAL';
  sequenceRunning = false;
}

function periodBounds(period) {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (period === 'week') {
    const mondayOffset = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - mondayOffset);
  } else {
    start.setDate(1);
  }
  return {start: start.getTime(), end: Date.now()};
}

function aggregateRanking(period) {
  const store = loadStore();
  const bounds = periodBounds(period);
  const grouped = new Map();

  for (const event of store.events) {
    const timestamp = Number(event.ts);
    if (!Number.isFinite(timestamp) || timestamp < bounds.start || timestamp > bounds.end) continue;
    const key = event.key || normalizeName(event.name);
    if (!key) continue;
    if (!grouped.has(key)) grouped.set(key, {name: event.name, cm: 0, sessions: 0, days: new Set(), alias: event.alias || ''});
    const entry = grouped.get(key);
    entry.name = event.name || entry.name;
    entry.alias = event.alias || entry.alias;
    entry.cm += Number(event.cm) || 0;
    entry.sessions += 1;
    entry.days.add(event.day || localDateKey(timestamp));
  }

  return [...grouped.values()]
    .map(entry => ({...entry, cm: Math.round(entry.cm * 10) / 10, activeDays: entry.days.size}))
    .sort((a, b) => b.cm - a.cm || b.sessions - a.sessions || a.name.localeCompare(b.name, 'de'))
    .slice(0, 3);
}

function rankingJoke(entry, rank, period) {
  const periodText = period === 'week' ? 'diese Woche' : 'diesen Monat';
  const daysText = `${entry.activeDays} ${entry.activeDays === 1 ? 'aktivem Tag' : 'aktiven Tagen'}`;
  const randomSalt = Math.floor(Date.now() / 1000);
  const journey = rankingJourneys[(hash(`${entry.name}|${period}|${rank}|${randomSalt}`) + Math.round(entry.cm * 10)) % rankingJourneys.length];
  return `Im völlig erfundenen Sniffy-Maßstab bist du ${periodText} in ${daysText} schon ${journey[0]} gezogen – ${journey[1]}`;
}

function formatPeriodSubtitle(period) {
  const {start} = periodBounds(period);
  const formatter = new Intl.DateTimeFormat('de-DE', {day: '2-digit', month: '2-digit', year: 'numeric'});
  return `${formatter.format(new Date(start))} bis heute`;
}

function renderRanking() {
  const ranking = aggregateRanking(rankingPeriod);
  $('#weekTab').classList.toggle('active', rankingPeriod === 'week');
  $('#monthTab').classList.toggle('active', rankingPeriod === 'month');
  $('#periodSubtitle').textContent = formatPeriodSubtitle(rankingPeriod);

  if (!ranking.length) {
    $('#rankingList').innerHTML = '<div class="paper-card empty">Noch niemand hat in diesem Zeitraum Zentimeter gesammelt.</div>';
    return;
  }

  const medals = ['🥇', '🥈', '🥉'];
  $('#rankingList').innerHTML = ranking.map((entry, index) => `
    <article class="paper-card rank-card">
      <span class="rank-medal">${medals[index]}</span>
      <h3>${escapeHtml(entry.name)}</h3>
      <div class="rank-total"><strong>${formatCm(entry.cm)}</strong><span>GESAMT</span></div>
      <p class="rank-meta">${entry.sessions} ${entry.sessions === 1 ? 'Runde' : 'Runden'} · ${entry.activeDays} ${entry.activeDays === 1 ? 'aktiver Tag' : 'aktive Tage'}</p>
      <p class="rank-joke">${escapeHtml(rankingJoke(entry, index, rankingPeriod))}</p>
    </article>`).join('');
}

function openRanking() {
  if (currentScreen !== 'rankingScreen') rankingReturnScreen = currentScreen;
  renderRanking();
  show('rankingScreen');
}

async function shareResults() {
  if (!results.length) return;
  const text = `Sniffy-Runde: ${results.map(result => `${displayName(result)}: ${formatCm(result.cm)}`).join(' | ')}. Reine Satire, keine Mengen- oder Dosierungsangabe.`;
  try {
    if (window.AndroidShare && typeof window.AndroidShare.share === 'function') {
      window.AndroidShare.share(text);
    } else if (navigator.share) {
      await navigator.share({title: 'Sniffy', text});
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      alert('Ergebnis kopiert.');
    }
  } catch {}
}

$('#peopleDown').onclick = () => setCount(peopleCount - 1);
$('#peopleUp').onclick = () => setCount(peopleCount + 1);
$('#toProfiles').onclick = () => { buildProfiles(); show('profilesScreen'); };
$('#homeBtn').onclick = () => show('peopleScreen');
$$('[data-back]').forEach(button => button.onclick = () => show(button.dataset.back));

$('#profilesForm').onsubmit = event => {
  event.preventDefault();
  readProfiles();
  renderReview();
  show('reviewScreen');
};

$('#calculateBtn').onclick = () => {
  readSaveForFields();
  calculateResults();
  renderResults();
  show('resultScreen');
};

$('#animateBtn').onclick = runLineSequence;
$('#finishSaveBtn').onclick = saveAllResultsToRanking;
$('#againBtn').onclick = () => { cancelSequence(); people = []; results = []; resultsSaved = false; show('peopleScreen'); };
$('#shareBtn').onclick = shareResults;

$('#rankingBtn').onclick = openRanking;
$('#rankingBack').onclick = () => show(rankingReturnScreen || 'peopleScreen');
$('#weekTab').onclick = () => { rankingPeriod = 'week'; renderRanking(); };
$('#monthTab').onclick = () => { rankingPeriod = 'month'; renderRanking(); };
$('#clearRankingBtn').onclick = () => {
  if (!confirm('Alle lokal gespeicherten Namen, Aliase und Ranglistenwerte löschen?')) return;
  localStorage.removeItem(STORAGE_KEY);
  renderKnownNames();
  renderRanking();
};

const dialog = $('#aboutDialog');
$('#aboutBtn').onclick = () => dialog.showModal();
$('#closeAbout').onclick = $('#dialogOk').onclick = () => dialog.close();

window.addEventListener('resize', applyLineWidths);
renderKnownNames();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js');
