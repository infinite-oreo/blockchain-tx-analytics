-- schema.sql
-- Cross-chain transaction analytics database schema
-- Two tables: validators (dimension) + transactions (fact)

CREATE TABLE IF NOT EXISTS validators (
    validator_id   TEXT PRIMARY KEY,
    region         TEXT NOT NULL,
    stake_eth      REAL NOT NULL,       -- validator stake in ETH
    joined_date    TEXT NOT NULL        -- ISO date
);

CREATE TABLE IF NOT EXISTS transactions (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    tx_hash        TEXT UNIQUE NOT NULL,
    timestamp      TEXT NOT NULL,       -- ISO datetime
    src_chain      TEXT NOT NULL,       -- source blockchain
    dst_chain      TEXT NOT NULL,       -- destination blockchain
    token_in       TEXT NOT NULL,       -- token sent
    token_out      TEXT NOT NULL,       -- token received
    amount_usd     REAL NOT NULL,       -- transaction value in USD
    gas_fee_usd    REAL NOT NULL,       -- gas cost in USD
    latency_ms     INTEGER NOT NULL,    -- bridge confirmation time (ms)
    status         TEXT NOT NULL,       -- confirmed | failed | pending | timeout
    protocol       TEXT NOT NULL,       -- bridge protocol used
    sender         TEXT NOT NULL,       -- sender wallet address
    receiver       TEXT NOT NULL,       -- receiver wallet address
    validator_id   TEXT REFERENCES validators(validator_id),
    retry_count    INTEGER NOT NULL DEFAULT 0
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_tx_status    ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_tx_timestamp ON transactions(timestamp);
CREATE INDEX IF NOT EXISTS idx_tx_protocol  ON transactions(protocol);
CREATE INDEX IF NOT EXISTS idx_tx_src_chain ON transactions(src_chain);
