import mongoose, { Schema, Document, Model } from 'mongoose'

interface IShipmentEvent {
  status: 'pending' | 'in_transit' | 'delivered' | 'failed' | 'returned'
  timestamp: Date
  location?: string
  notes?: string
}

interface IShipment extends Document {
  orderId: mongoose.Types.ObjectId
  trackingNumber: string
  carrier: 'GHN' | 'GHTK' | 'SPX' | 'Viettel' | 'Manual' | 'Other'
  estimatedDeliveryDate?: Date
  actualDeliveryDate?: Date
  status: 'pending' | 'in_transit' | 'delivered' | 'failed' | 'returned'
  events: IShipmentEvent[]
  shippingCost: number
  shipper?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const shipmentEventSchema = new Schema<IShipmentEvent>(
  {
    status: {
      type: String,
      enum: ['pending', 'in_transit', 'delivered', 'failed', 'returned'],
      required: true,
    },
    timestamp: {
      type: Date,
      default: () => new Date(),
    },
    location: String,
    notes: String,
  },
  { _id: false }
)

const shipmentSchema = new Schema<IShipment>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order ID required'],
      unique: true,
      index: true,
    },
    trackingNumber: {
      type: String,
      required: [true, 'Tracking number required'],
      unique: true,
      index: true,
    },
    carrier: {
      type: String,
      enum: ['GHN', 'GHTK', 'SPX', 'Viettel', 'Manual', 'Other'],
      required: true,
    },
    estimatedDeliveryDate: Date,
    actualDeliveryDate: Date,
    status: {
      type: String,
      enum: ['pending', 'in_transit', 'delivered', 'failed', 'returned'],
      default: 'pending',
      index: true,
    },
    events: [shipmentEventSchema],
    shippingCost: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    shipper: String,
    notes: String,
  },
  { timestamps: true }
)

// Index
shipmentSchema.index({ orderId: 1 })
shipmentSchema.index({ trackingNumber: 1 })
shipmentSchema.index({ status: 1, estimatedDeliveryDate: 1 })

const Shipment: Model<IShipment> = mongoose.model<IShipment>('Shipment', shipmentSchema)
export default Shipment
export type { IShipment, IShipmentEvent }
