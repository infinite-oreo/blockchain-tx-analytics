"""
generate_data.py
Generates simulated cross-chain blockchain transaction data and loads it into SQLite.
"""

import sqlite3
import random
import hashlib
import time
from datetime import datetime, timedelta

# ── Config ──────────────────────────────────────────────────────────────────
DB_FILE = "blockchain_analytics.db"
NUM_TRANSACTIONS = 5000
SEED = 42
random.seed(SEED)

# ── Domain constants ─────────────────────────────────────────────────────────
CHAINS = ["Ethereum", "Polygon", "Arbitrum", "Optimism", "BSC", "Avalanche"]
TOKEN_PAIRS = [
    ("ETH", "MATIC"), ("ETH", "USDC"), ("BTC", "ETH"),
    ("USDC", "USDT"), ("ETH", "AVAX"), ("MATIC", "USDC"),
]
BRIDGE_PROTOCOLS = ["Wormhole", "LayerZero", "Axelar", "Hop", "Stargate"]
STATUSES = ["confirmed", "confirmed", "confirmed", "confirmed",  # 80% success
            "failed", "pending", "timeout"]                       # 20% issues
VALIDATORS = [f"validator_{i:03d}" for i in range(1, 31)]        # 30 validators

def random_tx_hash():
    raw = str(random.random()).encode()
    return "0x" + hashlib.sha256(raw).hexdigest()[:62]

def random_address():
    raw = str(random.random()).encode()
    return "0x" + hashlib.sha256(raw).hexdigest()[:40]

def generate_transactions(n: int) -> list[dict]:
    base_time = datetime(2025, 1, 1)
    txs = []
    for i in range(n):
        src_chain, dst_chain = random.sample(CHAINS, 2)
        token_in, token_out = random.choice(TOKEN_PAIRS)
        protocol = random.choice(BRIDGE_PROTOCOLS)
        status = random.choice(STATUSES)

        # Latency: failed/timeout transactions tend to take longer
        if status in ("failed", "timeout"):
            latency_ms = random.randint(8000, 60000)
        elif status == "pending":
            latency_ms = random.randint(3000, 15000)
        else:
            latency_ms = random.randint(500, 8000)

        # Gas fee varies by chain
        gas_fee_usd = round(random.uniform(0.5, 45.0), 4)
        if src_chain == "Ethereum":
            gas_fee_usd = round(random.uniform(5.0, 45.0), 4)  # ETH mainnet is expensive

        amount_usd = round(random.uniform(10.0, 50000.0), 2)
        timestamp = base_time + timedelta(
            days=random.randint(0, 364),
            hours=random.randint(0, 23),
            minutes=random.randint(0, 59),
        )

        # Occasionally a validator is None (no validator assigned for failed tx)
        validator = random.choice(VALIDATORS) if status != "timeout" else None

        # Retry count: failed/timeout may have been retried
        retry_count = 0
        if status in ("failed", "timeout"):
            retry_count = random.randint(0, 3)

        txs.append({
            "tx_hash":       random_tx_hash(),
            "timestamp":     timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "src_chain":     src_chain,
            "dst_chain":     dst_chain,
            "token_in":      token_in,
            "token_out":     token_out,
            "amount_usd":    amount_usd,
            "gas_fee_usd":   gas_fee_usd,
            "latency_ms":    latency_ms,
            "status":        status,
            "protocol":      protocol,
            "sender":        random_address(),
            "receiver":      random_address(),
            "validator_id":  validator,
            "retry_count":   retry_count,
        })
    return txs


def init_db(conn: sqlite3.Connection):
    conn.executescript("""
        DROP TABLE IF EXISTS transactions;
        DROP TABLE IF EXISTS validators;

        CREATE TABLE validators (
            validator_id   TEXT PRIMARY KEY,
            region         TEXT NOT NULL,
            stake_eth      REAL NOT NULL,
            joined_date    TEXT NOT NULL
        );

        CREATE TABLE transactions (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            tx_hash        TEXT UNIQUE NOT NULL,
            timestamp      TEXT NOT NULL,
            src_chain      TEXT NOT NULL,
            dst_chain      TEXT NOT NULL,
            token_in       TEXT NOT NULL,
            token_out      TEXT NOT NULL,
            amount_usd     REAL NOT NULL,
            gas_fee_usd    REAL NOT NULL,
            latency_ms     INTEGER NOT NULL,
            status         TEXT NOT NULL,
            protocol       TEXT NOT NULL,
            sender         TEXT NOT NULL,
            receiver       TEXT NOT NULL,
            validator_id   TEXT REFERENCES validators(validator_id),
            retry_count    INTEGER NOT NULL DEFAULT 0
        );

        CREATE INDEX idx_tx_status    ON transactions(status);
        CREATE INDEX idx_tx_timestamp ON transactions(timestamp);
        CREATE INDEX idx_tx_protocol  ON transactions(protocol);
        CREATE INDEX idx_tx_src_chain ON transactions(src_chain);
    """)


def seed_validators(conn: sqlite3.Connection):
    regions = ["Asia-Pacific", "Europe", "North America", "South America"]
    rows = []
    base = datetime(2020, 1, 1)
    for vid in VALIDATORS:
        rows.append((
            vid,
            random.choice(regions),
            round(random.uniform(32.0, 5000.0), 2),
            (base + timedelta(days=random.randint(0, 1200))).strftime("%Y-%m-%d"),
        ))
    conn.executemany(
        "INSERT INTO validators VALUES (?, ?, ?, ?)", rows
    )


def main():
    print(f"[1/4] Connecting to {DB_FILE} ...")
    conn = sqlite3.connect(DB_FILE)

    print("[2/4] Initialising schema ...")
    init_db(conn)

    print("[3/4] Seeding validators ...")
    seed_validators(conn)

    print(f"[4/4] Generating {NUM_TRANSACTIONS} transactions ...")
    txs = generate_transactions(NUM_TRANSACTIONS)
    conn.executemany("""
        INSERT INTO transactions
          (tx_hash, timestamp, src_chain, dst_chain, token_in, token_out,
           amount_usd, gas_fee_usd, latency_ms, status, protocol,
           sender, receiver, validator_id, retry_count)
        VALUES
          (:tx_hash, :timestamp, :src_chain, :dst_chain, :token_in, :token_out,
           :amount_usd, :gas_fee_usd, :latency_ms, :status, :protocol,
           :sender, :receiver, :validator_id, :retry_count)
    """, txs)
    conn.commit()
    conn.close()

    print(f"\n✅  Done! Database written to: {DB_FILE}")
    print("    Next: run  python load_and_run.py  to execute all SQL analyses.")


if __name__ == "__main__":
    main()
