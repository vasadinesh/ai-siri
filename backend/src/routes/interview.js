const express   = require('express')
const router    = express.Router()
const multer    = require('multer')
const Joi       = require('joi')
const groq      = require('../services/groqService')
const db        = require('../services/dbService')
const { ROLES } = require('../services/roles')

const upload       = multer({ storage: multer.memoryStorage(), limits: { fileSize: 30 * 1024 * 1024 } })
const VALID_ROLES  = Object.keys(ROLES)
const VALID_LEVELS = ['fresher', 'mid', 'senior']

// All routes use process.env.GROQ_API_KEY from backend .env
// The API key is NEVER accepted from the client request body

// GET /api/roles
router.get('/roles', (req, res) => {
  res.json({ success: true, roles: Object.values(ROLES).map(({ id, title, icon, color }) => ({ id, title, icon, color })) })
})

// GET /api/health — also confirms GROQ_API_KEY is set
router.get('/health', async (req, res) => {
  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'gsk_your_groq_api_key_here') {
    return res.status(503).json({
      status: 'error',
      error: 'GROQ_API_KEY is not configured in backend .env'
    })
  }
  try {
    const { sequelize } = require('../config/database')
    await sequelize.authenticate()
    res.json({
      status: 'ok',
      database: 'MySQL RDS connected',
      ai: 'Groq API key configured',
      models: ['sessions', 'questions', 'answers', 'leaderboard']
    })
  } catch (err) {
    res.status(503).json({ status: 'degraded', database: 'disconnected', error: err.message })
  }
})

// POST /api/sessions
router.post('/sessions', async (req, res) => {
  const schema = Joi.object({
    candidate_name: Joi.string().max(120).optional().allow(''),
    role:           Joi.string().valid(...VALID_ROLES).required(),
    level:          Joi.string().valid(...VALID_LEVELS).required()
  })
  const { error, value } = schema.validate(req.body)
  if (error) return res.status(400).json({ error: error.details[0].message })
  try {
    const session = await db.createSession({
      candidateName: value.candidate_name || null,
      role: value.role, level: value.level,
      ipAddress: req.ip, userAgent: req.headers['user-agent']
    })
    res.status(201).json({ success: true, session_token: session.session_token, session_id: session.id })
  } catch (err) {
    res.status(500).json({ error: 'Failed to create session: ' + err.message })
  }
})

// POST /api/question
router.post('/question', async (req, res) => {
  const schema = Joi.object({
    session_token:   Joi.string().required(),
    role:            Joi.string().valid(...VALID_ROLES).required(),
    level:           Joi.string().valid(...VALID_LEVELS).required(),
    question_number:       Joi.number().integer().min(1).max(7).required(),
    difficulty_level:      Joi.number().optional(),
    conversation_history:  Joi.array().optional()
    // api_key intentionally NOT accepted — always use server env
  })
  const { error, value } = schema.validate(req.body)
  if (error) return res.status(400).json({ error: error.details[0].message })
  try {
    const session = await db.getSession(value.session_token)
    if (!session) return res.status(404).json({ error: 'Session not found' })
    const prevTopics = await db.getPreviousTopics(session.id)
    const q = await groq.generateQuestion(value.role, value.level, value.question_number, prevTopics, value.conversation_history || [], value.difficulty_level || 2)
    const saved = await db.saveQuestion(session.id, {
      questionNumber: value.question_number, topic: q.topic, difficulty: q.difficulty,
      questionText: q.question, expectedKeywords: q.expected_keywords, idealAnswerPoints: q.ideal_answer_points
    })
    res.json({
      success: true,
      question: {
        id: saved.id, number: saved.question_number, topic: saved.topic,
        difficulty: saved.difficulty, question: saved.question_text,
        expected_keywords: saved.expected_keywords
      }
    })
  } catch (err) {
    if (err.response?.status === 401) return res.status(401).json({ error: 'Invalid Groq API key in server .env' })
    if (err.response?.status === 429) return res.status(429).json({ error: 'Groq rate limit. Wait a moment.' })
    res.status(500).json({ error: 'Failed to generate question: ' + err.message })
  }
})

