import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RotateCcw, Home, ChevronRight, Trophy } from 'lucide-react'
import { ROLES, LEVELS } from '../utils/roles'
import useSpeech from '../hooks/useSpeech'

const CIRC   = 2 * Math.PI * 46
const GRADES = [
  { min:85, emoji:'🏆', label:'Outstanding!',  color:'#22c55e', msg:'Exceptional performance. You demonstrated deep expertise.' },
  { min:70, emoji:'🎯', label:'Great Job!',     color:'#4f7cff', msg:'Strong performance. You know your fundamentals well.' },
  { min:50, emoji:'👍', label:'Good Effort',    color:'#f59e0b', msg:'Solid foundation. Review the missed topics to improve.' },
  { min:0,  emoji:'📚', label:'Keep Learning',  color:'#ef4444', msg:'Use this feedback as your study roadmap and try again.' }
]

function ScoreRing({ score, color }) {
  const [offset, setOffset] = useState(CIRC)
  useEffect(() => { setTimeout(() => setOffset(CIRC - CIRC * score / 100), 300) }, [score])
  const size = 140, r = 46
  return (
    <div className="score-ring-wrap" style={{ width:size, height:size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
        style={{ transform:'rotate(-90deg)', display:'block' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--th-border2)" strokeWidth="7" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="7"
          strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={offset}
          className="score-arc-anim" />
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <span className="font-display italic font-extrabold"
          style={{ fontSize:28, color, letterSpacing:'-0.04em', lineHeight:1 }}>{score}%</span>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color:'var(--th-text3)' }}>score</span>
      </div>
    </div>
  )
}

function AnalyticsBars({ analytics }) {
  if (!analytics?.fluencyScore) return null
  const items = [
    { label:'Fluency',    value:analytics.fluencyScore,    color:'#22c55e' },
    { label:'Confidence', value:analytics.confidenceScore, color:'#4f7cff' },
    { label:'Clarity',    value:analytics.clarityScore,    color:'#a855f7' },
    { label:'Overall',    value:analytics.overallScore,    color:'#f59e0b' },
  ]
  return (
    <div className="card-base p-4 w-full">
      <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color:'var(--th-text3)' }}>Communication Analysis</p>
      <div className="flex flex-col gap-2.5">
        {items.map(({ label, value, color }) => (
          <div key={label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs" style={{ color:'var(--th-text2)' }}>{label}</span>
              <span className="text-xs font-bold font-mono" style={{ color }}>{value ?? '—'}</span>
            </div>
            <div className="h-1.5 rounded-full" style={{ background:'var(--th-border)' }}>
              <div className="h-full rounded-full score-arc-anim"
                style={{ width:`${value ?? 0}%`, background:color }} />
            </div>
          </div>
        ))}
      </div>
      {analytics.fillerWords?.length > 0 && (
        <div className="mt-3">
          <p className="text-xs mb-1.5" style={{ color:'var(--th-text3)' }}>Filler words detected</p>
          <div className="flex flex-wrap gap-1">
            {[...new Set(analytics.fillerWords)].map(fw => (
              <span key={fw} className="text-xs px-2 py-0.5 rounded-lg font-mono"
                style={{ background:'rgba(239,68,68,0.1)', color:'#ef4444', border:'1px solid rgba(239,68,68,0.25)' }}>
                "{fw}"
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ResultsPage() {
  const navigate  = useNavigate()
  const { speak } = useSpeech()
  const [visible, setVisible] = useState(false)

  const raw  = sessionStorage.getItem('results')
  const data = raw ? JSON.parse(raw) : { correct:0, partial:0, wrong:0, total:7, elapsed:0, role:'devops', level:'mid', name:'Candidate' }
  const r         = ROLES[data.role] || ROLES.devops
  const score     = Math.round(((data.correct + (data.partial||0)*0.5) / data.total)*100)
  const grade     = GRADES.find(g => score >= g.min)
  const levelLabel= LEVELS.find(l => l.id===data.level)?.label || 'Mid'
  const fmtTime   = s => `${String(Math.floor((s||0)/60)).padStart(2,'0')}:${String((s||0)%60).padStart(2,'0')}`

  useEffect(() => {
    setTimeout(() => setVisible(true), 80)
    setTimeout(() => speak(`Interview complete, ${data.name}! You scored ${score} percent. ${grade.label}! ${grade.msg}`, { rate:0.9 }), 500)
  }, [])

  return (
    <div className="min-h-screen mesh-bg relative overflow-x-hidden"
      style={{ '--role-color':r.color }}>
      <div className="grid-lines absolute inset-0 opacity-20" />
      <div className="absolute inset-x-0 top-0 h-52 pointer-events-none"
        style={{ background:`radial-gradient(ellipse 70% 100% at 50% 0%, ${r.shadow}, transparent)` }} />

      <div className={`relative z-10 flex flex-col items-center px-4 py-8 transition-all duration-500 ${visible?'opacity-100 translate-y-0':'opacity-0 translate-y-4'}`}>
        <div className="w-full max-w-md flex flex-col items-center gap-5">

          {/* Role + name chip */}
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold"
            style={{ background:`${r.color}18`, border:`1px solid ${r.color}40`, color:r.color }}>
            {r.icon} {r.title} · {levelLabel}
          </div>

          {/* Score ring */}
          <ScoreRing score={score} color={grade.color} />

          {/* Grade */}
          <div className="text-center">
            <div className="text-4xl mb-2">{grade.emoji}</div>
            <h2 className="font-display italic text-2xl font-bold mb-1"
              style={{ color:'var(--th-text)', letterSpacing:'-0.04em' }}>{grade.label}</h2>
            <p className="text-sm leading-relaxed max-w-xs mx-auto" style={{ color:'var(--th-text2)' }}>{grade.msg}</p>
          </div>

          {/* Stats grid */}
          <div className="results-stats w-full">
            {[
              { label:'Correct',   value:data.correct,          color:'#22c55e' },
              { label:'Partial',   value:data.partial||0,       color:'#f59e0b' },
              { label:'Wrong',     value:data.wrong||0,         color:'#ef4444' },
              { label:'Duration',  value:fmtTime(data.elapsed), color:'var(--th-text2)', small:true }
            ].map(({ label, value, color, small }) => (
              <div key={label} className="card-base p-3 text-center">
                <div className={`font-bold mb-0.5 ${small?'text-xs font-mono':'font-display italic text-2xl'}`}
                  style={{ color, letterSpacing:'-0.02em' }}>{value}</div>
                <div className="text-xs uppercase tracking-wider" style={{ color:'var(--th-text3)' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Communication analytics */}
          <AnalyticsBars analytics={data.analytics} />

          {/* Interviewer sign-off */}
          <div className="w-full rounded-2xl p-4 relative overflow-hidden"
            style={{ background:`${r.color}0a`, border:`1px solid ${r.color}30` }}>
            <div className="absolute inset-x-0 top-0 h-px"
              style={{ background:`linear-gradient(90deg,transparent,${r.color}80,transparent)` }} />
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                style={{ background:r.color, color:'#000' }}>{r.icon}</div>
              <span className="text-sm font-bold" style={{ color:'var(--th-text)' }}>{r.interviewer} says…</span>
            </div>
            <p className="text-sm italic leading-relaxed" style={{ color:'var(--th-text2)' }}>
              "{score >= 70
                ? `Really solid work today. Keep building on this foundation.`
                : `This was a valuable exercise. Review today's topics and come back stronger.`}"
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2.5 w-full">
            <button className="btn-primary flex-1" onClick={() => navigate('/room')}
              style={{ background:r.color, color:'#000', padding:'12px', fontSize:13, boxShadow:`0 4px 18px ${r.shadow}` }}>
              <RotateCcw size={14} /> Try Again
            </button>
            <button className="btn-primary flex-1" onClick={() => navigate('/setup')}
              style={{ background:'var(--th-bg2)', color:'var(--th-text)', padding:'12px', fontSize:13, border:'1px solid var(--th-border)' }}
              onMouseEnter={e=>{ e.currentTarget.style.borderColor=r.color; e.currentTarget.style.color=r.color }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor='var(--th-border)'; e.currentTarget.style.color='var(--th-text)' }}>
              <ChevronRight size={14} /> New Role
            </button>
            <button className="btn-primary" onClick={() => navigate('/')}
              style={{ background:'var(--th-bg2)', color:'var(--th-text3)', padding:'12px 14px', border:'1px solid var(--th-border)' }}
              onMouseEnter={e=>e.currentTarget.style.color='var(--th-text)'}
              onMouseLeave={e=>e.currentTarget.style.color='var(--th-text3)'}>
              <Home size={14} />
            </button>
          </div>

          <button className="flex items-center gap-1.5 text-xs" onClick={() => navigate('/leaderboard')}
            style={{ background:'none', border:'none', cursor:'pointer', color:'var(--th-text3)', fontFamily:'Manrope' }}
            onMouseEnter={e=>e.currentTarget.style.color='var(--th-text)'}
            onMouseLeave={e=>e.currentTarget.style.color='var(--th-text3)'}>
            <Trophy size={13} /> View Leaderboard
          </button>
        </div>
      </div>
    </div>
  )
}
