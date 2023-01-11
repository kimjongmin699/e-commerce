import { comparePassword, hashPassword } from '../helpers/auth.js'
import User from '../models/user.js'
import Order from '../models/order.js'
import jwt from 'jsonwebtoken'
import * as dotenv from 'dotenv'
dotenv.config()

export const usersController = (req, res) => {
  res.json({
    data: 'This is Users',
  })
}

export const register = async (req, res) => {
  try {
    const { email, password, name } = req.body

    if (!name.trim()) {
      return res.json({ error: 'Name is required' })
    }
    if (!email) {
      return register.json({
        error: 'Email is required',
      })
    }
    if (!password || password.length < 6) {
      return res.json({
        error: 'Password must be at least 6char',
      })
    }

    const existingUser = await User.findOne({ email: email })
    if (existingUser) {
      return res.json({ error: 'Email is already taken' })
    }

    const hashedPassword = await hashPassword(password)

    const user = await new User({
      name,
      email,
      password: hashedPassword,
    }).save()

    const token = jwt.sign(
      { _id: user._id, name: name, email: email },
      process.env.JWT_SECRET,
      {
        expiresIn: '7d',
      }
    )

    res.json({
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        addredd: user.address,
      },
      token,
    })
  } catch (err) {
    console.log(err)
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email) {
      return register.json({
        error: 'Email is required',
      })
    }
    if (!password || password.length < 6) {
      return res.json({
        error: 'Password must be at least 6char',
      })
    }

    const user = await User.findOne({ email: email })
    if (!user) {
      return res.json({ error: 'User not found' })
    }

   
    const matchPassword = await comparePassword(password, user.password)
    if (!matchPassword) {
      return res.json({ error: 'Password wrong' })
    }

    const token = jwt.sign(
      { _id: user._id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      {
        expiresIn: '7d',
      }
    )

    res.json({
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        addredd: user.address,
      },
      token,
    })
  } catch (err) {
    console.log(err)
  }
}

export const updateProfile = async (req, res) => {
  try {
    const { name, password, address } = req.body
    const user = await User.findById(req.user._id)
    console.log('user', user)
    if (password && password < 6) {
      return res.json({ error: 'Password is longer than 6char.' })
    }
    const hashedPassword = password ? await hashPassword(password) : undefined
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      {
        name: name || user.name,
        password: hashedPassword || user.password,
        address: address || user.address,
      },
      {
        new: true,
      }
    )
    //updated.passowrd =undefined
    res.json(updated)
  } catch (err) {
    console.log(err)
  }
}

export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user._id })
      .populate('products', '-photo')
      .populate('buyer', 'name')
   
    res.json(orders)
  } catch (err) {
    console.log(err)
  }
}

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('products', '-photo')
      .populate('buyer', 'name')
      .sort({ createdAt: '-1' })
    res.json(orders)
  } catch (err) {
    console.log(err)
  }
}

export const secret = (req, res) => {
  res.json({ currentUser: req.user })
}
