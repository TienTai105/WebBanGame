import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const connectDB = async (): Promise<typeof mongoose> => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI as string, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    } as any)

    console.log(`✓ MongoDB connected: ${conn.connection.host}`)
    return conn
  } catch (error: any) {
    console.error(`✗ Error connecting to MongoDB: ${error.message}`)
    process.exit(1)
  }
}

export default connectDB
