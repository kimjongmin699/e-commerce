import mongoose from 'mongoose'
const { Schema } = mongoose

const categorySchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, lowercase: true, unique: true },
  },
  { timestamps: true }
)

export default mongoose.model('Category', categorySchema)
