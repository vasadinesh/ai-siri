import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mic, Square, ChevronRight, Trophy, Clock, CheckCircle, XCircle, AlertCircle, BarChart2, X } from 'lucide-react'
import { ROLES, TOTAL_QUESTIONS } from '../utils/roles'
import { generateQ, gradeAnswer, transcribeAudio, completeSession, getEncouragement, getClosingSummary } from '../utils/api'
import { useInterview } from '../context/InterviewContext'
import useSpeech          from '../hooks/useSpeech'
import useRecorder        from '../hooks/useRecorder'
import useSpeechAnalysis  from '../hooks/useSpeechAnalysis'
import useSilenceDetector from '../hooks/useSilenceDetector'
import SiriOrb            from '../components/ui/SiriOrb'
import LiveWaveform       from '../components/ui/LiveWaveform'
import AnalyticsDashboard from '../components/ui/AnalyticsDashboard'

/* ─── Score pill ───────────────────────────────────────── */
function VerdictPill({ verdict }) {
  const cfg = {
    correct: { icon: CheckCircle, label: 'Correct',           color: '#22c55e', bg: 'rgba(34,197,94,0.15)',  border: 'rgba(34,197,94,0.4)' },
    partial:  { icon: AlertCircle, label: 'Partially Correct', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)' },
    wrong:    { icon: XCircle,     label: 'Incorrect',         color: '#ef4444', bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.4)' }
  }
  const c = cfg[verdict] || cfg.wrong
  const Icon = c.icon
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full"
      style={{ background: c.bg, border: `1px solid ${c.border}` }}>
      <Icon size={15} style={{ color: c.color }} />
      <span className="text-sm font-bold" style={{ color: c.color }}>{c.label}</span>
    </div>
  )
}

/* ─── Q-progress dots ───────────────────────────────────── */
function QDots({ current, total }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="qdot"
          style={{
            width:  i === current - 1 ? 22 : 7,
            height: 7,
            borderRadius: i === current - 1 ? 4 : '50%',
            background: i < current - 1
              ? '#22c55e'
              : i === current - 1
                ? 'rgba(255,255,255,0.9)'
                : 'rgba(255,255,255,0.2)'
          }} />
      ))}
    </div>
  )
}

/* ─── Countdown ring ────────────────────────────────────── */
function CountdownRing({ count, onClick }) {
  const r = 22, circ = 2 * Math.PI * r
  return (
    <button onClick={onClick}
      style={{ background:'none', border:'none', padding:0, cursor:'pointer', position:'relative', width:60, height:60, flexShrink:0 }}>
      <svg width="60" height="60" viewBox="0 0 60 60"
        style={{ position:'absolute', top:0, left:0, transform:'rotate(-90deg)' }}>
        <circle cx="30" cy="30" r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
        <circle cx="30" cy="30" r={r} fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="3"
          strokeLinecap="round" strokeDasharray={circ}
          strokeDashoffset={circ - circ*(count/3)}
          style={{ transition:'stroke-dashoffset 0.9s linear' }} />
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <span className="countdown-ring font-display italic font-extrabold"
          style={{ fontSize:20, color:'rgba(255,255,255,0.9)' }}>{count}</span>
      </div>
    </button>
  )
}

/* ─── Analytics overlay panel ───────────────────────────── */
function AnalyticsOverlay({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)' }}
      onClick={onClose}>
      <div className="w-full max-w-sm rounded-3xl p-5 relative"
        style={{ background:'rgba(14,10,40,0.96)', border:'1px solid rgba(255,255,255,0.12)' }}
        onClick={e => e.stopPropagation()}>
        <button onClick={onClose}
          style={{ position:'absolute', top:14, right:14, background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.5)' }}>
          <X size={18} />
        </button>
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color:'rgba(255,255,255,0.4)' }}>
          Live Analytics
        </p>
        <AnalyticsDashboard />
      </div>
    </div>
  )
}

