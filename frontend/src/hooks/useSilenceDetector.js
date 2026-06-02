import { useRef, useCallback, useEffect } from 'react'

export default function useSilenceDetector({ onSilence, onBreak, silenceThreshold = 8 }) {
  const intervalRef  = useRef(null)
  const secondsRef   = useRef(0)
  const activeRef    = useRef(false)

  const start = useCallback(() => {
    secondsRef.current = 0
    activeRef.current  = true
    intervalRef.current = setInterval(() => {
      if (!activeRef.current) return
      secondsRef.current += 1
      if (secondsRef.current >= silenceThreshold) {
        onSilence?.(secondsRef.current)
      }
    }, 1000)
  }, [onSilence, silenceThreshold])

  const reset = useCallback(() => {
    secondsRef.current = 0
    onBreak?.()
  }, [onBreak])

  const stop = useCallback(() => {
    activeRef.current = false
    secondsRef.current = 0
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
  }, [])

  useEffect(() => () => stop(), [stop])

  return { start, reset, stop, getSeconds: () => secondsRef.current }
}
