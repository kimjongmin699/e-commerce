import mongoose from 'mongoose'
const { Schema } = mongoose
const { ObjectId } = mongoose.Schema

const orderSchema = new Schema(
  {
    products: [{ type: ObjectId, ref: 'Product' }],
    payment: {},
    buyer: { type: ObjectId, ref: 'User' },
    status: {
      type: String,
      default: 'NotProcessed',
      enum: ['NotProcessed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    },
  },
  { timestamps: true }
)

export default mongoose.model('Order', orderSchema)