/* ─── Feedback overlay ───────────────────────────────────── */
function FeedbackOverlay({ verdict, scoreReason, correctSummary, improvementTip, onNext, isLast }) {
  const cfg = {
    correct: { color:'#22c55e', bg:'rgba(34,197,94,0.1)',  border:'rgba(34,197,94,0.3)',  icon:'✓' },
    partial:  { color:'#f59e0b', bg:'rgba(245,158,11,0.1)', border:'rgba(245,158,11,0.3)', icon:'◐' },
    wrong:    { color:'#ef4444', bg:'rgba(239,68,68,0.1)',  border:'rgba(239,68,68,0.3)',  icon:'✗' }
  }
  const c = cfg[verdict] || cfg.wrong
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center p-4 sm:items-center"
      style={{ background:'rgba(0,0,0,0.65)', backdropFilter:'blur(10px)' }}>
      <div className="w-full max-w-md rounded-3xl overflow-hidden"
        style={{ background:'rgba(12,8,35,0.97)', border:`1px solid ${c.border}` }}>
        {/* Verdict header */}
        <div className="px-6 py-4 flex items-center gap-3"
          style={{ background: c.bg, borderBottom:`1px solid ${c.border}` }}>
          <span className="text-xl font-bold" style={{ color:c.color }}>{c.icon}</span>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color:c.color }}>
              {verdict === 'correct' ? 'Correct Answer' : verdict === 'partial' ? 'Partially Correct' : 'Incorrect'}
            </p>
            <p className="text-sm mt-0.5" style={{ color:'rgba(255,255,255,0.7)' }}>{scoreReason}</p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">
          {verdict !== 'correct' && correctSummary && (
            <div className="rounded-2xl p-4"
              style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)' }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color:'rgba(255,255,255,0.4)' }}>
                ✍️ Model Answer
              </p>
              <p className="text-sm leading-relaxed" style={{ color:'rgba(255,255,255,0.85)' }}>{correctSummary}</p>
            </div>
          )}
          {improvementTip && (
            <p className="text-sm" style={{ color:'rgba(255,255,255,0.5)' }}>
              💡 {improvementTip}
            </p>
          )}

          <button onClick={onNext}
            className="btn-primary w-full no-transition"
            style={{ background:'rgba(255,255,255,0.12)', color:'rgba(255,255,255,0.9)', padding:'13px', fontSize:14, border:'1px solid rgba(255,255,255,0.2)' }}>
            {isLast ? <><Trophy size={15} /> View Results</> : <>Next Question <ChevronRight size={15} /></>}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   MAIN ROOM — Full-screen Siri mode
