import fs from 'fs'
import Product from '../models/product.js'
import Category from '../models/category.js'
import slugify from 'slugify'
import braintree from 'braintree'
import * as dotenv from 'dotenv'
import Order from '../models/order.js'
import sgMail from '@sendgrid/mail'

dotenv.config()
sgMail.setApiKey(process.env.SENDGRID_KEY)

const gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: process.env.BRAINTREE_MERCHANT_ID,
  publicKey: process.env.BRAINTREE_PUBLIC_ID,
  privateKey: process.env.BRAINTREE_PRIVATE_ID,
})

export const getToken = async (req, res) => {
  try {
    gateway.clientToken.generate({}, (err, response) => {
      if (err) {
        res.status(500).send(err)
      } else {
        res.send(response)
      }
    })
  } catch (err) {
    console.log(err)
  }
}

export const processPayment = (req, res) => {
  try {
    const { nonce, cart } = req.body
    //console.log(req.body)
    let total = 0
    cart.map((i) => {
      total += i.price
    })
    console.log('total', total)

    let newTransaction = gateway.transaction.sale(
      {
        amount: total,
        paymentMethodNonce: nonce,
        options: {
          submitForSettlement: true,
        },
      },
      (err, result) => {
        if (result) {
          //res.send(result)
          const order = new Order({
            products: cart,
            payment: result,
            buyer: req.user._id,
          }).save()
          decrementQuantity(cart)
          res.json({ ok: true, order: order })
        } else {
          res.status(500).send(err)
        }
      }
    )
  } catch (err) {
    console.log(err)
  }
}

const decrementQuantity = async (cart) => {
  try {
    const bulkOps = cart.map((item) => {
      return {
        updateOne: {
          filter: { _id: item._id },
          update: { $inc: { quantity: -0, sold: +1 } },
        },
      }
    })

    const updated = await Product.bulkWrite(bulkOps, {})
  } catch (err) {
    console.log(err)
  }
}

export const create = async (req, res) => {
  try {
    // console.log(req.fields)
    // console.log(req.files)
    const { name, description, price, category, quantity, shipping } =
      req.fields
    const { photo } = req.files

    switch (true) {
      case !name.trim():
        return res.json({ error: 'Name is required' })
      case !description.trim():
        return res.json({ error: 'description is required' })
      case !price.trim():
        return res.json({ error: 'price is required' })
      case !category.trim():
        return res.json({ error: 'category is required' })
      case !quantity.trim():
        return res.json({ error: 'quantity is required' })
      case !shipping.trim():
        return res.json({ error: 'shipping is required' })
      case photo && photo.size > 1000000:
        return res.json({ error: 'Image should be less than size' })
    }

    const product = new Product({ ...req.fields, slug: slugify(name) })

    if (photo) {
      product.photo.data = fs.readFileSync(photo.path)
      product.photo.contentType = photo.type
    }
    await product.save()

    res.json(product)
  } catch (err) {
    console.log(err)
    return res.status(400).json(err.message)
  }
}

export const list = async (req, res) => {
  try {
    const products = await Product.find({})
      .populate('category')
      .select('-photo')
      .limit(10)
      .sort({ createdAt: -1 })
    res.json(products)
  } catch (err) {
    console.log(err)
    return res.status(400).json(err.message)
  }
}

export const read = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id })
      .select('-photo')
      .populate('category')
    res.json(product)
  } catch (err) {
    console.log(err)
    return res.status(400).json(err.message)
  }
}

export const photo = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId).select('photo')
    if (product.photo.data) {
      res.set('Content-Type', product.photo.contentType)
      return res.send(product.photo.data)
    }
  } catch (err) {
    console.log(err)
    return res.status(400).json(err.message)
  }
}

export const remove = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(
      req.params.productId
    ).select('-photo')
    res.json(product)
  } catch (err) {
    console.log(err)
    return res.status(400).json(err.message)
  }
}

export const update = async (req, res) => {
  try {
    const { name, description, price, category, quantity, shipping } =
      req.fields
    const { photo } = req.files

    const product = await Product.findByIdAndUpdate(
      { _id: req.params.productId },
      {
        ...req.fields,
        slug: slugify(name),
      },
      { new: true }
    )

    if (photo) {
      product.photo.data = fs.readFileSync(photo.path)
      product.photo.contentType = photo.type
    }
    await product.save()

    res.json(product)
  } catch (err) {
    console.log(err)
    return res.status(400).json(err.message)
  }
}

export const filteredProducts = async (req, res) => {
  try {
    const { checked, radio } = req.body

    let args = {}

    if (checked.length > 0) args.category = checked
    if (radio.length > 0) args.price = { $gte: radio[0], $lte: radio[1] }

    const products = await Product.find(args)

    res.json(products)
  } catch (err) {
    console.log(err)
  }
}

export const productsCount = async (req, res) => {
  try {
    const total = await Product.find({}).estimatedDocumentCount()
    res.json(total)
  } catch (err) {
    console.log(err)
  }
}

export const listProducts = async (req, res) => {
  try {
    const perPage = 3
    const page = req.params.page ? req.params.page : 1
    const products = await Product.find({})
      .select('-photo')
      .skip((page - 1) * perPage)
      .limit(3)
      .sort({ createdAt: -1 })

    res.json(products)
  } catch (err) {
    console.log(err)
  }
}

export const productsSearch = async (req, res) => {
  try {
    const { keyword } = req.params
    const results = await Product.find({
      $or: [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
      ],
    }).select('-photo')

    res.json(results)
  } catch (err) {
    console.log(err)
  }
}

export const relatedProducts = async (req, res) => {
  try {
    const { productId, categoryId } = req.params
    const related = await Product.find({
      category: categoryId,
      _id: { $ne: productId },
    })
      .select('-photo')
      .populate('category')
      .limit(3)

    res.json(related)
  } catch (err) {
    console.log(err)
  }
}

export const productsById = async (req, res) => {
  try {
    const { categoryId } = req.params
    const category = await Category.findOne({ _id: categoryId })
    const products = await Product.find({ category })
      .select('-photo')
      .populate('category')
    res.json({ products: products, category: category })
  } catch (err) {
    console.log(err)
  }
}

export const orderStatus = async (req, res) => {
  try {
    const { orderId } = req.params
    const { status } = req.body
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    ).populate('buyer', 'email name')
    //send email

    //prepare email
    const emailData = {
      from: process.env.EMAIL_FROM,
      to: order.buyer.email,
      subject: 'Order status',
      html: `
        <h1>Hi, ${order.buyer.name}, Your status is:<span style="color:red">${order.status}</span></h1>
        <p>Vist <a href="${process.env.CLIENT_URL}/dashboard/user/orders">your Dashboard</a>For more Details</p>
      `,
    }
    console.log(emailData)
    try {
      const email = await sgMail.send(emailData)
      console.log('response', email)
    } catch (err) {
      console.log(err)
    }

    res.json(order)
  } catch (err) {
    console.log(err)
  }
}
