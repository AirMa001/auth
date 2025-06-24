// Import required packages
const express = require("express")
const cors = require("cors") // Cross-Origin Resource Sharing
const helmet = require("helmet") // Security headers
const compression = require("compression") // Response compression
const morgan = require("morgan") // HTTP request logger
const rateLimit = require("express-rate-limit") // Rate limiting
const http = require("http")
const { Server } = require("socket.io")

require("dotenv").config() // Load environment variables


// Import route modules
const authRoutes = require("./src/routes/auth.routes")
const userRoutes = require("./src/routes/user.routes")
const adminRoutes = require("./src/routes/admin.routes")
const productSearchRoutes = require('./src/routes/productSearch.routes')
const productListingroutes = require("./src/routes/productListing.routes")
const orderAndNegotiationRoute = require("./src/routes/order.routes")
const paymentRoutes = require("./src/routes/payment.routes")
const catalogRoutes = require("./src/routes/catalog.routes") // Catalog management routes

// Create Express application
const app = express()

// create HTTP server and Socket.IO instance
const server = http.createServer(app)
const io = new Server(server, { cors: { origin: "*" } })
app.set("socketio", io)

/**
 * SECURITY MIDDLEWARE
 * Applied before other middleware for maximum protection
 */

// Helmet sets various HTTP headers to secure the app
// app.use(helmet())

// CORS configuration - allows frontend to communicate with backend
//app.use(
//  cors({
//    origin: process.env.FRONTEND_URL || "http://localhost:3000", // Allow requests from frontend
//    credentials: true, // Allow cookies and authentication headers
//  }),
//)

/**
 * RATE LIMITING
 * Prevents abuse by limiting requests per IP address
 */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
})
app.use(limiter)

/**
 * BODY PARSING MIDDLEWARE
 * Parses incoming request bodies
 */
app.use(compression()) // Compress responses to reduce bandwidth
app.use(express.json({ limit: "10mb" })) // Parse JSON bodies (limit: 10MB)
app.use(express.urlencoded({ extended: true, limit: "10mb" })) // Parse URL-encoded bodies

/**
 * LOGGING MIDDLEWARE
 * Logs all HTTP requests for debugging and monitoring
 */
app.use(morgan("combined")) // Use Apache combined log format

/**
 * HEALTH CHECK ENDPOINT
 * Used by load balancers and monitoring tools to check if server is running
 */
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(), // Server uptime in seconds
  })
})

/**
 * API ROUTES
 * All routes are prefixed with /api for clear API versioning
 */

app.use("/api/products", productListingroutes)
app.use("/api/auth", authRoutes) // Authentication routes (register, login, etc.)
app.use("/api/users", userRoutes) // User management routes
app.use("/api/admin", adminRoutes) // Admin-only routes
app.use('/api/search', productSearchRoutes) // Product search and discovery routes
app.use("/api/order", orderAndNegotiationRoute) // order and negotiation
app.use("/api/payments", paymentRoutes) // Payment processing routes
app.use("/api/catalog", catalogRoutes) // Catalog management routes

const PORT = process.env.PORT || 5000

// replace app.listen with server.listen to enable WebSocket support
// app.listen(PORT, () => {
//   ...existing logs...
// })
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📧 Email service configured and ready`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`)
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:3000"}`)
})

// Export app for testing purposes
module.exports = app
