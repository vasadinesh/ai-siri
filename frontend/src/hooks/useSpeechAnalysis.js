import { useRef, useCallback } from 'react'

const FILLER_WORDS = ['um', 'uh', 'umm', 'uhh', 'ahh', 'ah', 'like', 'you know', 'basically', 'literally', 'actually', 'so', 'right', 'okay so', 'kind of', 'sort of', 'i mean', 'well']
const HESITATION_PATTERNS = /\b(um+|uh+|ah+|er+|hmm+)\b/gi
const STAMMER_PATTERN = /\b(\w{1,3})-\1|\b(\w+)\s+\2\b/gi

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function detectFillerWords(text) {
  const lower = text.toLowerCase()
  const found = []
  FILLER_WORDS.forEach(fw => {
    const regex = new RegExp(`\\b${fw}\\b`, 'gi')
    const matches = lower.match(regex)
    if (matches) found.push(...matches.map(m => m.toLowerCase()))
  })
  return found
}

function calcFluencyScore(fillerCount, hesitationCount, wordCount, pauseCount) {
  if (wordCount === 0) return 100
  const fillerRate      = fillerCount / Math.max(wordCount, 1)
  const hesitationRate  = hesitationCount / Math.max(wordCount, 1)
  const pauseRate       = pauseCount / Math.max(wordCount, 1)
  const penalty = (fillerRate * 40) + (hesitationRate * 30) + (pauseRate * 15)
  return Math.max(0, Math.round(100 - penalty * 100))
}

function calcConfidenceScore(text, wpm, fillerCount) {
  let score = 100
  // low wpm = nervous/slow
  if (wpm < 80) score -= 20
  else if (wpm > 200) score -= 10  // too fast = anxious
  // many fillers = low confidence
  score -= Math.min(fillerCount * 5, 40)
  // short answers = low confidence
  const words = countWords(text)
  if (words < 10) score -= 20
  return Math.max(0, score)
}

function calcClarityScore(text) {
  const words = countWords(text)
  if (words === 0) return 100
  // avg sentence length
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const avgLen = sentences.reduce((a, s) => a + countWords(s), 0) / Math.max(sentences.length, 1)
  let score = 100
  if (avgLen > 30) score -= 20   // too long-winded
  if (avgLen < 4)  score -= 15   // too fragmented
  // repetition
  const stammers = (text.match(STAMMER_PATTERN) || []).length
  score -= stammers * 10
  return Math.max(0, score)
}

function calcWPM(text, durationSeconds) {
  if (durationSeconds <= 0) return 0
  return Math.round((countWords(text) / durationSeconds) * 60)
}

export default function useSpeechAnalysis() {
  const startTimeRef = useRef(null)
  const analysisRef  = useRef({
    fluencyScore:    100,
    confidenceScore: 100,
    clarityScore:    100,
    speedWPM:        0,
    fillerCount:     0,
    fillerWords:     [],
    hesitationCount: 0,
    pauseCount:      0,
    overallScore:    100,
    suggestions:     []
  })

  const startAnalysis = useCallback(() => {
    startTimeRef.current = Date.now()
  }, [])

  const analyze = useCallback((transcript) => {
    if (!transcript || transcript.trim().length === 0) return analysisRef.current

    const durationSec = startTimeRef.current
      ? (Date.now() - startTimeRef.current) / 1000
      : 10

    const fillerWords     = detectFillerWords(transcript)
    const hesitations     = (transcript.match(HESITATION_PATTERNS) || []).length
    const wordCount       = countWords(transcript)
    const wpm             = calcWPM(transcript, durationSec)
    const pauseCount      = (transcript.match(/\.\.\.|—|…/g) || []).length

    const fluencyScore    = calcFluencyScore(fillerWords.length, hesitations, wordCount, pauseCount)
    const confidenceScore = calcConfidenceScore(transcript, wpm, fillerWords.length)
    const clarityScore    = calcClarityScore(transcript)
    const overallScore    = Math.round((fluencyScore * 0.35) + (confidenceScore * 0.35) + (clarityScore * 0.30))

    // Generate live suggestions
    const suggestions = []
    if (fillerWords.length >= 3)    suggestions.push(`Reduce filler words: "${[...new Set(fillerWords)].slice(0,3).join('", "')}"`)
    if (wpm < 90 && wordCount > 5)  suggestions.push('Try speaking a bit faster — you sound hesitant')
    if (wpm > 190)                   suggestions.push('Slow down — you\'re speaking too quickly')
    if (hesitations >= 2)            suggestions.push('Pause and breathe instead of saying "um" or "uh"')
    if (clarityScore < 60)           suggestions.push('Structure your answer: situation → action → result')
    if (wordCount < 8 && durationSec > 5) suggestions.push('Elaborate more — give examples and details')

    const result = {
      fluencyScore, confidenceScore, clarityScore, overallScore,
      speedWPM: wpm, fillerCount: fillerWords.length, fillerWords: [...new Set(fillerWords)],
      hesitationCount: hesitations, pauseCount, suggestions
    }
    analysisRef.current = result
    return result
  }, [])

  const stopAnalysis = useCallback(() => {
    startTimeRef.current = null
    return analysisRef.current
  }, [])

  return { startAnalysis, analyze, stopAnalysis, analysisRef }
}
