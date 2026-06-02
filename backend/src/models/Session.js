const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const Session = sequelize.define('Session', {
  id: {
    type:          DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey:    true
  },
  session_token: {
    type:      DataTypes.STRING(64),
    allowNull: false,
    unique:    true
  },
  candidate_name: {
    type:      DataTypes.STRING(120),
    allowNull: true
  },
  role: {
    type:      DataTypes.ENUM('devops','fullstack','dataanalyst','cybersecurity','cloud'),
    allowNull: false
  },
  level: {
    type:      DataTypes.ENUM('fresher','mid','senior'),
    allowNull: false
  },
  status: {
    type:         DataTypes.ENUM('active','completed','abandoned'),
    defaultValue: 'active'
  },
  total_questions: {
    type:         DataTypes.TINYINT.UNSIGNED,
    defaultValue: 7
  },
  answered_count: {
    type:         DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0
  },
  correct_count: {
    type:         DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0
  },
  partial_count: {
    type:         DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0
  },
  wrong_count: {
    type:         DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0
  },
  score_percentage: {
    type:         DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00
  },
  duration_seconds: {
    type:      DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  ip_address: {
    type:      DataTypes.STRING(45),
    allowNull: true
  },
  user_agent: {
    type:      DataTypes.TEXT,
    allowNull: true
  },
  completed_at: {
    type:      DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName:  'sessions',
  timestamps: true,
  indexes: [
    { fields: ['session_token'] },
    { fields: ['role'] },
    { fields: ['status'] },
    { fields: ['score_percentage'] }
  ]
})

module.exports = Session
