import jwt from 'jsonwebtoken'
import User from '../models/user.js'

export const requireSignin = (req, res, next) => {
  try {
    const decoded = jwt.verify(
      req.headers.authorization,
      process.env.JWT_SECRET
    )

    req.user = decoded
  } catch (err) {
    return res.status(401).json(err)
  }
  next()
}

//axios.defaults.baseURL = process.env.REACT_APP_BACKEND
//axios.defaults.headers.common["Authorization"] = auth.token

export const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
    if (user.role !== 1) {
      return res.status(401).send('UnAuthorization')
    } else {
      next()
    }
  } catch (err) {
    console.log(err)
  }
}
