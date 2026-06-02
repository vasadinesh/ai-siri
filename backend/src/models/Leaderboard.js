const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const Leaderboard = sequelize.define('Leaderboard', {
  id: {
    type:          DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey:    true
  },
  session_id: {
    type:      DataTypes.INTEGER,
    allowNull: false,
    unique:    true
  },
  candidate_name: {
    type:      DataTypes.STRING(120),
    allowNull: false
  },
  role: {
    type:      DataTypes.ENUM('devops','fullstack','dataanalyst','cybersecurity','cloud'),
    allowNull: false
  },
  level: {
    type:      DataTypes.ENUM('fresher','mid','senior'),
    allowNull: false
  },
  correct_count: {
    type:         DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0
  },
  partial_count: {
    type:         DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0
  },
  total_questions: {
    type:         DataTypes.TINYINT.UNSIGNED,
    defaultValue: 7
  },
  score_percentage: {
    type:      DataTypes.DECIMAL(5, 2),
    allowNull: false
  },
  duration_seconds: {
    type:      DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  completed_at: {
    type:      DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName:  'leaderboard',
  timestamps: true,
  indexes: [
    { fields: ['role'] },
    { fields: ['level'] },
    { fields: ['score_percentage'] },
    { fields: ['role', 'level', 'score_percentage'] }
  ]
})

module.exports = Leaderboard
