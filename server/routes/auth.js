import express from 'express'
import {
  getAllOrders,
  getOrders,
  login,
  register,
  secret,
  updateProfile,
  usersController,
} from '../controllers/authController.js'
import { isAdmin, requireSignin } from '../middlewares/authMiddleware.js'

const router = express.Router()

router.get('/users', usersController)
router.post('/register', register)
router.post('/login', login)
router.get('/auth-check', requireSignin, (req, res) => {
  res.json({ ok: true })
})
router.get('/admin-check', requireSignin, isAdmin, (req, res) => {
  res.json({ ok: true })
})

router.put('/profile', requireSignin, updateProfile)
router.get('/orders', requireSignin, getOrders)
router.get('/all-orders', requireSignin, isAdmin, getAllOrders)

//router.get('/secret', requireSignin, isAdmin, secret)

export default router
