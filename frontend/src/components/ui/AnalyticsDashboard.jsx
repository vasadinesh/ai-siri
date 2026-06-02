import { useInterview } from '../../context/InterviewContext'

function ScoreRing({ label, score, color, size = 62 }) {
  const r    = size * 0.38
  const circ = 2 * Math.PI * r
  const off  = circ - circ * Math.min(score||0, 100) / 100
  const grade = (score||0) >= 80 ? 'Excellent' : (score||0) >= 60 ? 'Good' : (score||0) >= 40 ? 'Fair' : 'Needs work'
  return (
    <div className="flex flex-col items-center gap-1">
      <div style={{ position:'relative', width:size, height:size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
          style={{ transform:'rotate(-90deg)', display:'block' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--th-border)" strokeWidth="4" />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="4"
            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off}
            style={{ transition:'stroke-dashoffset 0.6s ease' }} />
        </svg>
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <span className="font-display italic font-bold" style={{ fontSize:size*0.2, color, lineHeight:1 }}>
            {score||0}
          </span>
        </div>
      </div>
      <div className="text-center">
        <div className="text-xs font-semibold" style={{ color:'var(--th-text)', fontSize:10 }}>{label}</div>
        <div style={{ fontSize:9, color:'var(--th-text3)' }}>{grade}</div>
      </div>
    </div>
  )
}

function StatBar({ label, value, max, color, unit='' }) {
  const pct = Math.min(((value||0)/max)*100, 100)
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span style={{ fontSize:11, color:'var(--th-text2)' }}>{label}</span>
        <span className="font-mono font-bold" style={{ fontSize:11, color }}>{value||0}{unit}</span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background:'var(--th-border)' }}>
        <div className="h-full rounded-full" style={{ width:`${pct}%`, background:color, transition:'width 0.5s ease' }} />
      </div>
    </div>
  )
}

export default function AnalyticsDashboard({ compact = false }) {
  const { state } = useInterview()
  const a = state.analytics || {}

  const rings = [
    { label:'Fluency',    score: a.fluencyScore,    color:'#22c55e' },
    { label:'Confidence', score: a.confidenceScore, color:'#4f7cff' },
    { label:'Clarity',    score: a.clarityScore,    color:'#a855f7' }
  ]

  if (compact) {
    return (
      <div className="flex items-center gap-4 overflow-x-auto py-1">
        {rings.map(s => <ScoreRing key={s.label} {...s} size={50} />)}
        <div className="flex-1 min-w-0">
          <div style={{ fontSize:10, color:'var(--th-text3)', marginBottom:4 }}>Overall</div>
          <div className="font-display italic font-bold" style={{ color:'#f59e0b', fontSize:18 }}>
            {a.overallScore||100}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card-base p-3 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color:'var(--th-text3)', fontSize:10 }}>
          Live Analytics
        </span>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background:'#22c55e', animation:'pulse 2s infinite' }} />
          <span style={{ fontSize:10, color:'var(--th-text3)' }}>Live</span>
        </div>
      </div>

      {/* Score rings */}
      <div className="flex justify-around">
        {rings.map(s => <ScoreRing key={s.label} {...s} size={60} />)}
      </div>

      {/* Stat bars */}
      <div className="flex flex-col gap-2">
        <StatBar label="Speed"   value={a.speedWPM||0}    max={250} color="#f59e0b" unit=" wpm" />
        <StatBar label="Fillers" value={a.fillerCount||0} max={10}  color="#ef4444" unit="" />
        <StatBar label="Overall" value={a.overallScore||100} max={100} color="#22c55e" unit="%" />
      </div>

      {/* Filler words */}
      {(a.fillerWords||[]).length > 0 && (
        <div>
          <div style={{ fontSize:10, color:'var(--th-text3)', marginBottom:4 }}>Detected filler words</div>
          <div className="flex flex-wrap gap-1">
            {[...new Set(a.fillerWords)].slice(0,5).map(fw => (
              <span key={fw} className="font-mono"
                style={{ fontSize:10, padding:'2px 6px', borderRadius:6, background:'rgba(239,68,68,0.12)', color:'#ef4444', border:'1px solid rgba(239,68,68,0.25)' }}>
                "{fw}"
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {(a.suggestions||[]).length > 0 && (
        <div className="flex flex-col gap-1.5">
          {a.suggestions.slice(0,2).map((s,i) => (
            <div key={i} style={{ fontSize:11, padding:'7px 10px', borderRadius:10, background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', color:'#f59e0b', lineHeight:1.4 }}>
              💡 {s}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
