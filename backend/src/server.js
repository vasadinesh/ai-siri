require('dotenv').config()
const express   = require('express')
const cors      = require('cors')
const helmet    = require('helmet')
const morgan    = require('morgan')
const rateLimit = require('express-rate-limit')
const { connectDB }  = require('./config/database')
const { syncModels } = require('./models/index')

const app  = express()
const PORT = process.env.PORT || 4000

app.use(helmet({ crossOriginResourcePolicy: false }))
app.use(morgan('dev'))
app.use(express.json({ limit: '1mb' }))
app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:3000', 'http://localhost:5173'],
  methods: ['GET','POST','PATCH'],
  credentials: true
}))

app.use('/api/transcribe', rateLimit({ windowMs: 60000, max: 30, message: { error: 'Transcription limit.' } }))
app.use('/api',            rateLimit({ windowMs: 60000, max: 100, message: { error: 'Too many requests.' } }))
app.use('/api', require('./routes/interview'))
app.use((req, res) => res.status(404).json({ error: 'Not found' }))
app.use((err, req, res, next) => res.status(500).json({ error: err.message }))

const boot = async () => {
  await connectDB()
  await syncModels()
  app.listen(PORT, () => {
    console.log(`\n🎙  AI Voice Interviewer API  →  http://localhost:${PORT}`)
    console.log(`🗄️   RDS MySQL: ${process.env.DB_HOST}:${process.env.DB_PORT||3306}/${process.env.DB_NAME}`)
    console.log(`📡  Health: http://localhost:${PORT}/api/health\n`)
  })
}
boot().catch(err => { console.error('Boot failed:', err.message); process.exit(1) })
module.exports = app