// POST /api/transcribe
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No audio file provided' })
  // api_key intentionally NOT read from req.body — backend .env only
  const mimeType = req.file.mimetype || 'audio/webm'
  try {
    const transcript = await groq.transcribeAudio(req.file.buffer, mimeType)
    res.json({ success: true, transcript: transcript.trim() })
  } catch (err) {
    if (err.response?.status === 401) return res.status(401).json({ error: 'Invalid Groq API key in server .env' })
    res.status(500).json({ error: 'Transcription failed' })
  }
})

// POST /api/grade
router.post('/grade', async (req, res) => {
  const schema = Joi.object({
    session_token:     Joi.string().required(),
    question_id:       Joi.number().integer().required(),
    role:              Joi.string().valid(...VALID_ROLES).required(),
    level:             Joi.string().valid(...VALID_LEVELS).required(),
    question:          Joi.string().min(3).required(),
    answer:            Joi.string().min(1).required(),
    expected_keywords: Joi.array().items(Joi.string()).default([]),
    duration_ms:       Joi.number().integer().optional(),
    speech_analytics:  Joi.object().optional()
    // api_key intentionally NOT accepted
  })
  const { error, value } = schema.validate(req.body)
  if (error) return res.status(400).json({ error: error.details[0].message })
  try {
    const session = await db.getSession(value.session_token)
    if (!session) return res.status(404).json({ error: 'Session not found' })
    const fb = await groq.gradeAnswer(value.role, value.level, value.question, value.answer, value.expected_keywords, value.speech_analytics || {})
    await db.saveAnswer(session.id, value.question_id, {
      transcript: value.answer, verdict: fb.verdict, score: fb.score,
      scoreReason: fb.score_reason, whatWasRight: fb.what_was_right,
      whatWasMissing: fb.what_was_missing, correctAnswerSummary: fb.correct_answer_summary,
      spokenFeedback: fb.spoken_feedback, improvementTip: fb.improvement_tip,
      durationMs: value.duration_ms || null
    })
    res.json({ success: true, feedback: fb })
  } catch (err) {
    res.status(500).json({ error: 'Failed to grade: ' + err.message })
  }
})

// PATCH /api/sessions/:token/complete
router.patch('/sessions/:token/complete', async (req, res) => {
  try {
    const result = await db.completeSession(req.params.token, req.body.duration_seconds)
    res.json({ success: true, session: result })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// GET /api/sessions/:token/history
router.get('/sessions/:token/history', async (req, res) => {
  try {
    const session = await db.getSessionHistory(req.params.token)
    if (!session) return res.status(404).json({ error: 'Session not found' })
    res.json({ success: true, session })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// GET /api/leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    res.json({ success: true, leaderboard: await db.getLeaderboard(req.query) })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// GET /api/leaderboard/stats
router.get('/leaderboard/stats', async (req, res) => {
  try {
    res.json({ success: true, stats: await db.getStats() })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router

// POST /api/encourage — AI generates natural encouragement when candidate is silent/struggling
router.post('/encourage', async (req, res) => {
  const { role, level, context } = req.body
  if (!role || !level) return res.status(400).json({ error: 'role and level required' })
  try {
    const { generateEncouragement } = require('../services/groqService')
    const text = await generateEncouragement(role, level, context || 'silence')
    res.json({ success: true, text })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// POST /api/closing-summary — AI closing remarks
router.post('/closing-summary', async (req, res) => {
  const { role, level, correct, partial, wrong, total } = req.body
  try {
    const { generateClosingSummary } = require('../services/groqService')
    const text = await generateClosingSummary(role, level, correct || 0, partial || 0, wrong || 0, total || 7)
    res.json({ success: true, text })
  } catch (err) { res.status(500).json({ error: err.message }) }
})
