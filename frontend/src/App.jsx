/**
 * [INPUT]: 依赖 Overview / Protocols / Chains / Validators 四个页面组件，ThemeCtx
 * [OUTPUT]: 对外提供根组件 App，含顶部导航 + 页面切换 + 深浅模式切换
 * [POS]: 应用 shell，唯一的路由控制点与主题控制点
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { useState, useEffect } from 'react'
import Overview   from './Overview'
import Protocols  from './Protocols'
import Chains     from './Chains'
import Validators from './Validators'
import { ThemeCtx } from './ThemeContext'

const TABS = [
  { id: 'overview',   label: 'Overview'   },
  { id: 'protocols',  label: 'Protocols'  },
  { id: 'chains',     label: 'Chains'     },
  { id: 'validators', label: 'Validators' },
]

const PAGES = { overview: Overview, protocols: Protocols, chains: Chains, validators: Validators }

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  return [dark, setDark]
}

export default function App() {
  const [tab, setTab] = useState('overview')
  const [dark, setDark] = useDarkMode()
  const Page = PAGES[tab]

  return (
    <ThemeCtx.Provider value={dark}>
      <div>
        <header>
          <h1>⬡ Bridge Analytics</h1>
          <nav>
            {TABS.map(t => (
              <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </nav>
          <button
            className="theme-toggle"
            onClick={() => setDark(d => !d)}
            title={dark ? '切换到亮色模式' : '切换到深色模式'}
          >
            {dark ? '☀' : '◑'}
          </button>
        </header>
        <main><Page /></main>
      </div>
    </ThemeCtx.Provider>
  )
}
