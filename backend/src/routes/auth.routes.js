const express = require('express')
const router = express.Router()
const rateLimit = require('express-rate-limit')
const { register, login } = require('../controllers/auth.controller')

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  message: { message: 'Too many login attempts from this IP, please try again after 15 minutes' },
  standardHeaders: true, 
  legacyHeaders: false, 
})

router.post('/register', register)
router.post('/login', loginLimiter, login)

module.exports = router