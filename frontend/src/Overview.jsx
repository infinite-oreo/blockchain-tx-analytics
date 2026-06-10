/**
 * [INPUT]: 依赖 api.js 的 getSummary / getStatusDist / getMonthlyTrend，ThemeCtx
 * [OUTPUT]: 对外提供 Overview 页面组件
 * [POS]: 首屏总览，KPI 卡片 + 状态饼图 + 月度成功率折线图
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState, useEffect } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { getSummary, getStatusDist, getMonthlyTrend } from './api'
import { useDark } from './ThemeContext'

const STATUS_COLOR = {
  confirmed: '#3d8a5c',
  failed:    '#c0392b',
  pending:   '#a0622a',
  timeout:   '#d97757',
}

function useChartTheme(dark) {
  return {
    tooltip: {
      background:  dark ? '#30302e' : '#faf9f5',
      border:      `1px solid ${dark ? '#3e3e38' : '#dad9d4'}`,
      color:       dark ? '#c3c0b6' : '#3d3929',
      fontSize:    12,
      borderRadius: 6,
    },
    grid:    dark ? '#3e3e38' : '#dad9d4',
    tick:    dark ? '#b7b5a9' : '#83827d',
    primary: dark ? '#d97757' : '#c96442',
  }
}

export default function Overview() {
  const dark = useDark()
  const theme = useChartTheme(dark)

  const [summary, setSummary] = useState(null)
  const [pie,     setPie    ] = useState([])
  const [trend,   setTrend  ] = useState([])

  useEffect(() => {
    getSummary()    .then(d => setSummary(d[0]))
    getStatusDist() .then(setPie)
    getMonthlyTrend().then(setTrend)
  }, [])

  return (
    <div className="page">
      {summary && (
        <div className="kpi-row">
          <KpiCard label="Total Transactions" value={summary.total_tx.toLocaleString()} />
          <KpiCard label="Success Rate"        value={`${summary.success_rate}%`}         accent="success" />
          <KpiCard label="Volume Bridged"       value={`$${summary.volume_m_usd}M`} />
          <KpiCard label="Avg Latency"          value={`${summary.avg_latency_ms}ms`} />
          <KpiCard label="Active Validators"    value={summary.active_validators} />
        </div>
      )}

      <div className="chart-row">
        <div className="card">
          <h2>Status Distribution</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pie} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2}>
                {pie.map(d => <Cell key={d.status} fill={STATUS_COLOR[d.status] || theme.tick} />)}
              </Pie>
              <Tooltip contentStyle={theme.tooltip} formatter={(v, n) => [`${v} txs`, n]} />
              <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ color: theme.tick, fontSize: 12 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2>Monthly Success Rate</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trend} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
              <XAxis dataKey="month" tick={{ fill: theme.tick, fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fill: theme.tick, fontSize: 11 }} unit="%" />
              <Tooltip contentStyle={theme.tooltip} formatter={v => [`${v}%`, 'Success Rate']} />
              <Line type="monotone" dataKey="success_rate" stroke={theme.primary} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function KpiCard({ label, value, accent }) {
  return (
    <div className={`kpi-card${accent ? ` ${accent}` : ''}`}>
      <span className="kpi-value">{value ?? '—'}</span>
      <span className="kpi-label">{label}</span>
    </div>
  )
}
