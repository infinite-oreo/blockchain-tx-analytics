-- analysis.sql
-- 10 analytical queries on cross-chain transaction data
-- Organised by difficulty: Basic → Intermediate → Advanced
-- Each query answers a concrete reliability / performance question.

-- ═══════════════════════════════════════════════════════════════════════════
-- BASIC  (Q1–Q3)  — aggregation, filtering, grouping
-- ═══════════════════════════════════════════════════════════════════════════

-- Q1: Overall transaction status distribution
--     What share of all cross-chain transactions succeed vs fail?
SELECT
    status,
    COUNT(*)                                   AS tx_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS pct
FROM transactions
GROUP BY status
ORDER BY tx_count DESC;


-- Q2: Failure rate per bridge protocol
--     Which bridge protocol is the least reliable?
SELECT
    protocol,
    COUNT(*)                                              AS total_txs,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END)   AS failed_txs,
    ROUND(
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) * 100.0 / COUNT(*),
    2)                                                    AS failure_rate_pct
FROM transactions
GROUP BY protocol
ORDER BY failure_rate_pct DESC;


-- Q3: Average gas fee by source chain
--     Which chains are most expensive to bridge out of?
SELECT
    src_chain,
    ROUND(AVG(gas_fee_usd), 4)   AS avg_gas_usd,
    ROUND(MIN(gas_fee_usd), 4)   AS min_gas_usd,
    ROUND(MAX(gas_fee_usd), 4)   AS max_gas_usd,
    COUNT(*)                      AS tx_count
FROM transactions
GROUP BY src_chain
ORDER BY avg_gas_usd DESC;


-- ═══════════════════════════════════════════════════════════════════════════
-- INTERMEDIATE  (Q4–Q7)  — subqueries, CTEs, window functions, JOINs
-- ═══════════════════════════════════════════════════════════════════════════

-- Q4: Monthly transaction volume and success rate trend
--     Is reliability improving over time?
SELECT
    STRFTIME('%Y-%m', timestamp)                                    AS month,
    COUNT(*)                                                        AS total_txs,
    SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END)           AS confirmed_txs,
    ROUND(
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) * 100.0 / COUNT(*),
    2)                                                              AS success_rate_pct,
    ROUND(SUM(amount_usd), 2)                                       AS total_volume_usd
FROM transactions
GROUP BY month
ORDER BY month;


-- Q5: Top 10 most-used chain corridors (src → dst pairs)
--     Which cross-chain routes carry the most traffic and value?
SELECT
    src_chain || ' → ' || dst_chain   AS corridor,
    COUNT(*)                           AS tx_count,
    ROUND(AVG(latency_ms) / 1000.0, 2) AS avg_latency_sec,
    ROUND(SUM(amount_usd), 2)          AS total_volume_usd,
    ROUND(
        SUM(CASE WHEN status = 'failed' OR status = 'timeout' THEN 1 ELSE 0 END)
        * 100.0 / COUNT(*),
    2)                                 AS failure_rate_pct
FROM transactions
GROUP BY src_chain, dst_chain
ORDER BY tx_count DESC
LIMIT 10;


-- Q6: Latency percentiles per protocol (using window functions)
--     What does the latency distribution look like for each bridge?
WITH ranked AS (
    SELECT
        protocol,
        latency_ms,
        NTILE(4) OVER (PARTITION BY protocol ORDER BY latency_ms) AS quartile
    FROM transactions
    WHERE status = 'confirmed'
)
SELECT
    protocol,
    ROUND(AVG(CASE WHEN quartile = 1 THEN latency_ms END) / 1000.0, 2) AS p25_sec,
    ROUND(AVG(CASE WHEN quartile = 2 THEN latency_ms END) / 1000.0, 2) AS p50_sec,
    ROUND(AVG(CASE WHEN quartile = 3 THEN latency_ms END) / 1000.0, 2) AS p75_sec,
    ROUND(MAX(latency_ms) / 1000.0, 2)                                  AS max_sec
FROM ranked
GROUP BY protocol
ORDER BY p50_sec;


