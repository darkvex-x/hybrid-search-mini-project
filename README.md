# Hybrid Search Mini Project (BM25 + Vector with RRF)

A tiny, self-contained mini project: fuse keyword and semantic search with **Reciprocal Rank Fusion (RRF)** and prove the hybrid beats each search alone. **No database or API keys needed** — each system's ranked results are provided as data.

## Files

- `hybrid-eval.js` — the file you build (four TODOs; loading is done for you).
- `test-set.csv` — 10 `(query, correct_post_ids)` pairs. Multiple correct ids are `;`-separated.
- `search-results.json` — each system's **top-20** ranked `post_id` list per query: `{ "<query>": { "keyword": [...], "semantic": [...] } }`. Array position 0 is rank 1.
- `posts-dataset.csv` — the 35 posts the ids refer to (for sanity-checking only).

## What to build in `hybrid-eval.js`

1. `rrfFuse(keywordIds, semanticIds, k = 60)` — merge two ranked lists into one. A doc's score is the sum of `1 / (k + rank)` over each list it appears in (rank is 1-based); sort by score, highest first.
2. `rankOf(ids, correctIds, cutoff)` — 1-based rank of the first correct id, or `null`.
3. For each query, build the hybrid list and record reciprocal rank + a recall@10 hit for **keyword, semantic, and hybrid**.
4. Print a markdown table (keyword / semantic / hybrid rank per query, `miss` if not found) with a Summary row of MRR and Recall@10 per system.

## Formulas

```text
RRF(doc)        = sum over each list of  1 / (k + rank of doc in that list)   [k = 60]
Reciprocal Rank = 1 / (rank of the first correct answer)   [0 if not found]
MRR             = average reciprocal rank over all queries
Recall@10       = (queries whose correct answer is in the top 10) / (total queries)
```

## Run

```bash
node hybrid-eval.js
```

## Answer key

A correct solution prints:

```text
| Query | Keyword rank | Semantic rank | Hybrid rank |
|---|---|---|---|
| my redis cache keeps showing old data | 8 | 1 | 1 |
| how do I add semantic search to a table I already have | 12 | 2 | 1 |
| redis or memcached for caching | 1 | 2 | 1 |
| why did my query get slower after I added an index | 14 | 1 | 2 |
| what does ACID actually guarantee | 2 | 1 | 1 |
| how do I keep my postgres online while changing the schema | 6 | 3 | 1 |
| my background jobs stop after every deploy | 13 | 2 | 2 |
| how do I let my database accept more writes per second | 4 | 1 | 1 |
| sql or nosql for a new product | 1 | 3 | 1 |
| why does my redis memory keep climbing | 15 | 2 | 1 |
| **Summary** | **MRR 0.33 · Recall@10 0.60** | **MRR 0.67 · Recall@10 1.00** | **MRR 0.90 · Recall@10 1.00** |
```

Hybrid (MRR 0.90) beats keyword (0.33) and semantic (0.67): fusion lifts consensus answers to the top, and because the lists are top-20, it rescues answers keyword buried past rank 10.
