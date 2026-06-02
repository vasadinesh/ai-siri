import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trophy, RefreshCw, ArrowLeft, Clock } from 'lucide-react'
import { getLeaderboard, getStats } from '../utils/api'
import { ROLES, LEVELS } from '../utils/roles'

const ROLE_TABS  = [{ id:'all', label:'All', icon:'🏆' }, ...Object.values(ROLES).map(r=>({ id:r.id, label:r.title.split(' ')[0], icon:r.icon }))]
const LEVEL_TABS = [{ id:'all', label:'All Levels' }, ...LEVELS.map(l=>({ id:l.id, label:l.label }))]
const MEDAL      = n => n===1?{ bg:'#d4a853', text:'#000', icon:'🥇' } : n===2?{ bg:'#94a3b8', text:'#000', icon:'🥈' } : n===3?{ bg:'#b45309', text:'#fff', icon:'🥉' } : null

export default function LeaderboardPage() {
  const navigate     = useNavigate()
  const [roleTab,    setRoleTab]  = useState('all')
  const [levelTab,   setLevelTab] = useState('all')
  const [entries,    setEntries]  = useState([])
  const [stats,      setStats]    = useState(null)
  const [loading,    setLoading]  = useState(true)
  const [spinning,   setSpinning] = useState(false)

  const accentColor = ROLES[roleTab]?.color || '#d4a853'
  const accentShadow = ROLES[roleTab]?.shadow || 'rgba(212,168,83,0.15)'

  const fmtTime = s => s ? `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}` : '—'
  const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN',{ day:'2-digit', month:'short', year:'2-digit' }) : ''

  const load = async (spin=false) => {
    if (spin) setSpinning(true); else setLoading(true)
    try {
      const [lb, st] = await Promise.all([
        getLeaderboard({ role: roleTab==='all'?undefined:roleTab, level: levelTab==='all'?undefined:levelTab, limit:50 }),
        getStats()
      ])
      setEntries(lb.data.leaderboard || [])
      setStats(st.data.stats)
    } catch(e) { console.error(e.message) }
    setLoading(false); setSpinning(false)
  }

  useEffect(() => { load() }, [roleTab, levelTab])

  return (
    <div className="min-h-screen mesh-bg relative" style={{ '--role-color': accentColor }}>
      <div className="grid-lines absolute inset-0 opacity-20" />
      <div className="absolute inset-x-0 top-0 h-48 pointer-events-none"
        style={{ background:`radial-gradient(ellipse 70% 100% at 50% 0%, ${accentShadow}, transparent)` }} />

      {/* ── NAV ── */}
      <nav className="app-nav relative z-10">
        <button className="btn-ghost" onClick={() => navigate('/')}>
          <ArrowLeft size={14} /> <span className="hidden sm:inline">Home</span>
        </button>
        <div className="flex items-center gap-2">
          <Trophy size={16} style={{ color: accentColor }} />
          <span className="font-display italic font-bold text-lg"
            style={{ color:'var(--th-text)', letterSpacing:'-0.04em' }}>
            Leaderboard
          </span>
        </div>
        <button className="btn-ghost" onClick={() => load(true)}>
          <RefreshCw size={13} className={spinning?'animate-spin':''} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </nav>

      <div className="container-page relative z-10 py-6">

        {/* ── STATS CARDS ── */}
        {stats && (
          <div className="lb-stats">
            {[
              { label:'Total Sessions', value:stats.total_sessions||0,                      color:'var(--th-text)' },
              { label:'Completed',      value:stats.completed||0,                            color:accentColor },
              { label:'Avg Score',      value:stats.avg_score ? `${stats.avg_score}%` : '—', color:'#22c55e' },
              { label:'Storage',        value:'Cloud DB',                                    color:'#3b82f6', small:true }
            ].map(({ label, value, color, small }) => (
              <div key={label} className="card-base p-4 text-center">
                <div className={`font-bold mb-0.5 ${small?'text-sm':'font-display italic text-2xl'}`}
                  style={{ color, letterSpacing:'-0.02em' }}>{value}</div>
                <div className="text-xs uppercase tracking-wider" style={{ color:'var(--th-text3)' }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── ROLE TABS ── */}
        <div className="flex gap-1.5 flex-wrap mb-2">
          {ROLE_TABS.map(t => {
            const sel = roleTab === t.id
            const tc  = t.id==='all' ? '#d4a853' : ROLES[t.id]?.color || '#d4a853'
            return (
              <button key={t.id} onClick={() => setRoleTab(t.id)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold"
                style={{ background:sel?`${tc}20`:'var(--th-bg2)', border:`1px solid ${sel?tc:'var(--th-border)'}`, color:sel?tc:'var(--th-text3)', cursor:'pointer', fontFamily:'Manrope' }}>
                <span>{t.icon}</span>
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            )
          })}
        </div>

        {/* ── LEVEL TABS ── */}
        <div className="flex gap-1.5 mb-5 flex-wrap">
          {LEVEL_TABS.map(t => (
            <button key={t.id} onClick={() => setLevelTab(t.id)}
              className="px-3 py-1 rounded-lg text-xs font-semibold"
              style={{ background:levelTab===t.id?accentColor:'var(--th-bg2)', border:`1px solid ${levelTab===t.id?accentColor:'var(--th-border)'}`, color:levelTab===t.id?'#000':'var(--th-text3)', cursor:'pointer', fontFamily:'Manrope' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── ENTRIES ── */}
        {loading ? (
          <div className="flex flex-col gap-2">
            {[1,2,3,4,5].map(i => <div key={i} className="shimmer h-16 rounded-2xl" />)}
          </div>
        ) : entries.length === 0 ? (
          <div className="card-base text-center py-16 px-4">
            <div className="text-5xl mb-3">🎯</div>
            <p className="font-bold text-base mb-1" style={{ color:'var(--th-text)' }}>No entries yet</p>
            <p className="text-sm mb-4" style={{ color:'var(--th-text3)' }}>Complete an interview with your name to appear here</p>
            <button className="btn-primary" onClick={() => navigate('/setup')}
              style={{ background:accentColor, color:'#000' }}>
              Start Interview
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {entries.map((e, idx) => {
              const rank  = idx + 1
              const medal = MEDAL(rank)
              const rc    = ROLES[e.role]?.color || 'var(--th-text2)'
              const pct   = parseFloat(e.score_percentage || 0)
              const sc    = pct>=70?'#22c55e':pct>=45?'#f59e0b':'#ef4444'
              return (
                <div key={e.id} className="flex items-center gap-3 px-4 py-3 rounded-2xl msg-in"
                  style={{ background:medal?`${medal.bg}12`:'var(--th-bg2)', border:`1px solid ${medal?medal.bg+'50':'var(--th-border)'}` }}>

                  {/* Rank badge */}
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background:medal?medal.bg:'var(--th-bg4)', color:medal?medal.text:'var(--th-text3)', minWidth:32 }}>
                    {medal ? medal.icon : `#${rank}`}
                  </div>

                  {/* Name + role */}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate" style={{ color:'var(--th-text)' }}>{e.candidate_name}</div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="text-xs">{ROLES[e.role]?.icon}</span>
                      <span className="text-xs capitalize hidden sm:inline" style={{ color:rc }}>{ROLES[e.role]?.title||e.role}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded capitalize"
                        style={{ background:'var(--th-bg4)', color:'var(--th-text3)' }}>{e.level}</span>
                    </div>
                  </div>

                  {/* Correct count — hidden on xs */}
                  <div className="text-xs text-center hidden md:block flex-shrink-0" style={{ color:'var(--th-text3)' }}>
                    <div className="font-bold text-sm" style={{ color:'var(--th-text)' }}>{e.correct_count}/{e.total_questions}</div>
                    <div>correct</div>
                  </div>

                  {/* Duration — hidden on sm */}
                  <div className="hidden lg:flex items-center gap-1 text-xs flex-shrink-0" style={{ color:'var(--th-text3)' }}>
                    <Clock size={11} /> {fmtTime(e.duration_seconds)}
                  </div>

                  {/* Date — hidden on sm */}
                  <div className="text-xs flex-shrink-0 hidden lg:block" style={{ color:'var(--th-text3)' }}>
                    {fmtDate(e.completed_at)}
                  </div>

                  {/* Score */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="w-16 h-1.5 rounded-full hidden sm:block" style={{ background:'var(--th-border)' }}>
                      <div className="h-full rounded-full" style={{ width:`${pct}%`, background:sc }} />
                    </div>
                    <div className="font-display italic font-bold text-sm w-10 text-right" style={{ color:sc }}>
                      {pct.toFixed(0)}%
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── ROLE AVERAGES ── */}
        {stats && (
          <div className="mt-8">
            <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color:'var(--th-text3)' }}>
              Average score by role
            </p>
            <div className="lb-role-grid">
              {Object.values(ROLES).map(ro => {
                const avg = stats[`${ro.id}_avg`]
                const cnt = stats[`${ro.id}_count`]
                return (
                  <div key={ro.id} className="card-base p-3 text-center">
                    <div className="text-xl mb-1">{ro.icon}</div>
                    <div className="font-display italic text-lg font-bold mb-0.5" style={{ color:ro.color }}>
                      {avg ? `${avg}%` : '—'}
                    </div>
                    <div className="text-xs" style={{ color:'var(--th-text3)' }}>{cnt||0} sessions</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
