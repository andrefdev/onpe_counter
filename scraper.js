const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'public', 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
const BASE_URL = 'https://resultadoelectoral.onpe.gob.pe';
const PRESIDENTIAL_ELECTION_ID = 10;

// Polling interval in minutes
const POLL_INTERVAL_MIN = parseInt(process.env.POLL_INTERVAL || '10', 10);

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadHistory() {
  if (fs.existsSync(HISTORY_FILE)) {
    return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
  }
  return [];
}

function saveHistory(history) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf-8');
}

async function fetchElectionData() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36');

  const results = { totales: null, participantes: null };

  page.on('response', async (response) => {
    const url = response.url();
    if (!url.includes('presentacion-backend')) return;
    const ct = response.headers()['content-type'] || '';
    if (!ct.includes('json')) return;

    try {
      const data = await response.json();
      if (url.includes(`idEleccion=${PRESIDENTIAL_ELECTION_ID}`) && url.includes('totales')) {
        results.totales = data.data;
      }
      if (url.includes(`idEleccion=${PRESIDENTIAL_ELECTION_ID}`) && url.includes('participantes')) {
        results.participantes = data.data;
      }
    } catch {}
  });

  // Navigate to presidential results page for targeted data
  await page.goto(`${BASE_URL}/main/presidenciales`, {
    waitUntil: 'networkidle2',
    timeout: 45000
  });
  await new Promise(r => setTimeout(r, 5000));

  // If we didn't get data from presidenciales page, try resumen
  if (!results.participantes) {
    await page.goto(`${BASE_URL}/main/resumen`, {
      waitUntil: 'networkidle2',
      timeout: 45000
    });
    await new Promise(r => setTimeout(r, 5000));
  }

  await browser.close();
  return results;
}

function formatNumber(n) {
  return n.toLocaleString('es-PE');
}

function printResults(snapshot) {
  const { timestamp, actasContabilizadas, candidatos } = snapshot;
  const date = new Date(timestamp);

  console.log('\n' + '='.repeat(90));
  console.log(`  ONPE - Eleccion Presidencial 2026`);
  console.log(`  Timestamp: ${date.toLocaleString('es-PE', { timeZone: 'America/Lima' })}`);
  console.log(`  Actas contabilizadas: ${actasContabilizadas}%`);
  console.log('='.repeat(90));

  console.log('\n  Pos  Candidato                                        Partido                    Votos       %');
  console.log('  ' + '-'.repeat(86));

  candidatos.forEach((c, i) => {
    const name = c.nombre.substring(0, 44).padEnd(44);
    const party = c.partido.substring(0, 22).padEnd(22);
    const votes = formatNumber(c.votos).padStart(12);
    const pct = (c.porcentaje || 0).toFixed(3).padStart(7);
    console.log(`  ${String(i + 1).padStart(3)}  ${name} ${party} ${votes} ${pct}%`);
  });

  // Vote differences between top candidates
  if (candidatos.length >= 2) {
    console.log('\n  --- Diferencias entre candidatos top ---');
    for (let i = 0; i < Math.min(5, candidatos.length); i++) {
      for (let j = i + 1; j < Math.min(5, candidatos.length); j++) {
        const diff = candidatos[i].votos - candidatos[j].votos;
        const a = candidatos[i].nombre.split(' ').slice(-2).join(' ');
        const b = candidatos[j].nombre.split(' ').slice(-2).join(' ');
        console.log(`  ${a} vs ${b}: ${diff > 0 ? '+' : ''}${formatNumber(diff)} votos`);
      }
    }
  }
}

