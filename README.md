# WebBanGame - Gaming Equipment E-Commerce Platform

## Project Overview

WebBanGame is a modern e-commerce platform for selling gaming equipment (consoles, games, controllers, accessories) built with MERN stack.

### Features (MVP)
- ✅ User authentication (register/login with JWT)
- ✅ Product catalog with pagination
- 🔲 Shopping cart
- 🔲 Checkout & payment processing (VNPay, Momo)
- 🔲 Order management
- 🔲 Inventory management
- 🔲 Admin dashboard

### Tech Stack
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Express.js + Node.js
- **Database**: MongoDB
- **Authentication**: JWT + httpOnly cookies

## Project Structure

```
WebBanGame/
├── server/
│   ├── models/          # MongoDB schemas
│   ├── controllers/     # Route handlers
│   ├── routes/          # API endpoints
│   ├── middleware/      # Auth, validation, error handling
│   ├── services/        # Business logic
│   ├── config/          # Database configuration
│   ├── utils/           # Utilities (token, etc)
│   ├── server.js        # Entry point
│   └── package.json
├── client/
│   ├── src/
│   │   ├── pages/       # Page components
│   │   ├── components/  # Reusable components
│   │   ├── services/    # API services
│   │   ├── hooks/       # Custom hooks
│   │   ├── context/     # Context API
│   │   ├── utils/       # Utilities
│   │   ├── App.jsx      # Root component
│   │   └── main.jsx     # Entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── docker-compose.yml   # Local development
└── package.json         # Root monorepo
```

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (Atlas free tier or local)
- npm/yarn

### Installation

1. **Backend Setup**
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secrets
```

2. **Frontend Setup**
```bash
cd client
npm install
```

3. **Run Development**
```bash
# From root directory
npm run dev

# Or separately:
# Terminal 1: Backend (port 5000)
cd server && npm run dev

# Terminal 2: Frontend (port 5173)
cd client && npm run dev
```

### Environment Variables

#### Server (.env)
```
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/webbandb
JWT_SECRET=your_secret_key
JWT_REFRESH_SECRET=your_refresh_secret
CLIENT_URL=http://localhost:5173
```

#### Client (.env.local)
```
VITE_API_URL=http://localhost:5000/api
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh-token` - Refresh access token
- `GET /api/auth/me` - Get current user (protected)

### Products
- `GET /api/products` - List all products (with pagination)
- `GET /api/products/:id` - Get product detail
- `GET /api/products/category/:category` - Products by category
- `GET /api/products/trending` - Trending products
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

## Development Progress

### Week 1 ✅
- [x] Project structure setup
- [x] Backend: Express server, MongoDB connection
- [x] Authentication: JWT, user model, auth routes
- [x] Frontend: React with Vite, basic pages (Home, Login, Register)
- [x] Product model & listing API

### Week 2 (In Progress)
- [ ] Product detail page
- [ ] Shopping cart functionality
- [ ] Payment gateway setup (Momo, VNPay)
- [ ] Checkout flow

### Week 3-4
- [ ] Inventory management
- [ ] Order processing
- [ ] Email notifications

### Week 5-6
- [ ] Admin dashboard
- [ ] Analytics

### Week 7-8
- [ ] Testing & optimization
- [ ] Production deployment

## Database Schema

### User
```
{
  _id, name, email, password (hashed), role, phone,
  shippingAddresses[], avatar, isActive, lastLogin,
  timestamps
}
```

### Product
```
{
  _id, name, slug, description, sku, category, subcategory,
  price, cost, discount, finalPrice, images[], specifications,
  stock, minStockAlert, tags, ratings, supplier,
  isActive, views, timestamps
}
```

## Deployment

### Staging
- Frontend: Vercel (auto-deploy from GitHub)
- Backend: DigitalOcean App Platform
- Database: MongoDB Atlas

### Production
- Same as staging with production builds

## License

MIT

## Support

For issues or questions, create an issue in the repository.
