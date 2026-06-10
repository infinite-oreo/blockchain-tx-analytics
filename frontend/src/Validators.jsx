/**
 * [INPUT]: 依赖 api.js 的 getValidators
 * [OUTPUT]: 对外提供 Validators 页面组件
 * [POS]: 节点分析页，按失败率降序展示 Top 20 验证节点
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState, useEffect } from 'react'
import { getValidators } from './api'

export default function Validators() {
  const [data, setData] = useState([])

  useEffect(() => { getValidators().then(setData) }, [])

  return (
    <div className="page">
      <div className="card">
        <h2>Validator Reliability — Top 20 by Failure Rate</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Validator ID</th>
              <th>Region</th>
              <th>Total Txs</th>
              <th>Failure Rate</th>
              <th>Avg Retries</th>
            </tr>
          </thead>
          <tbody>
            {data.map(r => (
              <tr key={r.validator_id}>
                <td><code>{r.validator_id}</code></td>
                <td>{r.region}</td>
                <td>{r.total_tx.toLocaleString()}</td>
                <td>
                  <span className={`badge ${badgeClass(r.failure_rate)}`}>
                    {r.failure_rate}%
                  </span>
                </td>
                <td>{r.avg_retries}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function badgeClass(rate) {
  if (rate >= 30) return 'badge-danger'
  if (rate >= 20) return 'badge-warning'
  return 'badge-success'
}