-- Q7: Validator reliability — failure rate and retry burden
--     Which validators are associated with the most failed transactions?
SELECT
    v.validator_id,
    v.region,
    v.stake_eth,
    COUNT(t.id)                                                    AS total_txs,
    SUM(CASE WHEN t.status IN ('failed','timeout') THEN 1 ELSE 0 END) AS bad_txs,
    ROUND(
        SUM(CASE WHEN t.status IN ('failed','timeout') THEN 1 ELSE 0 END)
        * 100.0 / COUNT(t.id),
    2)                                                             AS bad_rate_pct,
    ROUND(AVG(t.retry_count), 2)                                   AS avg_retries
FROM validators v
JOIN transactions t ON t.validator_id = v.validator_id
GROUP BY v.validator_id
HAVING total_txs >= 50           -- only validators with enough data
ORDER BY bad_rate_pct DESC
LIMIT 15;


-- ═══════════════════════════════════════════════════════════════════════════
-- ADVANCED  (Q8–Q10)  — multi-CTE pipelines, anomaly detection, ranking
-- ═══════════════════════════════════════════════════════════════════════════

-- Q8: High-value transactions with anomalous gas fees
--     Flag transactions where gas_fee_usd > 2× the protocol average
--     (potential outliers / fee-manipulation events)
WITH protocol_avg AS (
    SELECT
        protocol,
        AVG(gas_fee_usd)    AS avg_gas,
        AVG(gas_fee_usd) * 2 AS threshold
    FROM transactions
    GROUP BY protocol
)
SELECT
    t.tx_hash,
    t.timestamp,
    t.protocol,
    t.src_chain,
    t.dst_chain,
    t.amount_usd,
    t.gas_fee_usd,
    ROUND(pa.avg_gas, 4)         AS protocol_avg_gas,
    ROUND(t.gas_fee_usd / pa.avg_gas, 2) AS gas_multiplier
FROM transactions t
JOIN protocol_avg pa ON t.protocol = pa.protocol
WHERE t.gas_fee_usd > pa.threshold
  AND t.amount_usd > 1000        -- only meaningful transactions
ORDER BY gas_multiplier DESC
LIMIT 20;


-- Q9: Consecutive failure detection — chains with ≥3 failures in a 1-hour window
--     Simulates alerting logic for fault-tolerance monitoring
WITH failure_windows AS (
    SELECT
        src_chain,
        timestamp,
        status,
        COUNT(*) FILTER (WHERE status IN ('failed','timeout'))
            OVER (
                PARTITION BY src_chain
                ORDER BY timestamp
                ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
            ) AS failures_in_window
    FROM transactions
)
SELECT DISTINCT
    src_chain,
    timestamp                      AS window_end,
    failures_in_window
FROM failure_windows
WHERE failures_in_window >= 3
ORDER BY src_chain, window_end
LIMIT 30;


-- Q10: Protocol performance scorecard
--      Composite reliability score = 
--          (success_rate × 0.5) + (speed_score × 0.3) + (cost_score × 0.2)
--      where speed_score and cost_score are normalised 0–100
WITH stats AS (
    SELECT
        protocol,
        COUNT(*)                                                         AS total,
        ROUND(SUM(CASE WHEN status='confirmed' THEN 1.0 ELSE 0 END)
              * 100.0 / COUNT(*), 2)                                     AS success_rate,
        ROUND(AVG(latency_ms), 0)                                        AS avg_latency_ms,
        ROUND(AVG(gas_fee_usd), 4)                                       AS avg_gas
    FROM transactions
    GROUP BY protocol
),
normalised AS (
    SELECT *,
        -- Lower latency → higher score (invert and normalise)
        ROUND((1.0 - (avg_latency_ms - MIN(avg_latency_ms) OVER ())
               / (MAX(avg_latency_ms) OVER () - MIN(avg_latency_ms) OVER () + 1)
              ) * 100, 2)  AS speed_score,
        ROUND((1.0 - (avg_gas - MIN(avg_gas) OVER ())
               / (MAX(avg_gas) OVER () - MIN(avg_gas) OVER () + 1)
              ) * 100, 2)  AS cost_score
    FROM stats
)
SELECT
    protocol,
    total,
    success_rate,
    avg_latency_ms,
    avg_gas,
    speed_score,
    cost_score,
    ROUND(
        success_rate * 0.5 + speed_score * 0.3 + cost_score * 0.2,
    2)  AS composite_score
FROM normalised
ORDER BY composite_score DESC;
