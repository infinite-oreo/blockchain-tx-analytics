# Blockchain Cross-Chain Transaction Analytics

A SQL analytics project that models cross-chain bridge reliability using a simulated dataset of 5,000 transactions across six blockchains and five bridge protocols.

Motivated by my master's research on **fault tolerance and reliability in distributed systems**, this project applies SQL-based data analysis to a concrete problem: *identifying failure patterns, latency anomalies, and validator-level reliability issues in cross-chain interoperability infrastructure.*

---

## Project Structure

```
├── generate_data.py   # Generates 5,000 simulated transactions → SQLite DB
├── schema.sql         # Table definitions and index design
├── analysis.sql       # 10 analytical SQL queries (Basic → Advanced)
├── load_and_run.py    # Executes all queries and prints formatted output
└── README.md
```

---

## Schema Design

### `validators` (dimension table)
| Column | Type | Description |
|---|---|---|
| `validator_id` | TEXT PK | Unique validator identifier |
| `region` | TEXT | Geographic region |
| `stake_eth` | REAL | Stake amount in ETH |
| `joined_date` | TEXT | Date joined the network |

### `transactions` (fact table)
| Column | Type | Description |
|---|---|---|
| `tx_hash` | TEXT UNIQUE | Transaction hash |
| `timestamp` | TEXT | Transaction datetime |
| `src_chain` | TEXT | Source blockchain |
| `dst_chain` | TEXT | Destination blockchain |
| `token_in / token_out` | TEXT | Asset pair being bridged |
| `amount_usd` | REAL | Transaction value (USD) |
| `gas_fee_usd` | REAL | Gas cost (USD) |
| `latency_ms` | INTEGER | Bridge confirmation time (ms) |
| `status` | TEXT | confirmed / failed / pending / timeout |
| `protocol` | TEXT | Bridge protocol used |
| `validator_id` | TEXT FK | Assigned validator |
| `retry_count` | INTEGER | Number of retry attempts |

Indexes are created on `status`, `timestamp`, `protocol`, and `src_chain` to support the analytical query patterns.

---

## Analytical Queries

The 10 queries in `analysis.sql` are grouped by complexity:

### Basic
| # | Question |
|---|---|
| Q1 | Overall transaction status distribution — what share of transfers succeed? |
| Q2 | Failure rate per bridge protocol — which is least reliable? |
| Q3 | Average gas fee by source chain — which chains are most expensive to bridge from? |

### Intermediate
| # | Question |
|---|---|
| Q4 | Monthly volume and success-rate trend — is reliability improving over time? |
| Q5 | Top 10 most-used chain corridors by traffic and total value |
| Q6 | Latency percentiles (P25/P50/P75/Max) per protocol using window functions |
| Q7 | Validator reliability scorecard — failure rate and average retry burden |

### Advanced
| # | Question |
|---|---|
| Q8 | Anomalous gas-fee detection — flag transactions where fee > 2× protocol average |
| Q9 | Consecutive failure detection — chain corridors with ≥3 failures in a rolling window |
| Q10 | Protocol composite performance scorecard (success rate × latency × cost, weighted) |

---

## How to Run

**Requirements:** Python 3.10+, no external libraries (uses `sqlite3` from the standard library).

```bash
# 1. Generate the database
python generate_data.py

# 2. Run all 10 analytical queries
python load_and_run.py

# 3. (Optional) Open the DB directly in the SQLite CLI
sqlite3 blockchain_analytics.db
sqlite> .read analysis.sql
```

---

## Connection to Research

This project is a practical extension of my academic work on distributed system reliability. The analytical patterns here — detecting failure clusters, measuring latency distributions, and building per-node reliability scores — directly mirror the monitoring and fault-detection logic studied in checkpoint recovery and Byzantine fault-tolerant consensus systems.

| Research concept | SQL equivalent in this project |
|---|---|
| Node fault detection | Q7: validator failure rate ranking |
| Failure correlation / clustering | Q9: rolling-window consecutive failure detection |
| System-level reliability scoring | Q10: composite protocol scorecard |
| Latency distribution analysis | Q6: P25/P50/P75 per protocol |
| Anomaly detection | Q8: gas-fee outlier flagging |

---

