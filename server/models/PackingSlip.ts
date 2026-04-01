import mongoose, { Schema, Document, Model } from 'mongoose'

interface IPackingSlipItem {
  productId: mongoose.Types.ObjectId
  name: string
  quantity: number
  variantSku?: string
  variant?: string
  itemNotes?: string
}

interface IPackingSlipNote {
  itemId?: string // productId or variantSku
  note: string
}

interface IPackingSlip extends Document {
  orderId: mongoose.Types.ObjectId
  orderCode: string
  items: IPackingSlipItem[]
  shippingAddress: {
    name: string
    phone: string
    address: string
    city: string
    ward?: string
    district?: string
  }
  generalNotes?: string
  itemNotes?: IPackingSlipNote[]
  totalPrice: number           // Total price snapshot from order
  finalPrice: number           // Final price (after discount) snapshot from order
  status: 'not_printed' | 'printed' | 'packing' | 'completed'
  printedAt?: Date
  packingStartedAt?: Date
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const packingSlipItemSchema = new Schema<IPackingSlipItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    variantSku: {
      type: String,
      default: null,
    },
    variant: {
      type: String,
      default: null,
    },
    itemNotes: {
      type: String,
      default: null,
    },
  },
  { _id: false }
)

const packingSlipNoteSchema = new Schema<IPackingSlipNote>(
  {
    itemId: String,
    note: String,
  },
  { _id: false }
)

const packingSlipSchema = new Schema<IPackingSlip>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order ID required'],
      unique: true,
      index: true,
    },
    orderCode: {
      type: String,
      required: true,
      index: true,
    },
    items: {
      type: [packingSlipItemSchema],
      required: true,
    },
    shippingAddress: {
      name: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      ward: String,
      district: String,
    },
    generalNotes: {
      type: String,
      default: null,
    },
    itemNotes: {
      type: [packingSlipNoteSchema],
      default: [],
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    finalPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ['not_printed', 'printed', 'packing', 'completed'],
      default: 'not_printed',
      index: true,
    },
    printedAt: {
      type: Date,
      default: null,
    },
    packingStartedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

const PackingSlip: Model<IPackingSlip> =
  mongoose.models.PackingSlip || mongoose.model('PackingSlip', packingSlipSchema)

export { PackingSlip, IPackingSlip, IPackingSlipItem }
