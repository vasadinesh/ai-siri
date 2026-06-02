import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mic, ChevronRight, ArrowLeft, Check, Shield, Server } from 'lucide-react'
import { ROLES, LEVELS } from '../utils/roles'
import { validateKey, pingBackend, createSession } from '../utils/api'

export default function SetupPage() {
  const navigate = useNavigate()
  const [step,    setStep]   = useState(1)
  const [role,    setRole]   = useState(sessionStorage.getItem('selected_role') || 'devops')
  const [level,   setLevel]  = useState('mid')
  const [name,    setName]   = useState('')
  const [loading, setLoading]= useState(false)
  const [err,     setErr]    = useState('')

  const r = ROLES[role]

  const handleStart = async () => {
    setLoading(true); setErr('')
    try {
      await pingBackend()
      const sRes = await createSession({ candidate_name: name.trim() || null, role, level })
      const { session_token } = sRes.data
      sessionStorage.setItem('role', role)
      sessionStorage.setItem('level', level)
      sessionStorage.setItem('name', name.trim() || 'Candidate')
      sessionStorage.setItem('session_token', session_token)
      navigate('/room')
    } catch (e) {
      setErr(e.message || 'Backend unreachable. Ensure the server is running on port 4000.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen mesh-bg relative" style={{ '--role-color': r.color }}>
      <div className="grid-lines absolute inset-0 opacity-20" />
      <div className="absolute inset-x-0 top-0 h-48 pointer-events-none"
        style={{ background:`radial-gradient(ellipse 70% 100% at 50% 0%, ${r.shadow}, transparent)` }} />

      {/* ── NAV ── */}
      <nav className="app-nav relative z-10">
        <button className="btn-ghost" onClick={() => step === 1 ? navigate('/') : setStep(s => s - 1)}>
          <ArrowLeft size={14} /> Back
        </button>

        {/* Step indicator */}
        <div className="step-track">
          {[1,2,3].map(s => (
            <div key={s} className="flex items-center">
              <div className="step-dot"
                style={{
                  background: s < step ? r.color : s === step ? `${r.color}25` : 'var(--th-bg3)',
                  border: `1.5px solid ${s <= step ? r.color : 'var(--th-border)'}`,
                  color: s < step ? '#000' : s === step ? r.color : 'var(--th-text3)'
                }}>
                {s < step ? <Check size={13} /> : s}
              </div>
              {s < 3 && <div className="step-line"
                style={{ background: s < step ? r.color : 'var(--th-border)' }} />}
            </div>
          ))}
        </div>

        <span className="font-mono text-xs" style={{ color:'var(--th-text3)' }}>
          {step}/3
        </span>
      </nav>

      {/* ── CONTENT ── */}
      <div className="relative z-10 flex justify-center px-4 py-6 sm:py-10">
        <div className="setup-container">

          {/* STEP 1 — Role */}
          {step === 1 && (
            <div className="anim-fade-up">
              <div className="text-center mb-7">
                <p className="text-xs uppercase tracking-widest font-semibold mb-2" style={{ color:r.color }}>Step 1 of 3</p>
                <h2 className="font-display italic text-3xl font-bold mb-2" style={{ color:'var(--th-text)' }}>Choose Your Role</h2>
                <p className="text-sm" style={{ color:'var(--th-text2)' }}>Select the position you're interviewing for</p>
              </div>

              <div className="flex flex-col gap-2.5 mb-6">
                {Object.values(ROLES).map(ro => {
                  const sel = role === ro.id
                  return (
                    <button key={ro.id} onClick={() => setRole(ro.id)}
                      className="flex items-center gap-3 p-4 rounded-2xl text-left relative overflow-hidden"
                      style={{
                        background: sel ? ro.gradient : 'var(--th-bg2)',
                        border: `1.5px solid ${sel ? ro.color+'60' : 'var(--th-border)'}`,
                        boxShadow: sel ? `0 4px 20px ${ro.shadow}` : 'none',
                        cursor:'pointer'
                      }}>
                      {sel && <div className="absolute inset-x-0 top-0 h-px"
                        style={{ background:`linear-gradient(90deg,transparent,${ro.color},transparent)` }} />}
                      <span className="text-2xl flex-shrink-0">{ro.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm" style={{ color: sel ? ro.color : 'var(--th-text)' }}>{ro.title}</div>
                        <div className="text-xs truncate" style={{ color:'var(--th-text3)' }}>{ro.desc}</div>
                      </div>
                      <div className="w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0"
                        style={{ borderColor: sel ? ro.color : 'var(--th-border2)', background: sel ? ro.color : 'transparent' }}>
                        {sel && <Check size={11} color="#000" />}
                      </div>
                    </button>
                  )
                })}
              </div>

              <button className="btn-primary w-full" onClick={() => setStep(2)}
                style={{ background:r.color, color:'#000', padding:'13px', fontSize:14, boxShadow:`0 4px 20px ${r.shadow}` }}>
                Continue as {r.title} <ChevronRight size={15} />
              </button>
            </div>
          )}

          {/* STEP 2 — Level */}
          {step === 2 && (
            <div className="anim-fade-up">
              <div className="text-center mb-7">
                <p className="text-xs uppercase tracking-widest font-semibold mb-2" style={{ color:r.color }}>Step 2 of 3</p>
                <h2 className="font-display italic text-3xl font-bold mb-2" style={{ color:'var(--th-text)' }}>Your Experience</h2>
                <p className="text-sm" style={{ color:'var(--th-text2)' }}>Questions calibrate to your level</p>
              </div>

              <div className="flex flex-col gap-3 mb-6">
                {LEVELS.map(lv => {
                  const sel = level === lv.id
                  return (
                    <button key={lv.id} onClick={() => setLevel(lv.id)}
                      className="p-5 rounded-2xl text-left relative overflow-hidden"
                      style={{
                        background: sel ? r.gradient : 'var(--th-bg2)',
                        border: `1.5px solid ${sel ? r.color+'60' : 'var(--th-border)'}`,
                        boxShadow: sel ? `0 4px 24px ${r.shadow}` : 'none',
                        cursor:'pointer'
                      }}>
                      {sel && <div className="absolute inset-x-0 top-0 h-px"
                        style={{ background:`linear-gradient(90deg,transparent,${r.color},transparent)` }} />}
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-base" style={{ color: sel ? r.color : 'var(--th-text)' }}>{lv.label}</span>
                        <span className="font-mono text-xs px-2 py-0.5 rounded"
                          style={{ background:`${r.color}20`, color:r.color }}>{lv.years}</span>
                      </div>
                      <div className="text-sm" style={{ color:'var(--th-text2)' }}>{lv.desc}</div>
                    </button>
                  )
                })}
              </div>

              <button className="btn-primary w-full" onClick={() => setStep(3)}
                style={{ background:r.color, color:'#000', padding:'13px', fontSize:14, boxShadow:`0 4px 20px ${r.shadow}` }}>
                Continue <ChevronRight size={15} />
              </button>
            </div>
          )}

          {/* STEP 3 — Name + Start */}
          {step === 3 && (
            <div className="anim-fade-up">
              <div className="text-center mb-7">
                <p className="text-xs uppercase tracking-widest font-semibold mb-2" style={{ color:r.color }}>Step 3 of 3</p>
                <h2 className="font-display italic text-3xl font-bold mb-2" style={{ color:'var(--th-text)' }}>Final Setup</h2>
                <p className="text-sm" style={{ color:'var(--th-text2)' }}>
                  {r.icon} <strong style={{ color:r.color }}>{r.title}</strong> · <strong style={{ color:'var(--th-text)' }}>{LEVELS.find(l=>l.id===level)?.label}</strong>
                </p>
              </div>

              <div className="flex flex-col gap-4">
                {/* Name */}
                <div className="card-base p-4">
                  <label className="block text-xs font-bold uppercase tracking-widest mb-2.5" style={{ color:'var(--th-text3)' }}>
                    Your Name (optional)
                  </label>
                  <input className="field-input" type="text" value={name}
                    onChange={e => setName(e.target.value)} placeholder="e.g. Ravi Kumar"
                    maxLength={60} onKeyDown={e => e.key==='Enter' && handleStart()} />
                </div>

                {/* Security info */}
                <div className="flex items-start gap-3 p-4 rounded-2xl"
                  style={{ background:`${r.color}0a`, border:`1px solid ${r.color}30` }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background:`${r.color}20` }}>
                    <Shield size={15} style={{ color:r.color }} />
                  </div>
                  <div>
                    <div className="text-sm font-bold mb-0.5" style={{ color:'var(--th-text)' }}>API Key secured on server</div>
                    <div className="text-xs leading-relaxed" style={{ color:'var(--th-text3)' }}>
                      Your API key is configured in <code style={{ color:r.color, background:'var(--th-bg4)', padding:'1px 5px', borderRadius:4 }}>backend/.env</code> and never sent to the browser.
                    </div>
                  </div>
                </div>

                {/* Backend status */}
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl card-base">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background:'rgba(34,197,94,0.15)' }}>
                    <Server size={13} style={{ color:'#22c55e' }} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold" style={{ color:'#22c55e' }}>Backend connected ✓</div>
                    <div className="text-xs" style={{ color:'var(--th-text3)' }}>
                      Set <code style={{ color:'var(--th-text2)' }}>GROQ_API_KEY</code> in <code style={{ color:'var(--th-text2)' }}>backend/.env</code>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="p-4 rounded-xl" style={{ background:`${r.color}10`, border:`1px solid ${r.color}30` }}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color:r.color }}>Interview Summary</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      { label:'Role',      val: r.icon+' '+r.title.split(' ')[0] },
                      { label:'Level',     val: LEVELS.find(l=>l.id===level)?.label },
                      { label:'Questions', val: '7' }
                    ].map(({ label, val }) => (
                      <div key={label}>
                        <div className="text-sm font-bold truncate" style={{ color:'var(--th-text)' }}>{val}</div>
                        <div className="text-xs" style={{ color:'var(--th-text3)' }}>{label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {err && (
                  <div className="px-4 py-3 rounded-xl text-xs"
                    style={{ background:'rgba(239,68,68,0.1)', color:'#ef4444', border:'1px solid rgba(239,68,68,0.3)' }}>
                    ⚠️ {err}
                  </div>
                )}

                <button className="btn-primary w-full" onClick={handleStart} disabled={loading}
                  style={{ background:r.color, color:'#000', padding:'13px', fontSize:14,
                    boxShadow:`0 4px 20px ${r.shadow}`, opacity: loading ? 0.7 : 1 }}>
                  {loading
                    ? <span className="flex gap-1.5 items-center">
                        {[0,1,2].map(i=><span key={i} className="tdot w-2 h-2 rounded-full bg-black inline-block"/>)}
                        Connecting…
                      </span>
                    : <><Mic size={15} /> Enter Room — {r.interviewer} is waiting <ChevronRight size={15} /></>}
                </button>

                <p className="text-center text-xs" style={{ color:'var(--th-text3)' }}>
                  Chrome or Edge recommended · Microphone required
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