function printTrendAnalysis(history) {
  if (history.length < 2) {
    console.log('\n  [Necesita al menos 2 snapshots para analisis de tendencia]');
    return;
  }

  console.log('\n' + '='.repeat(90));
  console.log('  ANALISIS DE TENDENCIA - Diferencia entre Top 2 candidatos');
  console.log('='.repeat(90));

  const latest = history[history.length - 1];
  const top2Names = latest.candidatos.slice(0, 2).map(c => c.nombre.split(' ').slice(-2).join(' '));

  console.log(`\n  ${top2Names[0]} vs ${top2Names[1]}`);
  console.log('  ' + '-'.repeat(86));
  console.log('  Timestamp                      Actas%    1ro Votos     2do Votos     Diferencia    Tendencia');
  console.log('  ' + '-'.repeat(86));

  let prevDiff = null;

  history.forEach((snap) => {
    const date = new Date(snap.timestamp);
    const ts = date.toLocaleString('es-PE', { timeZone: 'America/Lima' }).padEnd(28);
    const actas = String(snap.actasContabilizadas + '%').padStart(8);

    // Find the top 2 candidates by current ordering (latest snapshot)
    const latestTop2Codes = latest.candidatos.slice(0, 2).map(c => c.codigo);
    const c1 = snap.candidatos.find(c => c.codigo === latestTop2Codes[0]);
    const c2 = snap.candidatos.find(c => c.codigo === latestTop2Codes[1]);

    if (!c1 || !c2) return;

    const diff = c1.votos - c2.votos;
    const v1 = formatNumber(c1.votos).padStart(12);
    const v2 = formatNumber(c2.votos).padStart(12);
    const diffStr = ((diff > 0 ? '+' : '') + formatNumber(diff)).padStart(12);

    let trend = '';
    if (prevDiff !== null) {
      const change = diff - prevDiff;
      if (change > 0) trend = `↑ +${formatNumber(change)}`;
      else if (change < 0) trend = `↓ ${formatNumber(change)}`;
      else trend = '→ sin cambio';
    }

    console.log(`  ${ts} ${actas} ${v1} ${v2} ${diffStr}    ${trend}`);
    prevDiff = diff;
  });

  // Overall trend summary
  if (history.length >= 2) {
    const first = history[0];
    const last = history[history.length - 1];
    const latestTop2Codes = last.candidatos.slice(0, 2).map(c => c.codigo);

    const firstC1 = first.candidatos.find(c => c.codigo === latestTop2Codes[0]);
    const firstC2 = first.candidatos.find(c => c.codigo === latestTop2Codes[1]);
    const lastC1 = last.candidatos.find(c => c.codigo === latestTop2Codes[0]);
    const lastC2 = last.candidatos.find(c => c.codigo === latestTop2Codes[1]);

    if (firstC1 && firstC2 && lastC1 && lastC2) {
      const firstDiff = firstC1.votos - firstC2.votos;
      const lastDiff = lastC1.votos - lastC2.votos;
      const totalChange = lastDiff - firstDiff;

      console.log('\n  --- Resumen ---');
      console.log(`  Periodo: ${new Date(first.timestamp).toLocaleString('es-PE', { timeZone: 'America/Lima' })} → ${new Date(last.timestamp).toLocaleString('es-PE', { timeZone: 'America/Lima' })}`);
      console.log(`  Snapshots: ${history.length}`);
      console.log(`  Diferencia inicial: ${formatNumber(firstDiff)} votos`);
      console.log(`  Diferencia actual:  ${formatNumber(lastDiff)} votos`);
      console.log(`  Cambio neto:        ${totalChange > 0 ? '+' : ''}${formatNumber(totalChange)} votos`);

      if (totalChange > 0) {
        console.log(`  Tendencia: ${top2Names[0]} AMPLIA ventaja`);
      } else if (totalChange < 0) {
        console.log(`  Tendencia: ${top2Names[1]} ACORTA distancia`);
      } else {
        console.log(`  Tendencia: ESTABLE`);
      }
    }
  }
}

function printAllDifferences(history) {
  if (history.length < 2) return;

  const latest = history[history.length - 1];
  const topN = Math.min(8, latest.candidatos.length);

  console.log('\n' + '='.repeat(90));
  console.log('  DIFERENCIAS ENTRE TODOS LOS TOP CANDIDATOS (ultimo snapshot)');
  console.log('='.repeat(90));

  for (let i = 0; i < topN; i++) {
    for (let j = i + 1; j < topN; j++) {
      const a = latest.candidatos[i];
      const b = latest.candidatos[j];
      const diff = a.votos - b.votos;
      const nameA = a.nombre.split(' ').slice(-2).join(' ').padEnd(25);
      const nameB = b.nombre.split(' ').slice(-2).join(' ').padEnd(25);
      console.log(`  ${nameA} vs ${nameB}: ${diff > 0 ? '+' : ''}${formatNumber(diff)} votos`);
    }
  }
}

