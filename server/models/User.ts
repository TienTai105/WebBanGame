import mongoose, { Schema, Document, Model } from 'mongoose'
import bcryptjs from 'bcryptjs'

// All available staff permissions
export const STAFF_PERMISSIONS = [
  'dashboard',
  'products',
  'orders',
  'inventory',
  'news',
  'comments',
  'contacts',
  'promotions',
  'reviews',
  'settings',
] as const

export type StaffPermission = (typeof STAFF_PERMISSIONS)[number]

interface IUser extends Document {
  name: string
  email: string
  emailVerified: boolean                           // Email confirmation status
  password: string
  role: 'customer' | 'staff' | 'admin'             // customer | staff (warehouse) | admin
  permissions: StaffPermission[]                   // Staff permissions (admin has all by default)
  defaultOTP?: string                               // Admin-set default OTP (skip email)
  phone?: string
  shippingAddresses?: Array<{
    name: string
    street: string
    city: string
    district: string
    ward: string
    zipCode: string
    isDefault: boolean
  }>
  avatar?: string
  isActive: boolean
  lastLogin?: Date
  lastActivity?: Date
  matchPassword(enteredPassword: string): Promise<boolean>
  createdAt: Date
  updatedAt: Date
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false, // Don't return password by default
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ['customer', 'staff', 'admin'],
      default: 'customer',
    },
    permissions: {
      type: [String],
      enum: ['dashboard', 'products', 'orders', 'inventory', 'news', 'comments', 'contacts', 'promotions', 'reviews', 'settings'],
      default: [],
    },
    defaultOTP: {
      type: String,
      default: null,
      select: false,
    },
    phone: {
      type: String,
      default: null,
    },
    shippingAddresses: [
      {
        name: String,
        street: String,
        city: String,
        district: String,
        ward: String,
        zipCode: String,
        isDefault: { type: Boolean, default: false },
      },
    ],
    avatar: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    lastActivity: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
)

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash if password is modified
  if (!this.isModified('password')) {
    return next()
  }

  try {
    const salt = await bcryptjs.genSalt(10)
    this.password = await bcryptjs.hash(this.password, salt)
    next()
  } catch (error: any) {
    next(error)
  }
})

// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword: string): Promise<boolean> {
  return await bcryptjs.compare(enteredPassword, this.password)
}

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema)
export default User
