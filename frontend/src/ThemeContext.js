/**
 * [INPUT]: 无外部依赖
 * [OUTPUT]: 对外提供 ThemeCtx（Context）和 useDark（hook）
 * [POS]: 全局主题状态的单一真相源，供图表组件读取 dark 布尔值
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { createContext, useContext } from 'react'

export const ThemeCtx = createContext(false)
export const useDark  = () => useContext(ThemeCtx)
