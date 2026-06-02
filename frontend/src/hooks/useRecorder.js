import { useState, useRef, useCallback } from 'react'

export default function useRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [micError,    setMicError]    = useState(null)
  const recorderRef  = useRef(null)
  const chunksRef    = useRef([])
  const streamRef    = useRef(null)

  const startRecording = useCallback(async () => {
    setMicError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
      streamRef.current = stream
      chunksRef.current = []
      const mimeType = ['audio/webm;codecs=opus','audio/webm','audio/ogg'].find(t => MediaRecorder.isTypeSupported(t)) || ''
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      recorderRef.current = recorder
      recorder.ondataavailable = e => { if (e.data?.size > 0) chunksRef.current.push(e.data) }
      recorder.start(100)
      setIsRecording(true)
      return true
    } catch (err) {
      setMicError(err.name === 'NotAllowedError' ? 'Microphone access denied. Allow mic in browser settings.' : 'Microphone unavailable.')
      return false
    }
  }, [])

  const stopRecording = useCallback(() => new Promise(resolve => {
    const recorder = recorderRef.current
    if (!recorder || recorder.state === 'inactive') { resolve(null); return }
    recorder.onstop = () => {
      const mimeType = recorder.mimeType || 'audio/webm'
      const blob = new Blob(chunksRef.current, { type: mimeType })
      streamRef.current?.getTracks().forEach(t => t.stop())
      setIsRecording(false)
      resolve({ blob, mimeType })
    }
    recorder.stop()
  }), [])

  const cancelRecording = useCallback(() => {
    recorderRef.current?.stop()
    streamRef.current?.getTracks().forEach(t => t.stop())
    chunksRef.current = []
    setIsRecording(false)
  }, [])

  return { isRecording, startRecording, stopRecording, cancelRecording, micError }
}