══════════════════════════════════════════════════════════ */
export default function RoomPage() {
  const navigate = useNavigate()
  const { dispatch } = useInterview()
  const { speak, cancel: cancelSpeech, isSpeaking } = useSpeech()
  const { isRecording, startRecording, stopRecording, cancelRecording, micError } = useRecorder()
  const { startAnalysis, analyze, stopAnalysis } = useSpeechAnalysis()

  const roleId       = sessionStorage.getItem('role')          || 'devops'
  const level        = sessionStorage.getItem('level')         || 'mid'
  const candName     = sessionStorage.getItem('name')          || 'Candidate'
  const sessionToken = sessionStorage.getItem('session_token') || ''
  const r            = ROLES[roleId]

  /* ── UI state ── */
  const [orbState,      setOrbState]      = useState('idle')
  const [statusLine,    setStatusLine]    = useState('Joining interview…')
  const [subLine,       setSubLine]       = useState('')
  const [currentQ,      setCurrentQ]      = useState(0)
  const [correct,       setCorrect]       = useState(0)
  const [partial,       setPartial]       = useState(0)
  const [wrong,         setWrong]         = useState(0)
  const [elapsed,       setElapsed]       = useState(0)
  const [countdown,     setCountdown]     = useState(null)
  const [processing,    setProcessing]    = useState(false)
  const [answered,      setAnswered]      = useState(false)
  const [feedback,      setFeedback]      = useState(null)   // shows FeedbackOverlay
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [liveA,         setLiveA]         = useState({ fluencyScore:100, confidenceScore:100, clarityScore:100, overallScore:100, speedWPM:0, fillerCount:0, fillerWords:[], suggestions:[] })

  /* ── interview state ── */
  const [curQText,      setCurQText]      = useState('')
  const [curKeywords,   setCurKeywords]   = useState([])
  const [curQuestionId, setCurQuestionId] = useState(null)
  const [answerStart,   setAnswerStart]   = useState(null)
  const [diffLevel,     setDiffLevel]     = useState(2)
  const [topics,        setTopics]        = useState([])
  const [convHistory,   setConvHistory]   = useState([])

  const timerRef     = useRef(null)
  const startedRef   = useRef(false)
  const cdRef        = useRef(null)
  const analysisInt  = useRef(null)
  const liveText     = useRef('')

  /* ── guards ── */
  useEffect(() => { if (!sessionToken) navigate('/') }, [sessionToken])

  /* ── session timer ── */
  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  /* ── sync orb to interview state ── */
  useEffect(() => {
    if      (isSpeaking)                  setOrbState('speaking')
    else if (isRecording)                 setOrbState('listening')
    else if (processing)                  setOrbState('thinking')
    else if (countdown !== null)          setOrbState('countdown')
    else                                  setOrbState('idle')
  }, [isSpeaking, isRecording, processing, countdown])

  /* ── live speech analysis ── */
  useEffect(() => {
    if (isRecording) {
      startAnalysis()
      analysisInt.current = setInterval(() => {
        if (liveText.current.length > 4) {
          const res = analyze(liveText.current)
          setLiveA(res)
          dispatch({ type: 'UPDATE_ANALYTICS', payload: res })
        }
      }, 1800)
    } else {
      clearInterval(analysisInt.current)
      stopAnalysis()
    }
    return () => clearInterval(analysisInt.current)
  }, [isRecording])

  /* ── silence detector ── */
  const silenceDetector = useSilenceDetector({
    silenceThreshold: 9,
    onSilence: async (secs) => {
      if (!isRecording || answered || processing) return
      try {
        const res = await getEncouragement({ role: roleId, level, context: secs > 15 ? 'struggling' : 'silence' })
        speak(res.data.text)
        setSubLine(res.data.text)
      } catch {}
    }
  })

  const cancelCountdown = useCallback(() => {
    if (cdRef.current) { clearInterval(cdRef.current); cdRef.current = null }
    setCountdown(null)
  }, [])

  /* ── auto-start mic after question spoken ── */
  const autoStartMic = useCallback(async () => {
    cancelCountdown()
    let count = 3
    setCountdown(count)
    setSubLine('Mic opens automatically…')
    cdRef.current = setInterval(async () => {
      count -= 1
      if (count > 0) {
        setCountdown(count)
      } else {
        clearInterval(cdRef.current); cdRef.current = null; setCountdown(null)
        const ok = await startRecording()
        if (ok) {
          setAnswerStart(Date.now()); liveText.current = ''
          silenceDetector.start()
          setStatusLine('Listening to you…')
          setSubLine('Speak your answer • click mic to stop')
        } else {
          setSubLine('Mic blocked — tap the mic button')
        }
      }
    }, 1000)
  }, [startRecording, cancelCountdown, silenceDetector])

  /* ── boot interview ── */
  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    const intro = `Welcome, ${candName}! I'm ${r.interviewer}, ${r.interviewerTitle}. We'll go through ${TOTAL_QUESTIONS} technical questions for the ${r.title} role. Your microphone opens automatically after each question. Let's begin!`
    setStatusLine(`${r.interviewer} is speaking…`)
    setConvHistory([{ role: 'assistant', content: intro }])
    speak(intro, { onEnd: () => fetchNextQ(1, [], [{ role: 'assistant', content: intro }]) })
  }, [])

  /* ── fetch + speak question ── */
  const fetchNextQ = async (qNum, prevTopics, history) => {
    if (qNum > TOTAL_QUESTIONS) { doEnd(correct, partial, wrong); return }
    cancelCountdown()
    setCurrentQ(qNum); setAnswered(false); setFeedback(null)
    setStatusLine('Preparing question…'); setSubLine('')
    try {
      const res = await generateQ({
        session_token: sessionToken, role: roleId, level,
        question_number: qNum, difficulty_level: diffLevel,
        conversation_history: history.slice(-6)
      })
      const q = res.data.question
      const newTopics = [...prevTopics, q.topic]
      setTopics(newTopics); setCurQText(q.question)
      setCurKeywords(q.expected_keywords || []); setCurQuestionId(q.id)

      const diff = q.difficulty === 'hard' ? '🔴' : q.difficulty === 'medium' ? '🟡' : '🟢'
      setStatusLine(q.question)
      setSubLine(`Q${qNum} · ${q.topic} ${diff}`)

      const spoken = `${q.opening_phrase || ''} ${q.question}`.trim()
      const newHist = [...history, { role: 'assistant', content: spoken }]
      setConvHistory(newHist)
      speak(spoken, { onEnd: () => autoStartMic() })
    } catch (err) {
      setStatusLine('Could not load question')
      setSubLine(err.message)
    }
  }

  /* ── mic tap ── */
  const handleMic = async () => {
    if (answered || processing) return
    if (isRecording) {
      silenceDetector.stop(); cancelCountdown()
      setProcessing(true); setStatusLine('Analyzing your answer…'); setSubLine('')
      const result = await stopRecording()
      if (!result) { setProcessing(false); return }
      try {
        const tr   = await transcribeAudio(result.blob, result.mimeType)
        const text = tr.data.transcript
        liveText.current = text
        if (!text || text.trim().length < 3) {
          setProcessing(false); setSubLine('Could not hear clearly — tap mic and try again'); return
        }
        const finalA = analyze(text); setLiveA(finalA)
        await handleAnswer(text.trim(), finalA)
      } catch (err) {
        setProcessing(false); setSubLine(`Error: ${err.message}`)
      }
    } else if (countdown !== null) {
      cancelCountdown()
      const ok = await startRecording()
      if (ok) {
        setAnswerStart(Date.now()); liveText.current = ''
        silenceDetector.start()
        setStatusLine('Listening to you…')
        setSubLine('Speak your answer • click mic to stop')
      }
    } else if (!isSpeaking && currentQ > 0 && !answered) {
      const ok = await startRecording()
      if (ok) {
        setAnswerStart(Date.now()); liveText.current = ''
        silenceDetector.start()
        setStatusLine('Listening to you…')
        setSubLine('Speak your answer • click mic to stop')
      }
    }
  }

  /* ── grade answer ── */
  const handleAnswer = async (text, speechA) => {
    setAnswered(true); cancelCountdown()
    setStatusLine(`${r.interviewer} is evaluating…`); setSubLine('')
    const dMs = answerStart ? Date.now() - answerStart : null
    const newHist = [...convHistory, { role: 'user', content: text }]
    setConvHistory(newHist)
    try {
      const res = await gradeAnswer({
        session_token: sessionToken, question_id: curQuestionId,
        role: roleId, level, question: curQText, answer: text,
        expected_keywords: curKeywords, duration_ms: dMs,
        speech_analytics: speechA || {}
      })
      const fb = res.data.feedback
      setProcessing(false)
      if      (fb.verdict === 'correct') setCorrect(c => c + 1)
      else if (fb.verdict === 'partial') setPartial(p => p + 1)
      else                               setWrong(w => w + 1)

      if (fb.verdict === 'correct' && diffLevel < 3) setDiffLevel(d => Math.min(d + 0.5, 3))
      if (fb.verdict === 'wrong'   && diffLevel > 1) setDiffLevel(d => Math.max(d - 0.5, 1))

      // Speak feedback first
      const spoken = fb.spoken_feedback +
        (fb.verdict !== 'correct' ? ` Here's what to remember: ${fb.correct_answer_summary}` : '') +
        ` ${fb.encouragement || ''}`
      const withFb = [...newHist, { role: 'assistant', content: spoken }]
      setConvHistory(withFb)

      setStatusLine(`${r.interviewer} is giving feedback…`)
      setSubLine('')
      speak(spoken, {
        onEnd: () => {
          setStatusLine(`${r.interviewer}`)
          setSubLine(currentQ < TOTAL_QUESTIONS ? 'Tap "Next" to continue' : 'Tap "Results" to finish')
        }
      })

      // Show feedback overlay (score + model answer)
      setFeedback({
        verdict:       fb.verdict,
        scoreReason:   fb.score_reason,
        correctSummary:fb.correct_answer_summary,
        improvementTip:fb.improvement_tip
      })

      dispatch({ type:'PUSH_QUESTION_SCORE', payload:{ q:currentQ, verdict:fb.verdict, ...speechA } })
    } catch (err) {
      setProcessing(false)
      setStatusLine('Grading error')
      setSubLine(err.message)
    }
  }

  /* ── next question ── */
  const handleNext = () => {
    cancelSpeech(); cancelCountdown(); setFeedback(null)
    if (currentQ >= TOTAL_QUESTIONS) { doEnd(correct, partial, wrong); return }
    fetchNextQ(currentQ + 1, topics, convHistory)
  }

  /* ── end interview ── */
  const doEnd = async (c, p, w) => {
    cancelSpeech(); cancelCountdown(); cancelRecording(); silenceDetector.stop()
    clearInterval(timerRef.current)
    try {
      const res = await getClosingSummary({ role:roleId, level, correct:c, partial:p, wrong:w, total:TOTAL_QUESTIONS })
      speak(res.data.text)
      setStatusLine(res.data.text); setSubLine('')
    } catch {}
    try { await completeSession(sessionToken, elapsed) } catch {}
    sessionStorage.setItem('results', JSON.stringify({
      correct:c, partial:p, wrong:w, total:TOTAL_QUESTIONS,
      elapsed, role:roleId, level, name:candName, session_token:sessionToken, analytics:liveA
    }))
    setTimeout(() => navigate('/results'), 2800)
  }

  useEffect(() => () => { cancelCountdown(); cancelRecording(); silenceDetector.stop() }, [])

  const fmtTime   = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`
  const micActive = !answered && !processing && currentQ > 0

  /* ── orb size ── */
  const orbSize = typeof window !== 'undefined' && window.innerWidth < 480 ? 220 : 280

  return (
    <>
      {/* ══ FULL-SCREEN SIRI ROOM ══════════════════════════ */}
      <div className="fixed inset-0 flex flex-col overflow-hidden"
        style={{ background: 'radial-gradient(ellipse 120% 100% at 50% -10%, #1a0a3a 0%, #0a0614 45%, #060410 100%)' }}>

        {/* Ambient glow that reacts to role color */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse 80% 60% at 50% 40%, ${r.color}14 0%, transparent 65%)`, transition:'background 0.8s ease' }} />

        {/* Stars / noise texture */}
        <div className="absolute inset-0 pointer-events-none" style={{ opacity:0.4,
          backgroundImage:"radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize:"60px 60px" }} />

        {/* ── TOP BAR ── */}
        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0 relative z-10"
          style={{ background:'rgba(0,0,0,0.25)' }}>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[['✓',correct,'#22c55e'],['◐',partial,'#f59e0b'],['✗',wrong,'#ef4444']].map(([sym,cnt,col])=>(
                <div key={sym} className="text-xs font-bold px-2 py-1 rounded-lg"
                  style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.1)', color:col }}>
                  {sym}{cnt}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Clock size={11} style={{ color:'rgba(255,255,255,0.4)' }} />
            <span className="font-mono text-xs" style={{ color:'rgba(255,255,255,0.4)' }}>{fmtTime(elapsed)}</span>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setShowAnalytics(true)}
              style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.5)', borderRadius:8, padding:'5px 8px', cursor:'pointer' }}>
              <BarChart2 size={14} />
            </button>
            <button onClick={() => doEnd(correct, partial, wrong)}
              style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.4)', borderRadius:8, padding:'5px 10px', fontSize:11, fontWeight:600, fontFamily:'Manrope', cursor:'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.color='#ef4444'; e.currentTarget.style.borderColor='rgba(239,68,68,0.4)' }}
              onMouseLeave={e => { e.currentTarget.style.color='rgba(255,255,255,0.4)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.1)' }}>
              End
            </button>
          </div>
        </div>

        {/* ── CENTRE — Siri Orb ── */}
        <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-4">

          {/* Orb */}
          <div className={`no-transition mb-6 ${
            orbState==='speaking'  ? 'orb-speaking'  :
            orbState==='listening' ? 'orb-listening' : 'orb-idle'}`}
            style={{ '--orb-color':'rgba(160,100,255,0.6)', filter: orbState==='listening' ? 'drop-shadow(0 0 32px rgba(239,68,68,0.5))' : orbState==='speaking' ? 'drop-shadow(0 0 28px rgba(120,80,255,0.6))' : 'drop-shadow(0 0 18px rgba(80,50,180,0.4))' }}>
            <SiriOrb state={orbState} size={orbSize} />
          </div>

          {/* Interviewer name */}
          <div className="text-center mb-3">
            <div className="text-xs font-bold uppercase tracking-widest mb-1"
              style={{ color:'rgba(255,255,255,0.35)' }}>
              {r.icon} {r.title} · {r.interviewer}
            </div>
          </div>

          {/* Status line — main spoken text / question */}
          <div className="text-center max-w-lg px-4 mb-2">
            <p className="font-display italic font-bold leading-snug"
              style={{ fontSize:'clamp(16px,3.5vw,22px)', color:'rgba(255,255,255,0.95)', letterSpacing:'-0.02em', minHeight:28 }}>
              {statusLine}
            </p>
          </div>

          {/* Sub line — topic badge / hint */}
          <div className="text-center mb-5 min-h-5">
            <p className="text-sm" style={{ color:'rgba(255,255,255,0.42)' }}>{subLine}</p>
          </div>

          {/* Waveform strip */}
          <div style={{ width:'min(340px,85vw)', marginBottom:24 }}>
            <LiveWaveform active={isRecording} color={isRecording ? '#ef4444' : r.color} height={32} />
          </div>

          {/* Live score bars (only while recording) */}
          {isRecording && (
            <div className="flex items-center gap-4 mb-4">
              {[['Fluency',liveA.fluencyScore,'#22c55e'],['Confidence',liveA.confidenceScore,'#4f7cff'],['Clarity',liveA.clarityScore,'#a855f7']].map(([l,v,c])=>(
                <div key={l} className="flex flex-col items-center gap-1">
                  <div className="h-1 w-14 rounded-full" style={{ background:'rgba(255,255,255,0.1)' }}>
                    <div className="h-full rounded-full bar-live"
                      style={{ width:`${v}%`, background:c, transition:'width 0.6s ease' }} />
                  </div>
                  <span style={{ fontSize:9, color: c, fontFamily:'monospace' }}>{l} {v}</span>
                </div>
              ))}
            </div>
          )}

          {/* Mic + next row */}
          <div className="flex items-center justify-center gap-5">
            {/* Countdown or Mic */}
            {countdown !== null && !isRecording ? (
              <CountdownRing count={countdown} onClick={handleMic} />
            ) : (
              <button onClick={handleMic} disabled={!micActive && !isRecording}
                className={`no-transition flex items-center justify-center rounded-full ${isRecording ? 'mic-pulsing' : ''}`}
                style={{
                  width:60, height:60,
                  background: isRecording
                    ? 'radial-gradient(circle, #ff4444, #cc0000)'
                    : micActive
                      ? `radial-gradient(circle, ${r.color}cc, ${r.color}88)`
                      : 'rgba(255,255,255,0.08)',
                  border: `1.5px solid ${isRecording ? '#ff6666' : micActive ? r.color : 'rgba(255,255,255,0.15)'}`,
                  cursor: (micActive || isRecording) ? 'pointer' : 'not-allowed',
                  '--pulse-c': 'rgba(239,68,68,0.5)',
                  boxShadow: isRecording
                    ? '0 0 24px rgba(239,68,68,0.45)'
                    : micActive
                      ? `0 0 20px ${r.color}55`
                      : 'none'
                }}>
                {processing
                  ? <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                      style={{ borderColor:`rgba(255,255,255,0.6) transparent rgba(255,255,255,0.6) rgba(255,255,255,0.6)` }} />
                  : isRecording
                    ? <Square size={20} color="#fff" />
                    : <Mic size={22} color={micActive ? '#fff' : 'rgba(255,255,255,0.3)'} />}
              </button>
            )}

            {/* Next / Results button — only after answered */}
            {answered && !feedback && (
              <button onClick={handleNext}
                className="btn-primary no-transition"
                style={{ background:`${r.color}cc`, color:'#000', padding:'13px 22px', fontSize:14,
                  boxShadow:`0 6px 24px ${r.color}55`, border:`1px solid ${r.color}` }}>
                {currentQ >= TOTAL_QUESTIONS
                  ? <><Trophy size={15} /> Results</>
                  : <>Next <ChevronRight size={15} /></>}
              </button>
            )}
          </div>

          {/* Mic error */}
          {micError && (
            <p className="text-xs mt-3 text-center" style={{ color:'#f87171' }}>⚠️ {micError}</p>
          )}
        </div>

        {/* ── BOTTOM BAR — Q dots + stats ── */}
        <div className="flex items-center justify-between px-5 pb-5 pt-2 flex-shrink-0 relative z-10">
          <QDots current={currentQ} total={TOTAL_QUESTIONS} />

          {/* Verdict pill if answered */}
          {answered && feedback && (
            <VerdictPill verdict={feedback.verdict} />
          )}

          <div className="font-mono text-xs" style={{ color:'rgba(255,255,255,0.3)' }}>
            Q{currentQ}/{TOTAL_QUESTIONS}
          </div>
        </div>
      </div>

      {/* ── OVERLAYS ── */}
      {feedback && (
        <FeedbackOverlay
          {...feedback}
          onNext={handleNext}
          isLast={currentQ >= TOTAL_QUESTIONS}
        />
      )}

      {showAnalytics && (
        <AnalyticsOverlay onClose={() => setShowAnalytics(false)} />
      )}
    </>
  )
}
