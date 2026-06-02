import { createContext, useContext, useReducer, useRef } from 'react'

const InterviewContext = createContext()

const initialState = {
  // session
  role: '', level: '', name: '', sessionToken: '',
  // Q&A state
  currentQ: 0, totalQ: 7, answered: false, topics: [],
  currentQuestion: null,
  // scores
  correct: 0, partial: 0, wrong: 0,
  // conversation memory (last 6 messages for follow-up context)
  conversationHistory: [],
  // live analytics
  analytics: {
    fluencyScore: 100,
    confidenceScore: 100,
    clarityScore: 100,
    speedWPM: 0,
    fillerCount: 0,
    fillerWords: [],
    pauseCount: 0,
    hesitationCount: 0,
    overallScore: 100,
    // per-question history
    questionScores: []
  },
  // speech analysis
  liveTranscript: '',
  isAnalyzing: false,
  // difficulty (1=easy … 3=hard)
  difficultyLevel: 2,
  // silence detector
  silenceSeconds: 0,
  // status
  phase: 'idle' // idle | asking | countdown | listening | processing | feedback | complete
}

function reducer(state, action) {
  switch (action.type) {
    case 'INIT':         return { ...state, ...action.payload }
    case 'SET_PHASE':    return { ...state, phase: action.payload }
    case 'SET_QUESTION': return { ...state, currentQ: action.q, currentQuestion: action.question, answered: false, liveTranscript: '' }
    case 'ADD_TOPIC':    return { ...state, topics: [...state.topics, action.topic] }
    case 'SET_ANSWERED': return { ...state, answered: true }
    case 'ADD_SCORE': {
      const { verdict } = action
      return {
        ...state,
        correct:  state.correct  + (verdict === 'correct' ? 1 : 0),
        partial:  state.partial  + (verdict === 'partial'  ? 1 : 0),
        wrong:    state.wrong    + (verdict === 'wrong'    ? 1 : 0)
      }
    }
    case 'UPDATE_ANALYTICS':
      return { ...state, analytics: { ...state.analytics, ...action.payload } }
    case 'SET_LIVE_TRANSCRIPT':
      return { ...state, liveTranscript: action.payload }
    case 'SET_ANALYZING':
      return { ...state, isAnalyzing: action.payload }
    case 'ADD_HISTORY':
      return {
        ...state,
        conversationHistory: [...state.conversationHistory.slice(-10), action.message]
      }
    case 'SET_SILENCE':
      return { ...state, silenceSeconds: action.payload }
    case 'SET_DIFFICULTY':
      return { ...state, difficultyLevel: action.payload }
    case 'PUSH_QUESTION_SCORE':
      return {
        ...state,
        analytics: {
          ...state.analytics,
          questionScores: [...state.analytics.questionScores, action.payload]
        }
      }
    default: return state
  }
}

export function InterviewProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const analyticsRef = useRef(state.analytics)
  analyticsRef.current = state.analytics

  return (
    <InterviewContext.Provider value={{ state, dispatch, analyticsRef }}>
      {children}
    </InterviewContext.Provider>
  )
}

export const useInterview = () => useContext(InterviewContext)
