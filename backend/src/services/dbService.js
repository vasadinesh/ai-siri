const { v4: uuidv4 } = require('crypto')
const { Op }         = require('sequelize')
const { Session, Question, Answer, Leaderboard } = require('../models/index')

// ── Session ────────────────────────────────────────────────────────────────

async function createSession({ candidateName, role, level, ipAddress, userAgent }) {
  const token = require('crypto').randomUUID()
  const session = await Session.create({
    session_token:  token,
    candidate_name: candidateName || null,
    role,
    level,
    ip_address:     ipAddress  || null,
    user_agent:     userAgent  || null
  })
  return session
}

async function getSession(token) {
  return Session.findOne({ where: { session_token: token } })
}

async function saveQuestion(sessionId, { questionNumber, topic, difficulty, questionText, expectedKeywords, idealAnswerPoints }) {
  return Question.create({
    session_id:          sessionId,
    question_number:     questionNumber,
    topic,
    difficulty:          difficulty || 'medium',
    question_text:       questionText,
    expected_keywords:   expectedKeywords   || [],
    ideal_answer_points: idealAnswerPoints  || null
  })
}

async function getPreviousTopics(sessionId) {
  const rows = await Question.findAll({
    where:      { session_id: sessionId },
    attributes: ['topic'],
    order:      [['question_number', 'ASC']]
  })
  return rows.map(r => r.topic)
}

async function saveAnswer(sessionId, questionId, {
  transcript, verdict, score, scoreReason, whatWasRight,
  whatWasMissing, correctAnswerSummary, spokenFeedback, improvementTip, durationMs
}) {
  const answer = await Answer.create({
    session_id:             sessionId,
    question_id:            questionId,
    transcript,
    verdict,
    score:                  score || 0,
    score_reason:           scoreReason           || null,
    what_was_right:         whatWasRight          || null,
    what_was_missing:       whatWasMissing        || null,
    correct_answer_summary: correctAnswerSummary  || null,
    spoken_feedback:        spokenFeedback        || null,
    improvement_tip:        improvementTip        || null,
    duration_ms:            durationMs            || null
  })

  // Update session counts
  const inc = { answered_count: 1 }
  if (verdict === 'correct') inc.correct_count = 1
  else if (verdict === 'partial') inc.partial_count = 1
  else inc.wrong_count = 1

  await Session.increment(inc, { where: { id: sessionId } })
  return answer
}

async function completeSession(token, durationSeconds) {
  const session = await Session.findOne({ where: { session_token: token } })
  if (!session) throw new Error('Session not found')

  const pct = parseFloat(
    (((session.correct_count + session.partial_count * 0.5) / session.total_questions) * 100).toFixed(2)
  )

  await session.update({
    status:           'completed',
    score_percentage: pct,
    duration_seconds: durationSeconds || null,
    completed_at:     new Date()
  })

  // Write to leaderboard if candidate has a name
  if (session.candidate_name) {
    await Leaderboard.upsert({
      session_id:       session.id,
      candidate_name:   session.candidate_name,
      role:             session.role,
      level:            session.level,
      correct_count:    session.correct_count,
      partial_count:    session.partial_count,
      total_questions:  session.total_questions,
      score_percentage: pct,
      duration_seconds: durationSeconds || null,
      completed_at:     new Date()
    })
  }

  return { ...session.toJSON(), score_percentage: pct }
}

async function getSessionHistory(token) {
  const session = await Session.findOne({
    where:   { session_token: token },
    include: [{
      model:   Question,
      include: [{ model: Answer }]
    }],
    order: [[Question, 'question_number', 'ASC']]
  })
  return session
}

// ── Leaderboard ────────────────────────────────────────────────────────────

async function getLeaderboard({ role, level, limit = 50 }) {
  const where = {}
  if (role  && role  !== 'all') where.role  = role
  if (level && level !== 'all') where.level = level

  return Leaderboard.findAll({
    where,
    order: [['score_percentage', 'DESC'], ['duration_seconds', 'ASC']],
    limit: parseInt(limit) || 50
  })
}

async function getStats() {
  const { sequelize } = require('../config/database')
  const [rows] = await sequelize.query(`
    SELECT
      COUNT(*)                                                   AS total_sessions,
      COUNT(CASE WHEN status='completed' THEN 1 END)             AS completed,
      ROUND(AVG(CASE WHEN status='completed' THEN score_percentage END), 1) AS avg_score,
      COUNT(CASE WHEN role='devops'        AND status='completed' THEN 1 END) AS devops_count,
      COUNT(CASE WHEN role='fullstack'     AND status='completed' THEN 1 END) AS fullstack_count,
      COUNT(CASE WHEN role='dataanalyst'   AND status='completed' THEN 1 END) AS dataanalyst_count,
      COUNT(CASE WHEN role='cybersecurity' AND status='completed' THEN 1 END) AS cybersecurity_count,
      COUNT(CASE WHEN role='cloud'         AND status='completed' THEN 1 END) AS cloud_count,
      ROUND(AVG(CASE WHEN role='devops'        AND status='completed' THEN score_percentage END), 1) AS devops_avg,
      ROUND(AVG(CASE WHEN role='fullstack'     AND status='completed' THEN score_percentage END), 1) AS fullstack_avg,
      ROUND(AVG(CASE WHEN role='dataanalyst'   AND status='completed' THEN score_percentage END), 1) AS dataanalyst_avg,
      ROUND(AVG(CASE WHEN role='cybersecurity' AND status='completed' THEN score_percentage END), 1) AS cybersecurity_avg,
      ROUND(AVG(CASE WHEN role='cloud'         AND status='completed' THEN score_percentage END), 1) AS cloud_avg
    FROM sessions
  `)
  return rows[0]
}

module.exports = { createSession, getSession, saveQuestion, getPreviousTopics, saveAnswer, completeSession, getSessionHistory, getLeaderboard, getStats }
