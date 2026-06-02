const axios = require('axios')
const FormData = require('form-data')
const { ROLES } = require('./roles')

const GROQ_BASE     = 'https://api.groq.com/openai/v1'
const CHAT_MODEL    = process.env.GROQ_CHAT_MODEL    || 'llama-3.3-70b-versatile'
const WHISPER_MODEL = process.env.GROQ_WHISPER_MODEL || 'whisper-large-v3-turbo'

const INTERVIEWER_PERSONAS = {
  devops: {
    name: 'Alex', title: 'Senior DevOps Lead',
    personality: 'Direct, technically rigorous, values practical experience. Asks about real-world scenarios. Occasionally mentions scale challenges.'
  },
  fullstack: {
    name: 'Priya', title: 'Engineering Manager',
    personality: 'Collaborative, asks about architecture decisions and trade-offs. Interested in how you communicate technical choices to stakeholders.'
  },
  dataanalyst: {
    name: 'Morgan', title: 'Head of Analytics',
    personality: 'Data-driven, asks you to walk through your thought process. Interested in how you translate data into business decisions.'
  },
  cybersecurity: {
    name: 'Jordan', title: 'Security Director',
    personality: 'Methodical and precise. Asks about incident scenarios. Evaluates whether you think like an attacker and a defender.'
  },
  cloud: {
    name: 'Sam', title: 'Cloud Architect',
    personality: 'Systems thinker, focuses on scalability, cost and reliability. Asks about design decisions and failure modes.'
  }
}

async function chat(messages, jsonMode = false) {
  const key = process.env.GROQ_API_KEY
  const body = { model: CHAT_MODEL, messages, temperature: 0.75, max_tokens: 800 }
  if (jsonMode) body.response_format = { type: 'json_object' }
  const res = await axios.post(`${GROQ_BASE}/chat/completions`, body, {
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    timeout: 25000
  })
  return res.data.choices[0].message.content
}

// Generate next question — with human-like interviewer personality + adaptive difficulty
async function generateQuestion(role, level, questionNumber, previousTopics = [], conversationHistory = [], difficultyLevel = 2) {
  const roleData  = ROLES[role]
  const persona   = INTERVIEWER_PERSONAS[role] || INTERVIEWER_PERSONAS.devops
  const levelCtx  = roleData?.levels[level] || ''
  const prev      = previousTopics.join(', ') || 'none'
  const diffLabel = difficultyLevel === 1 ? 'easy' : difficultyLevel === 3 ? 'hard' : 'medium'

  // Include recent conversation context for follow-up awareness
  const historyCtx = conversationHistory.length > 0
    ? `\nRecent conversation context:\n${conversationHistory.slice(-4).map(m => `${m.role}: ${m.content}`).join('\n')}`
    : ''

  const systemPrompt = `You are ${persona.name}, ${persona.title} at a leading tech company conducting a real job interview.
Personality: ${persona.personality}
You are interviewing ${levelCtx}
Today's interview difficulty: ${diffLabel}.

IMPORTANT RULES:
- Sound completely human and natural — like a real interviewer, not a bot
- Ask ONE focused technical question per turn
- For ${diffLabel} difficulty: ${difficultyLevel === 1 ? 'ask foundational, conceptual questions' : difficultyLevel === 3 ? 'ask deep architecture/scenario-based questions requiring senior-level thinking' : 'ask practical questions that need concrete examples'}
- Never ask the same topic twice${historyCtx}`

  const userPrompt = `Question ${questionNumber} of 7. Previously covered: ${prev}. Pick a completely different topic.

Respond ONLY in this JSON:
{
  "topic": "2-4 word label",
  "question": "Your interview question — direct and conversational, 1-2 sentences max. Sound human.",
  "opening_phrase": "A natural conversational opener before the question (e.g. 'Alright, let\\'s talk about...' or 'I\\'d like to understand your experience with...')",
  "expected_keywords": ["keyword1","keyword2","keyword3","keyword4"],
  "ideal_answer_points": "2-3 key points a strong answer should cover",
  "difficulty": "${diffLabel}",
  "follow_up_hint": "One follow-up question you might ask after a good answer"
}`

  const raw = await chat([
    { role: 'system', content: systemPrompt },
    { role: 'user',   content: userPrompt }
  ], true)
  return JSON.parse(raw.replace(/```json|```/g, '').trim())
}

