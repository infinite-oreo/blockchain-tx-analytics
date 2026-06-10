"""
[INPUT]: 依赖上级目录的 blockchain_analytics.db
[OUTPUT]: Flask REST API，9 个端点覆盖全部分析查询
[POS]: 后端数据层，将 SQLite 结果序列化为 JSON 供前端消费
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
"""

from flask import Flask, jsonify
from flask_cors import CORS
import sqlite3, os

app = Flask(__name__)
CORS(app)

DB = os.path.join(os.path.dirname(__file__), '..', 'blockchain_analytics.db')

def q(sql):
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(sql).fetchall()
    conn.close()
    return [dict(r) for r in rows]

# ── Q 汇总 ──────────────────────────────────────────────────────────────────
@app.route('/api/summary')
def summary():
    return jsonify(q("""
        SELECT COUNT(*) as total_tx,
               ROUND(SUM(CASE WHEN status='confirmed' THEN 1.0 ELSE 0 END)/COUNT(*)*100,1) as success_rate,
               ROUND(SUM(amount_usd)/1000000,2) as volume_m_usd,
               ROUND(AVG(CASE WHEN status='confirmed' THEN latency_ms END)) as avg_latency_ms,
               COUNT(DISTINCT validator_id) as active_validators
        FROM transactions
    """))

# ── Q1 状态分布 ──────────────────────────────────────────────────────────────
@app.route('/api/status-distribution')
def status_distribution():
    return jsonify(q("""
        SELECT status, COUNT(*) as count,
               ROUND(COUNT(*)*100.0/SUM(COUNT(*)) OVER(),2) as pct
        FROM transactions GROUP BY status ORDER BY count DESC
    """))

# ── Q2 协议失败率 ────────────────────────────────────────────────────────────
@app.route('/api/protocol-failure-rate')
def protocol_failure_rate():
    return jsonify(q("""
        SELECT protocol, COUNT(*) as total,
               ROUND(SUM(CASE WHEN status='failed' THEN 1.0 ELSE 0 END)/COUNT(*)*100,2) as failure_rate
        FROM transactions GROUP BY protocol ORDER BY failure_rate DESC
    """))

# ── Q3 各链 gas 费 ───────────────────────────────────────────────────────────
@app.route('/api/gas-fee-by-chain')
def gas_fee_by_chain():
    return jsonify(q("""
        SELECT src_chain, ROUND(AVG(gas_fee_usd),4) as avg_gas, COUNT(*) as tx_count
        FROM transactions GROUP BY src_chain ORDER BY avg_gas DESC
    """))

# ── Q4 月度趋势 ──────────────────────────────────────────────────────────────
@app.route('/api/monthly-trend')
def monthly_trend():
    return jsonify(q("""
        SELECT strftime('%Y-%m',timestamp) as month, COUNT(*) as total,
               ROUND(SUM(CASE WHEN status='confirmed' THEN 1.0 ELSE 0 END)/COUNT(*)*100,2) as success_rate,
               ROUND(SUM(amount_usd),2) as volume_usd
        FROM transactions GROUP BY month ORDER BY month
    """))

# ── Q5 热门通道 ──────────────────────────────────────────────────────────────
@app.route('/api/top-corridors')
def top_corridors():
    return jsonify(q("""
        SELECT src_chain||' → '||dst_chain as corridor,
               COUNT(*) as tx_count, ROUND(SUM(amount_usd),2) as total_volume
        FROM transactions GROUP BY src_chain,dst_chain ORDER BY tx_count DESC LIMIT 10
    """))

# ── Q6 延迟分位数 ────────────────────────────────────────────────────────────
@app.route('/api/latency-percentiles')
def latency_percentiles():
    return jsonify(q("""
        SELECT protocol, MIN(latency_ms) as min_ms,
               ROUND(AVG(latency_ms)) as avg_ms, MAX(latency_ms) as max_ms
        FROM transactions WHERE status='confirmed'
        GROUP BY protocol ORDER BY avg_ms
    """))

# ── Q7 验证节点评分 ──────────────────────────────────────────────────────────
@app.route('/api/validator-scorecard')
def validator_scorecard():
    return jsonify(q("""
        SELECT t.validator_id, v.region, COUNT(*) as total_tx,
               ROUND(SUM(CASE WHEN t.status='failed' THEN 1.0 ELSE 0 END)/COUNT(*)*100,2) as failure_rate,
               ROUND(AVG(t.retry_count),2) as avg_retries
        FROM transactions t JOIN validators v ON t.validator_id=v.validator_id
        GROUP BY t.validator_id ORDER BY failure_rate DESC LIMIT 20
    """))

# ── Q10 协议综合评分 ─────────────────────────────────────────────────────────
@app.route('/api/protocol-scorecard')
def protocol_scorecard():
    return jsonify(q("""
        SELECT protocol,
               ROUND(SUM(CASE WHEN status='confirmed' THEN 1.0 ELSE 0 END)/COUNT(*)*100,2) as success_rate,
               ROUND(AVG(CASE WHEN status='confirmed' THEN latency_ms END)) as avg_latency,
               ROUND(AVG(gas_fee_usd),4) as avg_gas
        FROM transactions GROUP BY protocol ORDER BY success_rate DESC
    """))

if __name__ == '__main__':
    app.run(debug=True, port=5001)
