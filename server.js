require('dotenv').config()
const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const app = express()

app.use(express.json())

// mount product-listing routes
const productListingRoutes = require('./src/routes/productListingRoutes')
const searchRoutes = require('./src/routes/productSearch.routes.js')

// Debug: log when mounting search routes
console.log('Mounting /api/search routes')

// Add a test route to verify router is loaded
app.get('/api/search/test', (req, res) => res.json({ ok: true, msg: 'Search route working' }))

// all routes under /api/listings
app.use('/api/search', searchRoutes)  
app.use('/api/listings', productListingRoutes)

app.get('/', (req, res) => {
  res.send('Server is running')
})

// Add a catch-all for 404s to help debug route issues
app.use((req, res, next) => {
  res.status(404).json({ error: `Route not found: ${req.originalUrl}` });
});

// Create HTTP server & Socket.IO
const server = http.createServer(app)
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL, methods: ['GET', 'POST'] },
})

// expose io to routes/controllers
app.set('socketio', io)

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)
  socket.on('joinRoom', (room) => socket.join(room))
  socket.on('leaveRoom', (room) => socket.leave(room))
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id))
})

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})
module.exports = app