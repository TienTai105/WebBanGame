import mongoose, { Schema, Document, Model } from 'mongoose'

interface IOTPVerification extends Document {
  userId: mongoose.Types.ObjectId
  otp: string
  action: string
  actionData?: {
    [key: string]: any
  }
  expiresAt: Date
  attempts: number
  verified: boolean
  createdAt: Date
}

const otpVerificationSchema = new Schema<IOTPVerification>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    otp: {
      type: String,
      required: true,
      length: 6,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    actionData: {
      type: Schema.Types.Mixed,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Auto-delete after expiry
    },
    attempts: {
      type: Number,
      default: 0,
      max: 3,
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

const OTPVerification: Model<IOTPVerification> = mongoose.model(
  'OTPVerification',
  otpVerificationSchema
)

export default OTPVerification