async function scrapeOnce() {
  console.log(`\n[${new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' })}] Scrapeando ONPE...`);

  try {
    const { totales, participantes } = await fetchElectionData();

    if (!participantes || !totales) {
      console.error('  ERROR: No se pudo obtener datos. Reintentando en siguiente ciclo.');
      return null;
    }

    // Filter out blank/null votes and sort by votes descending
    const filtered = participantes.filter(c =>
      c.nombreCandidato && c.nombreCandidato.trim() !== '' &&
      !c.nombreAgrupacionPolitica.includes('BLANCO') &&
      !c.nombreAgrupacionPolitica.includes('NULO')
    );
    const sorted = [...filtered].sort((a, b) => b.totalVotosValidos - a.totalVotosValidos);

    const snapshot = {
      timestamp: Date.now(),
      fechaOnpe: totales.fechaActualizacion,
      actasContabilizadas: totales.actasContabilizadas,
      totalActas: totales.totalActas,
      contabilizadas: totales.contabilizadas,
      totalVotosValidos: totales.totalVotosValidos,
      totalVotosEmitidos: totales.totalVotosEmitidos,
      candidatos: sorted.map(c => ({
        nombre: c.nombreCandidato,
        partido: c.nombreAgrupacionPolitica,
        codigo: c.codigoAgrupacionPolitica,
        votos: c.totalVotosValidos,
        porcentaje: c.porcentajeVotosValidos,
        porcentajeEmitidos: c.porcentajeVotosEmitidos
      }))
    };

    return snapshot;
  } catch (err) {
    console.error('  ERROR:', err.message);
    return null;
  }
}

async function main() {
  ensureDataDir();

  const args = process.argv.slice(2);
  const isWatch = args.includes('--watch') || args.includes('-w');
  const showHistory = args.includes('--history') || args.includes('-h');

  if (showHistory) {
    const history = loadHistory();
    if (history.length === 0) {
      console.log('No hay datos historicos. Ejecuta el scraper primero.');
      return;
    }
    printResults(history[history.length - 1]);
    printTrendAnalysis(history);
    printAllDifferences(history);
    return;
  }

  // Single scrape
  const snapshot = await scrapeOnce();
  if (!snapshot) {
    process.exit(1);
  }

  const history = loadHistory();

  // Avoid duplicate if same ONPE timestamp
  const isDuplicate = history.length > 0 &&
    history[history.length - 1].fechaOnpe === snapshot.fechaOnpe;

  if (!isDuplicate) {
    history.push(snapshot);
    saveHistory(history);
    console.log(`  Snapshot guardado (#${history.length})`);
  } else {
    console.log('  Datos sin cambio desde ultimo snapshot (misma fecha ONPE)');
  }

  printResults(snapshot);
  printTrendAnalysis(history);
  printAllDifferences(history);

  if (isWatch) {
    console.log(`\n  Modo watch activo. Polling cada ${POLL_INTERVAL_MIN} minutos. Ctrl+C para salir.`);

    const poll = async () => {
      const snap = await scrapeOnce();
      if (!snap) return;

      const hist = loadHistory();
      const dup = hist.length > 0 && hist[hist.length - 1].fechaOnpe === snap.fechaOnpe;

      if (!dup) {
        hist.push(snap);
        saveHistory(hist);
        console.log(`  Snapshot guardado (#${hist.length})`);
      } else {
        console.log('  Datos sin cambio.');
      }

      printResults(snap);
      printTrendAnalysis(hist);
    };

    setInterval(poll, POLL_INTERVAL_MIN * 60 * 1000);
  }
}

main().catch(console.error);
