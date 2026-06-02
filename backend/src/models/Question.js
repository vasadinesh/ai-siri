const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')
const Session       = require('./Session')

const Question = sequelize.define('Question', {
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
  question_number: {
    type:      DataTypes.TINYINT.UNSIGNED,
    allowNull: false
  },
  topic: {
    type:      DataTypes.STRING(120),
    allowNull: false
  },
  difficulty: {
    type:         DataTypes.ENUM('easy','medium','hard'),
    defaultValue: 'medium'
  },
  question_text: {
    type:      DataTypes.TEXT,
    allowNull: false
  },
  expected_keywords: {
    type: DataTypes.TEXT,             // stored as JSON string
    get() {
      const v = this.getDataValue('expected_keywords')
      try { return v ? JSON.parse(v) : [] } catch { return [] }
    },
    set(val) {
      this.setDataValue('expected_keywords', JSON.stringify(val || []))
    }
  },
  ideal_answer_points: {
    type:      DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName:  'questions',
  timestamps: true,
  indexes: [
    { fields: ['session_id'] },
    { fields: ['question_number'] }
  ]
})

Session.hasMany(Question, { foreignKey: 'session_id', onDelete: 'CASCADE' })
Question.belongsTo(Session, { foreignKey: 'session_id' })

module.exports = Question
