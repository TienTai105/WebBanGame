import mongoose, { Schema, Document, Model } from 'mongoose'

interface IContact extends Document {
  fullName: string
  email: string
  phone: string
  subject: string
  message: string
  status: 'pending' | 'read' | 'replied' | 'closed'
  replyMessage?: string
  adminNotes?: string
  repliedBy?: mongoose.Types.ObjectId
  repliedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const contactSchema = new Schema<IContact>(
  {
    fullName: {
      type: String,
      required: [true, 'Vui lòng nhập họ tên'],
      trim: true,
      maxlength: [100, 'Họ tên tối đa 100 ký tự'],
    },
    email: {
      type: String,
      required: [true, 'Vui lòng nhập email'],
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email không hợp lệ'],
    },
    phone: {
      type: String,
      required: [true, 'Vui lòng nhập số điện thoại'],
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'Vui lòng nhập chủ đề'],
      trim: true,
      maxlength: [200, 'Chủ đề tối đa 200 ký tự'],
    },
    message: {
      type: String,
      required: [true, 'Vui lòng nhập nội dung'],
      trim: true,
      maxlength: [5000, 'Nội dung tối đa 5000 ký tự'],
    },
    status: {
      type: String,
      enum: ['pending', 'read', 'replied', 'closed'],
      default: 'pending',
    },
    replyMessage: {
      type: String,
      default: null,
      maxlength: [5000, 'Nội dung trả lời tối đa 5000 ký tự'],
    },
    adminNotes: {
      type: String,
      default: null,
      maxlength: [2000, 'Ghi chú tối đa 2000 ký tự'],
    },
    repliedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    repliedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
)

contactSchema.index({ status: 1, createdAt: -1 })
contactSchema.index({ email: 1 })

const Contact: Model<IContact> = mongoose.model('Contact', contactSchema)
export default Contact
export type { IContact }
