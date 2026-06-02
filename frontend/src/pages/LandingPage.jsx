import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mic, ChevronRight, Zap, Shield, BarChart2 } from 'lucide-react'
import { ROLES } from '../utils/roles'
import SiriOrb from '../components/ui/SiriOrb'

const STATS    = [{ num:'5', label:'Career Tracks' },{ num:'3', label:'Experience Levels' },{ num:'7', label:'Questions Each' },{ num:'AI', label:'Powered' }]
const FEATURES = [
  { icon: Mic,       title: 'Voice-to-Voice',     desc: 'Speak your answers. AI transcribes in real time.' },
  { icon: BarChart2, title: 'Live Analytics',      desc: 'Fluency, confidence, clarity scored as you speak.' },
  { icon: Zap,       title: 'Adaptive Difficulty', desc: 'Questions adapt based on your performance.' },
  { icon: Shield,    title: 'Secure by Design',    desc: 'API key lives on the server. Never in your browser.' },
]

export default function LandingPage() {
  const navigate     = useNavigate()
  const [active,     setActive]  = useState('devops')
  const [orbState,   setOrbState]= useState('idle')
  const [loaded,     setLoaded]  = useState(false)

  useEffect(() => {
    setTimeout(() => setLoaded(true), 60)
    const states = ['idle','speaking','listening','thinking','idle']
    let i = 0
    const id = setInterval(() => { i=(i+1)%states.length; setOrbState(states[i]) }, 2800)
    return () => clearInterval(id)
  }, [])

  const role = ROLES[active]

  return (
    <div className="min-h-screen mesh-bg relative overflow-x-hidden"
      style={{ '--role-color': role.color, '--mesh1': `${role.color}08` }}>
      <div className="grid-lines absolute inset-0" />

      {/* Ambient glow */}
      <div className="absolute inset-x-0 top-0 h-64 pointer-events-none"
        style={{ background: `radial-gradient(ellipse 80% 100% at 50% 0%, ${role.color}12, transparent)`, transition: 'background 0.6s ease' }} />

      {/* ── NAV ── */}
      <nav className="app-nav">
        <div className="nav-logo" onClick={() => navigate('/')} style={{ cursor:'pointer' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center no-transition flex-shrink-0"
            style={{ background: role.color }}>
            <Mic size={15} color="#000" strokeWidth={2.5} />
          </div>
          <span className="font-display italic text-base font-bold hidden sm:block"
            style={{ color:'var(--th-text)', letterSpacing:'-0.03em' }}>
            Interview<span style={{ color: role.color }}>AI</span>
          </span>
        </div>

        <div className="nav-actions">
          <button className="btn-ghost" onClick={() => navigate('/leaderboard')}>
            🏆 <span className="hidden sm:inline">Leaderboard</span>
          </button>
          <button className="btn-primary" onClick={() => navigate('/setup')}
            style={{ background: role.color, color:'#000', padding:'8px 16px' }}>
            <span className="hidden sm:inline">Start Interview</span>
            <span className="sm:hidden">Start</span>
            <ChevronRight size={15} />
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div className="container-page relative z-10 pt-8 pb-4">
        <div className={`hero-grid transition-all duration-500 ${loaded ? 'opacity-100' : 'opacity-0 translate-y-4'}`}>

          {/* Left: copy */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-5"
              style={{ background:`${role.color}18`, border:`1px solid ${role.color}40`, color:role.color }}>
              <Zap size={11} /> AI Voice Interview Simulator
            </div>

            <h1 className="font-display italic font-bold leading-tight mb-4"
              style={{ fontSize:'clamp(34px,5.5vw,62px)', color:'var(--th-text)', letterSpacing:'-0.04em' }}>
              Practice. Speak.<br />
              <span style={{ color: role.color }}>Get Hired.</span>
            </h1>

            <p className="text-base leading-relaxed mb-7 max-w-lg mx-auto lg:mx-0"
              style={{ color:'var(--th-text2)' }}>
              Real AI interviewer. Live voice conversation. Real-time fluency
              and confidence analysis. 5 career tracks.
            </p>

            <div className="flex flex-wrap items-center gap-3 justify-center lg:justify-start">
              <button className="btn-primary" onClick={() => navigate('/setup')}
                style={{ background:role.color, color:'#000', padding:'13px 28px', fontSize:15, boxShadow:`0 6px 24px ${role.shadow}` }}>
                <Mic size={17} /> Begin Interview <ChevronRight size={17} />
              </button>
              <button className="btn-ghost" onClick={() => navigate('/leaderboard')}>
                🏆 View Scores
              </button>
            </div>
          </div>

          {/* Right: Siri orb — hidden on small, shown md+ */}
          <div className="hidden md:flex flex-col items-center gap-3 flex-shrink-0">
            <div className={`no-transition ${orbState==='speaking'?'orb-speaking':orbState==='listening'?'orb-listening':'orb-idle'}`}
              style={{ '--orb-color': `${role.color}80` }}>
              <SiriOrb state={orbState} color={role.color} size={180} />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-center"
              style={{ color:'var(--th-text3)' }}>
              {orbState==='speaking'?`${role.interviewer} is speaking`:
               orbState==='listening'?'Listening to you':
               orbState==='thinking'?'Analyzing answer…':'AI Interviewer'}
            </p>
          </div>
        </div>

        {/* ── STATS ── */}
        <div className="stats-row">
          {STATS.map(({ num, label }) => (
            <div key={label} className="text-center">
              <div className="font-display italic text-3xl font-bold mb-0.5"
                style={{ color:role.color }}>{num}</div>
              <div className="text-xs uppercase tracking-widest" style={{ color:'var(--th-text3)' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* ── ROLE CARDS ── */}
        <div className="mb-8">
          <div className="text-center mb-5">
            <p className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color:'var(--th-text3)' }}>5 Career Tracks</p>
            <h2 className="font-display italic text-2xl font-bold" style={{ color:'var(--th-text)' }}>Choose your path</h2>
          </div>

          <div className="role-grid">
            {Object.values(ROLES).map(ro => {
              const sel = active === ro.id
              return (
                <button key={ro.id} onClick={() => setActive(ro.id)}
                  className="card-hover text-left p-4 rounded-2xl relative overflow-hidden"
                  style={{
                    background: sel ? ro.gradient : 'var(--th-bg2)',
                    border: `1.5px solid ${sel ? ro.color+'55' : 'var(--th-border)'}`,
                    boxShadow: sel ? `0 6px 24px ${ro.shadow}` : 'none',
                    cursor:'pointer'
                  }}>
                  {sel && <div className="absolute top-0 inset-x-0 h-px"
                    style={{ background:`linear-gradient(90deg,transparent,${ro.color},transparent)` }} />}
                  <div className="text-2xl mb-2">{ro.icon}</div>
                  <div className="font-bold text-sm mb-0.5" style={{ color: sel ? ro.color : 'var(--th-text)' }}>
                    {ro.title}
                  </div>
                  <div className="text-xs leading-relaxed" style={{ color:'var(--th-text3)' }}>
                    {ro.desc}
                  </div>
                  {sel && (
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {ro.topics.slice(0,2).map(t => (
                        <span key={t} className="text-xs px-1.5 py-0.5 rounded"
                          style={{ background:`${ro.color}20`, color:ro.color }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── ACTIVE ROLE DETAIL ── */}
        <div className="rounded-2xl p-5 relative overflow-hidden mb-12"
          style={{ background: role.gradient, border:`1px solid ${role.color}30` }}>
          <div className="absolute inset-x-0 top-0 h-px"
            style={{ background:`linear-gradient(90deg,transparent,${role.color}80,transparent)` }} />
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{role.icon}</span>
                <span className="font-bold text-base" style={{ color:role.color }}>{role.title}</span>
              </div>
              <p className="text-sm mb-2" style={{ color:'var(--th-text2)' }}>
                Interviewed by <strong style={{ color:'var(--th-text)' }}>{role.interviewer}</strong>, {role.interviewerTitle}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {role.topics.map(t => (
                  <span key={t} className="text-xs px-2 py-0.5 rounded-lg font-medium"
                    style={{ background:`${role.color}18`, color:role.color, border:`1px solid ${role.color}30` }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <button className="btn-primary no-transition flex-shrink-0"
              style={{ background:role.color, color:'#000', alignSelf:'flex-start' }}
              onClick={() => { sessionStorage.setItem('selected_role', role.id); navigate('/setup') }}>
              Start as {role.title.split(' ')[0]} <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* ── FEATURES ── */}
        <div>
          <div className="text-center mb-5">
            <p className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color:'var(--th-text3)' }}>Platform</p>
            <h2 className="font-display italic text-2xl font-bold" style={{ color:'var(--th-text)' }}>Built different</h2>
          </div>
          <div className="feature-grid">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card-base p-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                  style={{ background:`${role.color}18` }}>
                  <Icon size={15} style={{ color:role.color }} />
                </div>
                <div className="font-bold text-sm mb-1" style={{ color:'var(--th-text)' }}>{title}</div>
                <div className="text-xs leading-relaxed" style={{ color:'var(--th-text3)' }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
