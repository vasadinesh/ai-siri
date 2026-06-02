const { sequelize } = require('../config/database')

// Import in dependency order
const Session     = require('./Session')
const Question    = require('./Question')
const Answer      = require('./Answer')
const Leaderboard = require('./Leaderboard')

const syncModels = async () => {
  try {
    // alter: true — safe for production (won't drop columns, just adds/modifies)
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' })
    console.log('✅  All MySQL tables synced to AWS RDS')
  } catch (err) {
    console.error('❌  Table sync failed:', err.message)
    throw err
  }
}

module.exports = { Session, Question, Answer, Leaderboard, syncModels }
