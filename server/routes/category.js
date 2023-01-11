import express from 'express'
import { isAdmin, requireSignin } from '../middlewares/authMiddleware.js'
import { create, list, remove, update, read } from '../controllers/category.js'

const router = express.Router()

router.post('/category', requireSignin, isAdmin, create)
router.put('/category/:categoryId', requireSignin, isAdmin, update)
router.delete('/category/:categoryId', requireSignin, isAdmin, remove)
router.get('/categories', list)
router.get('/category/:slug', read)

export default router
