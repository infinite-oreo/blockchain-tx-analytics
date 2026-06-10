/**
 * [INPUT]: 依赖 vite proxy 将 /api/* 转发至 Flask :5001
 * [OUTPUT]: 对外提供 9 个 fetch 函数，返回 Promise<Array>
 * [POS]: 数据层唯一出口，前端所有网络请求在此汇聚
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const get = url => fetch('/api' + url).then(r => r.json())

export const getSummary        = () => get('/summary')
export const getStatusDist     = () => get('/status-distribution')
export const getProtocolFailure= () => get('/protocol-failure-rate')
export const getGasByChain     = () => get('/gas-fee-by-chain')
export const getMonthlyTrend   = () => get('/monthly-trend')
export const getTopCorridors   = () => get('/top-corridors')
export const getLatency        = () => get('/latency-percentiles')
export const getValidators     = () => get('/validator-scorecard')
export const getProtocolScore  = () => get('/protocol-scorecard')
