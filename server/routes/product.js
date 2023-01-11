import express from 'express'
import { isAdmin, requireSignin } from '../middlewares/authMiddleware.js'
import {
  create,
  list,
  read,
  photo,
  remove,
  update,
  filteredProducts,
  productsCount,
  listProducts,
  productsSearch,
  relatedProducts,
  productsById,
  getToken,
  processPayment,
  orderStatus,
} from '../controllers/product.js'
import formidable from 'express-formidable'

const router = express.Router()

router.post('/product', requireSignin, isAdmin, formidable(), create)
router.get('/products', list)
router.get('/product/:id', read)
router.get('/product/photo/:productId', photo)
router.delete('/product/:productId', requireSignin, isAdmin, remove)
router.put('/product/:productId', formidable(), update)
router.post('/filtered-products', filteredProducts)
router.get('/products-count', productsCount)
router.get('/list-products/:page', listProducts)
router.get('/products/search/:keyword', productsSearch)
router.get('/related-products/:productId/:categoryId', relatedProducts)
router.get('/products-by-id/:categoryId', productsById)

router.get('/braintree/token', getToken)
router.post('/braintree/payment', requireSignin, processPayment)
router.put('/order-status/:orderId', requireSignin, isAdmin, orderStatus)

export default router
