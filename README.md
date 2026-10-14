# Hybrid Search Mini Project – RRF Evaluation

This mini project fuses keyword and semantic search results using **Reciprocal Rank Fusion (RRF)** and evaluates all three systems (keyword, semantic, hybrid) with **MRR** and **Recall@10** on a 10-query test set.

## How to Run

```bash
node hybrid-eval.js
```

No database or API keys required. All ranked results are provided as fixture data in `search-results.json`.

## Result Table

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

## Interpretation

The hybrid system is the clear overall winner, achieving an MRR of **0.90** — more than **2.7× better than keyword (0.33)** and roughly **34% better than semantic alone (0.67)**. A striking example of fusion lifting a result that neither system ranked first is **"my background jobs stop after every deploy"**: keyword buried the answer at rank 13 while semantic placed it at rank 2, yet hybrid surfaces it at rank 2 — the consensus signal from both lists boosts its combined RRF score above all items that only one system ranked highly. For **"why does my redis memory keep climbing"**, keyword placed the correct answer all the way at rank 15 (outside the top 10, meaning a Recall@10 miss), but because semantic had it at rank 2 and the search results went 20 deep (not just 10), RRF could still accumulate a winning score for that document and lift it to rank 1 in the hybrid list — a miss becomes a hit purely because both systems fetched top-20 candidates before fusion. Finally, hybrid does not put every answer at rank 1 because when both keyword and semantic rank a wrong document highly (strong consensus on the wrong answer), that wrong document's combined RRF score can still outpace the correct answer — as seen with **"why did my query get slower after I added an index"**, where the correct post lands at hybrid rank 2 rather than 1.

## What the Code Does

1. **`rrfFuse(keywordIds, semanticIds, k = 60)`** – For each document in either list, accumulates `1 / (k + rank)` from every list it appears in, then sorts by total score descending to produce one merged ranking.
2. **`rankOf(ids, correctIds, cutoff)`** – Finds the 1-based position of the first correct answer within an optional cutoff window.
3. **Metrics loop** – For each query, builds the hybrid list and records each system's reciprocal rank and whether the correct answer is in its top 10.
4. **Markdown table** – Prints per-query ranks and a summary row with MRR and Recall@10 for all three systems.
