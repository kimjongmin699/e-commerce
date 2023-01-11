import express from 'express'
import * as dotenv from 'dotenv'
import mongoose from 'mongoose'
import authRouter from './routes/auth.js'
import categoryRouter from './routes/category.js'
import productRouter from './routes/product.js'
import morgan from 'morgan'
import formidable from 'express-formidable'
import cors from 'cors'

dotenv.config()

const app = express()

const PORT = process.env.PORT

//   .connect('mongodb://localhost:27017/e-commerce')

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('DB connect'))
  .catch((err) => console.log('DB error', err))

app.use(cors())
app.use(morgan('dev'))
app.use(express.json())

app.use((req, res, next) => {
  console.log('This is middleware')
  next()
})

app.use('/api', authRouter)
app.use('/api', categoryRouter)
app.use('/api', productRouter)

app.listen(PORT, () => {
  console.log(`Server is running Port:${PORT}`)
})
