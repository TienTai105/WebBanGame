import express, { Express, Request, Response, NextFunction } from 'express'
import { createServer } from 'http'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import connectDB from './config/db.js'
import { errorHandler } from './middleware/auth.js'
import { verifyCsrfToken, generateCsrfToken } from './middleware/csrf.js' // ✅ Add CSRF import
import { startCronJobs } from './utils/cronJobs.js'
import { initSocket } from './socket.js'

// Routes
import authRoutes from './routes/auth.js'
import userRoutes from './routes/user.js'
import productRoutes from './routes/products.js'
import categoryRoutes from './routes/categories.js'
import brandRoutes from './routes/brands.js'
import platformRoutes from './routes/platforms.js'
import genreRoutes from './routes/genres.js'
import orderRoutes from './routes/orders.js'
import reviewRoutes from './routes/reviews.js'
import inventoryRoutes from './routes/inventory.js'
import checkoutRoutes from './routes/checkout.js'
import paymentRoutes from './routes/payment.js'
import newsRoutes from './routes/news.js'
import commentRoutes from './routes/comments.js'
import promotionRoutes from './routes/promotions.js'
import adminRoutes from './routes/admin.js'
import contactRoutes from './routes/contact.js'
import uploadRoutes from './routes/upload.js'
import packingSlipRoutes from './routes/packingslips.js'
import notificationRoutes from './routes/notifications.js'

dotenv.config()

const app: Express = express()

// Connect to MongoDB
connectDB()

// Start background jobs
startCronJobs()

// Middleware
app.use(helmet()) // Security headers
app.use(
  cors({
    origin: process.env.CLIENT_URL || ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
    credentials: true,
  })
)
app.use(morgan('combined')) // Logging
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))
app.use(cookieParser())

// Static files for images
app.use('/images', express.static('public/images'))

// ✅ CSRF Token endpoint (must be public, before CSRF middleware)
app.post('/api/csrf-token', generateCsrfToken)

// ✅ Apply CSRF middleware to all mutations (POST, PUT, DELETE)
app.use(verifyCsrfToken)

// ✅ Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for GET requests
    return req.method === 'GET'
  },
  keyGenerator: (req) => {
    // Use client IP for rate limiting
    const ip = req.ip || req.socket.remoteAddress || 'unknown'
    return ip
  },
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per window
  message: 'Too many login attempts, please try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown'
    return `auth-${ip}`
  },
})

// Apply general limiter to all /api routes
app.use('/api/', generalLimiter)

// Routes
// ✅ Apply stricter auth limiter to login/register endpoints
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/register', authLimiter)
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/products', productRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/brands', brandRoutes)
app.use('/api/platforms', platformRoutes)
app.use('/api/genres', genreRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/inventory', inventoryRoutes)
app.use('/api/checkout', checkoutRoutes)
app.use('/api/payment', paymentRoutes)
app.use('/api/promotions', promotionRoutes)
app.use('/api/news', newsRoutes)
app.use('/api/contact', contactRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api', commentRoutes)
app.use('/api/packingslips', packingSlipRoutes)
app.use('/api/notifications', notificationRoutes)

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'Server is running', timestamp: new Date() })
})

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Route not found' })
})

// Error handler (must be last)
app.use(errorHandler)

const PORT = process.env.PORT || 5000
const httpServer = createServer(app)
initSocket(httpServer)

const server = httpServer.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║  🎮 WebBanGame Server                      ║
║  ✓ Running on http://localhost:${PORT}      ║
║  ✓ Environment: ${process.env.NODE_ENV || 'development'}           ║
║  ✓ Socket.IO enabled                       ║
╚════════════════════════════════════════════╝
  `)
})

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server')
  server.close(() => {
    console.log('HTTP server closed')
    process.exit(0)
  })
})