// Grade answer — deep analysis including communication quality + speech analytics
async function gradeAnswer(role, level, question, answer, expectedKeywords = [], speechAnalytics = {}) {
  const persona  = INTERVIEWER_PERSONAS[role] || INTERVIEWER_PERSONAS.devops
  const roleData = ROLES[role]

  const speechCtx = Object.keys(speechAnalytics).length > 0
    ? `\nSpeech analysis data:
- Fluency score: ${speechAnalytics.fluencyScore ?? 'N/A'}/100
- Confidence score: ${speechAnalytics.confidenceScore ?? 'N/A'}/100
- Speaking speed: ${speechAnalytics.speedWPM ?? 'N/A'} WPM
- Filler words detected: ${(speechAnalytics.fillerWords || []).join(', ') || 'none'}
- Hesitations: ${speechAnalytics.hesitationCount ?? 0}`
    : ''

  const systemPrompt = `You are ${persona.name}, ${persona.title}. Grade this ${level}-level ${roleData?.title || role} candidate answer honestly but constructively.
You evaluate BOTH technical accuracy AND communication quality — because real interviews measure both.${speechCtx}`

  const userPrompt = `Question: "${question}"
Candidate's spoken answer: "${answer}"
Expected concepts: ${expectedKeywords.join(', ')}

Respond ONLY in this exact JSON:
{
  "verdict": "correct" | "partial" | "wrong",
  "score": 0-100,
  "score_reason": "One honest sentence explaining the verdict",
  "what_was_right": "What they said correctly (or 'Nothing substantial' if wrong)",
  "what_was_missing": "Key concepts they missed or got wrong",
  "correct_answer_summary": "The model answer in 2-3 clear, educational sentences — explain like a mentor",
  "technical_depth": "shallow" | "adequate" | "deep",
  "communication_quality": "poor" | "fair" | "good" | "excellent",
  "spoken_feedback": "2-3 sentences you say OUT LOUD to the candidate — natural, conversational, encouraging but honest. If wrong/partial, teach the correct answer. Sound like ${persona.name}.",
  "follow_up_question": "A natural follow-up question based on their answer (or empty string if moving on)",
  "improvement_tip": "One specific, actionable tip to improve next time",
  "encouragement": "A short natural encouragement phrase — vary it each time, don't be robotic"
}`

  const raw = await chat([
    { role: 'system', content: systemPrompt },
    { role: 'user',   content: userPrompt }
  ], true)
  return JSON.parse(raw.replace(/```json|```/g, '').trim())
}

// Generate natural encouragement when candidate is silent or struggling
async function generateEncouragement(role, level, context = 'silence') {
  const persona = INTERVIEWER_PERSONAS[role] || INTERVIEWER_PERSONAS.devops
  const prompts = {
    silence:    `The candidate has been silent for a while. Generate a short (1 sentence), natural, encouraging prompt to get them talking again. Sound like ${persona.name}.`,
    struggling: `The candidate seems to be struggling. Generate a short hint or reframe (1-2 sentences) that helps without giving the answer away. Sound like ${persona.name}.`,
    nervous:    `The candidate sounds nervous. Generate a warm, calming 1-sentence reassurance. Sound professional but human like ${persona.name}.`
  }
  const res = await chat([
    { role: 'system', content: `You are ${persona.name}, ${persona.title}. Keep responses to 1-2 sentences max.` },
    { role: 'user',   content: prompts[context] || prompts.silence }
  ])
  return res.trim()
}

// Generate session-closing summary spoken by interviewer
async function generateClosingSummary(role, level, correct, partial, wrong, totalQ) {
  const persona = INTERVIEWER_PERSONAS[role] || INTERVIEWER_PERSONAS.devops
  const pct = Math.round(((correct + partial * 0.5) / totalQ) * 100)
  const res = await chat([
    { role: 'system', content: `You are ${persona.name}, ${persona.title}. Give a warm, professional closing statement. 2-3 sentences max. Mention the score naturally.` },
    { role: 'user', content: `The candidate scored ${pct}% (${correct} correct, ${partial} partial, ${wrong} wrong out of ${totalQ}). Give your closing remarks as if speaking directly to them.` }
  ])
  return res.trim()
}

async function transcribeAudio(audioBuffer, mimeType) {
  const key = process.env.GROQ_API_KEY
  const ext = mimeType.includes('webm') ? 'webm' : mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'wav'
  const fd  = new FormData()
  fd.append('file', audioBuffer, { filename: `audio.${ext}`, contentType: mimeType })
  fd.append('model', WHISPER_MODEL)
  fd.append('language', 'en')
  fd.append('response_format', 'json')
  const res = await axios.post(`${GROQ_BASE}/audio/transcriptions`, fd, {
    headers: { 'Authorization': `Bearer ${key}`, ...fd.getHeaders() },
    timeout: 35000, maxBodyLength: Infinity
  })
  return res.data.text || ''
}

module.exports = { generateQuestion, gradeAnswer, generateEncouragement, generateClosingSummary, transcribeAudio }
