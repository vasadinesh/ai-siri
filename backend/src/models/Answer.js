const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')
const Session       = require('./Session')
const Question      = require('./Question')

const Answer = sequelize.define('Answer', {
  id: {
    type:          DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey:    true
  },
  session_id: {
    type:       DataTypes.INTEGER,
    allowNull:  false,
    references: { model: 'sessions', key: 'id' }
  },
  question_id: {
    type:       DataTypes.INTEGER,
    allowNull:  false,
    references: { model: 'questions', key: 'id' }
  },
  transcript: {
    type:      DataTypes.TEXT,
    allowNull: false
  },
  verdict: {
    type:      DataTypes.ENUM('correct','partial','wrong'),
    allowNull: false
  },
  score: {
    type:         DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0
  },
  score_reason: {
    type:      DataTypes.TEXT,
    allowNull: true
  },
  what_was_right: {
    type:      DataTypes.TEXT,
    allowNull: true
  },
  what_was_missing: {
    type:      DataTypes.TEXT,
    allowNull: true
  },
  correct_answer_summary: {
    type:      DataTypes.TEXT,
    allowNull: true
  },
  spoken_feedback: {
    type:      DataTypes.TEXT,
    allowNull: true
  },
  improvement_tip: {
    type:      DataTypes.TEXT,
    allowNull: true
  },
  duration_ms: {
    type:      DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  }
}, {
  tableName:  'answers',
  timestamps: true,
  indexes: [
    { fields: ['session_id'] },
    { fields: ['question_id'] },
    { fields: ['verdict'] }
  ]
})

Session.hasMany(Answer,  { foreignKey: 'session_id', onDelete: 'CASCADE' })
Answer.belongsTo(Session, { foreignKey: 'session_id' })

Question.hasOne(Answer,   { foreignKey: 'question_id', onDelete: 'CASCADE' })
Answer.belongsTo(Question, { foreignKey: 'question_id' })

module.exports = Answer
