/**
 * [INPUT]: 依赖 api.js 的 getGasByChain / getTopCorridors，ThemeCtx
 * [OUTPUT]: 对外提供 Chains 页面组件
 * [POS]: 链路分析页，Gas 费柱图 + 热门通道排行表
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { getGasByChain, getTopCorridors } from './api'
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
    accent:  '#9c87f5',
  }
}

export default function Chains() {
  const dark = useDark()
  const theme = useChartTheme(dark)

  const [gas,       setGas      ] = useState([])
  const [corridors, setCorridors] = useState([])

  useEffect(() => {
    getGasByChain()  .then(setGas)
    getTopCorridors().then(setCorridors)
  }, [])

  return (
    <div className="page">
      <div className="card">
        <h2>Avg Gas Fee by Source Chain (USD)</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={gas} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
            <XAxis dataKey="src_chain" tick={{ fill: theme.tick, fontSize: 12 }} />
            <YAxis tick={{ fill: theme.tick, fontSize: 12 }} unit="$" />
            <Tooltip contentStyle={theme.tooltip} formatter={v => [`$${v}`, 'Avg Gas']} />
            <Bar dataKey="avg_gas" fill={theme.accent} radius={[3, 3, 0, 0]} name="Avg Gas" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h2>Top 10 Chain Corridors</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Corridor</th>
              <th>Transactions</th>
              <th>Total Volume (USD)</th>
            </tr>
          </thead>
          <tbody>
            {corridors.map((r, i) => (
              <tr key={i}>
                <td style={{ color: theme.tick }}>{i + 1}</td>
                <td>{r.corridor}</td>
                <td>{r.tx_count.toLocaleString()}</td>
                <td>${r.total_volume.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
