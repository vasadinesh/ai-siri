import { useRef, useCallback, useEffect, useState } from 'react'

export default function useSpeech() {
  const synth    = useRef(window.speechSynthesis)
  const voiceRef = useRef(null)
  const [isSpeaking, setIsSpeaking] = useState(false)

  const loadVoice = useCallback(() => {
    const voices = synth.current.getVoices()
    const picks  = ['Google UK English Male','Daniel','Alex','Microsoft David','en-GB','en-US']
    for (const p of picks) {
      const v = voices.find(v => v.name.includes(p) || v.lang === p)
      if (v) { voiceRef.current = v; return }
    }
    voiceRef.current = voices.find(v => v.lang?.startsWith('en')) || voices[0] || null
  }, [])

  useEffect(() => {
    loadVoice()
    synth.current.onvoiceschanged = loadVoice
    return () => synth.current.cancel()
  }, [loadVoice])

  const speak = useCallback((text, { rate = 0.91, pitch = 1.0, onEnd, onStart } = {}) => {
    synth.current.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    if (voiceRef.current) utt.voice = voiceRef.current
    utt.rate = rate; utt.pitch = pitch; utt.volume = 1.0
    utt.onstart = () => { setIsSpeaking(true);  onStart?.() }
    utt.onend   = () => { setIsSpeaking(false); onEnd?.() }
    utt.onerror = () => { setIsSpeaking(false); onEnd?.() }
    synth.current.speak(utt)
  }, [])

  const cancel = useCallback(() => { synth.current.cancel(); setIsSpeaking(false) }, [])

  return { speak, cancel, isSpeaking }
}
