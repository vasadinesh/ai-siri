const { Sequelize } = require('sequelize')

const isProduction = process.env.NODE_ENV === 'production'

const sequelize = new Sequelize(
  process.env.DB_NAME     || 'voice_interviewer',
  process.env.DB_USER     || 'admin',
  process.env.DB_PASSWORD || '',
  {
    host:    process.env.DB_HOST || 'localhost',
    port:    parseInt(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? (q) => console.log(`\n[SQL] ${q.slice(0, 120)}`) : false,
    pool: {
      max:     10,
      min:     0,
      acquire: 30000,
      idle:    10000
    },
    dialectOptions: isProduction
      ? { ssl: { rejectUnauthorized: false } }  // required for AWS RDS MySQL SSL
      : {},
    define: {
      timestamps:  true,
      underscored: true
    }
  }
)

const connectDB = async () => {
  try {
    await sequelize.authenticate()
    console.log('✅  Connected to AWS RDS MySQL')
  } catch (err) {
    console.error('❌  RDS MySQL connection failed:', err.message)
    process.exit(1)
  }
}

module.exports = { sequelize, connectDB }
