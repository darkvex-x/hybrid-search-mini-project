// Hybrid Search (RRF) mini project
// Goal: fuse keyword + semantic search with RRF, then compare all three systems.
// Run with:  node hybrid-eval.js

const fs = require('fs');

// --- loading is done for you ---
function loadTestSet(path) {
  const lines = fs.readFileSync(path, 'utf8').trim().split('\n').slice(1);
  return lines.map(line => {
    const [query, ids] = line.split(',');
    return { query, correctIds: ids.split(';').map(Number) };
  });
}
const testSet = loadTestSet('test-set.csv');
// results[query] = { keyword: [id1, id2, ...top 20], semantic: [...top 20] }
const results = JSON.parse(fs.readFileSync('search-results.json', 'utf8'));

// TODO 1: Reciprocal Rank Fusion.
// Given two ranked id-lists, return ONE fused id-list (highest RRF score first).
// RRF score of a doc = sum over each list it appears in of 1 / (k + rank), rank is 1-based.
function rrfFuse(keywordIds, semanticIds, k = 60) {
  const scores = new Map();

  // Score from keyword list
  keywordIds.forEach((id, index) => {
    const rank = index + 1; // 1-based
    const current = scores.get(id) || 0;
    scores.set(id, current + 1 / (k + rank));
  });

  // Score from semantic list
  semanticIds.forEach((id, index) => {
    const rank = index + 1; // 1-based
    const current = scores.get(id) || 0;
    scores.set(id, current + 1 / (k + rank));
  });

  // Sort by score descending
  return Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);
}

// TODO 2: rank of the first correct id in a list (1-based), or null if none.
// The optional `cutoff` limits how far down you look (use 10 for recall@10).
function rankOf(ids, correctIds, cutoff = Infinity) {
  for (let i = 0; i < ids.length && i < cutoff; i++) {
    if (correctIds.includes(ids[i])) {
      return i + 1; // 1-based rank
    }
  }
  return null;
}

// helpers
const rr = (ids, correctIds) => { const r = rankOf(ids, correctIds); return r ? 1 / r : 0; };
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;

const systems = ['keyword', 'semantic', 'hybrid'];
const rrs = { keyword: [], semantic: [], hybrid: [] };
const hits = { keyword: 0, semantic: 0, hybrid: 0 };
const rows = [];

for (const { query, correctIds } of testSet) {
  const kw = results[query].keyword;
  const sem = results[query].semantic;
  const hyb = rrfFuse(kw, sem, 60);   // uses your TODO 1
  const lists = { keyword: kw, semantic: sem, hybrid: hyb };

  // TODO 3: for each system, push its reciprocal rank and count a recall@10 hit.
  for (const s of systems) {
    rrs[s].push(rr(lists[s], correctIds));
    if (rankOf(lists[s], correctIds, 10) !== null) hits[s]++;
  }

  rows.push({ query, kw: rankOf(kw, correctIds), sem: rankOf(sem, correctIds), hyb: rankOf(hyb, correctIds) });
}

// TODO 4: print a markdown table, one row per query with the keyword / semantic / hybrid rank
// (print 'miss' when the answer is not in a list), then a Summary row with each system's
// MRR and Recall@10 rounded to 2 decimals.
const n = testSet.length;

const fmt = rank => (rank === null ? 'miss' : String(rank));

console.log('| Query | Keyword rank | Semantic rank | Hybrid rank |');
console.log('|---|---|---|---|');

for (const { query, kw, sem, hyb } of rows) {
  console.log(`| ${query} | ${fmt(kw)} | ${fmt(sem)} | ${fmt(hyb)} |`);
}

const kwMRR  = mean(rrs.keyword).toFixed(2);
const semMRR = mean(rrs.semantic).toFixed(2);
const hybMRR = mean(rrs.hybrid).toFixed(2);

const kwR10  = (hits.keyword  / n).toFixed(2);
const semR10 = (hits.semantic / n).toFixed(2);
const hybR10 = (hits.hybrid   / n).toFixed(2);

console.log(`| **Summary** | **MRR ${kwMRR} · Recall@10 ${kwR10}** | **MRR ${semMRR} · Recall@10 ${semR10}** | **MRR ${hybMRR} · Recall@10 ${hybR10}** |`);
