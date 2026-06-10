/**
 * [INPUT]: 依赖 api.js 的 getProtocolFailure / getLatency / getProtocolScore，ThemeCtx
 * [OUTPUT]: 对外提供 Protocols 页面组件
 * [POS]: 协议分析页，失败率横向柱图 + 延迟分组柱图 + 综合评分表
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { getProtocolFailure, getLatency, getProtocolScore } from './api'
import { useDark } from './ThemeContext'

function useChartTheme(dark) {
  return {
    tooltip: {
      background:   dark ? '#30302e' : '#faf9f5',
      border:       `1px solid ${dark ? '#3e3e38' : '#dad9d4'}`,
      color:        dark ? '#c3c0b6' : '#3d3929',
      fontSize:     12,
      borderRadius: 6,
    },
    grid:    dark ? '#3e3e38' : '#dad9d4',
    tick:    dark ? '#b7b5a9' : '#83827d',
    danger:  dark ? '#e05c4b' : '#c0392b',
    success: dark ? '#4caf7a' : '#3d8a5c',
    primary: dark ? '#d97757' : '#c96442',
  }
}

export default function Protocols() {
  const dark = useDark()
  const theme = useChartTheme(dark)

  const [failure, setFailure] = useState([])
  const [latency, setLatency] = useState([])
  const [scores,  setScores ] = useState([])

  useEffect(() => {
    getProtocolFailure().then(setFailure)
    getLatency()        .then(setLatency)
    getProtocolScore()  .then(setScores)
  }, [])

  return (
    <div className="page">
      <div className="chart-row">
        <div className="card">
          <h2>Protocol Failure Rate</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={failure} layout="vertical" margin={{ left: 56, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
              <XAxis type="number" unit="%" tick={{ fill: theme.tick, fontSize: 11 }} />
              <YAxis type="category" dataKey="protocol" tick={{ fill: theme.tick, fontSize: 11 }} width={56} />
              <Tooltip contentStyle={theme.tooltip} formatter={v => [`${v}%`, 'Failure Rate']} />
              <Bar dataKey="failure_rate" fill={theme.danger} radius={[0, 3, 3, 0]} name="Failure Rate" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2>Latency by Protocol (ms)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={latency} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
              <XAxis dataKey="protocol" tick={{ fill: theme.tick, fontSize: 11 }} />
              <YAxis tick={{ fill: theme.tick, fontSize: 11 }} />
              <Tooltip contentStyle={theme.tooltip} formatter={(v, n) => [`${v} ms`, n]} />
              <Legend iconSize={8} formatter={v => <span style={{ color: theme.tick, fontSize: 12 }}>{v}</span>} />
              <Bar dataKey="min_ms" fill={theme.success} name="Min" />
              <Bar dataKey="avg_ms" fill={theme.primary}  name="Avg" />
              <Bar dataKey="max_ms" fill={theme.danger}   name="Max" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h2>Composite Scorecard</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Protocol</th>
              <th>Success Rate</th>
              <th>Avg Latency</th>
              <th>Avg Gas (USD)</th>
            </tr>
          </thead>
          <tbody>
            {scores.map(r => (
              <tr key={r.protocol}>
                <td>{r.protocol}</td>
                <td>
                  <span className={`badge ${r.success_rate >= 80 ? 'badge-success' : 'badge-danger'}`}>
                    {r.success_rate}%
                  </span>
                </td>
                <td>{r.avg_latency} ms</td>
                <td>${r.avg_gas}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
