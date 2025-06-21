# NaijaHarvest Backend Development Plan

## 1. Directory Structure

```
naijaHarvest/
│
├── prisma/                # Prisma schema & migrations
├── src/
│   ├── config/            # App config, env, db connection
│   ├── middleware/        # Auth, error, validation, etc.
│   ├── utils/             # Helper functions, constants
│   ├── services/          # Business logic, integrations (e.g. payment, SMS)
│   ├── controllers/       # Route handlers
│   ├── models/            # Prisma client models (auto-generated or custom)
│   ├── routes/            # Express routers
│   ├── auth/              # Auth logic (model, controller, routes)
│   ├── user/              # User management (model, controller, routes)
│   ├── product/           # Product listing (model, controller, routes)
│   ├── order/             # Order logic (model, controller, routes)
│   ├── transaction/       # Payments, payouts (model, controller, routes)
│   ├── logistics/         # Logistics management
│   ├── dispute/           # Dispute resolution
│   ├── notification/      # Notification logic
│   ├── admin/             # Admin panel logic
│   └── index.js           # Express app entry
├── .env                   # Environment variables
├── package.json
├── package-lock.json
└── README.md
```

## 2. Node Packages to Install

- **Core**
  - express
  - dotenv
  - cors
  - helmet
  - morgan
  - body-parser
  - cookie-parser

- **Database & ORM**
  - @prisma/client
  - prisma

- **Authentication & Security**
  - bcryptjs
  - jsonwebtoken
  - express-validator
  - passport
  - passport-jwt

- **Utilities**
  - nodemailer (email)
  - twilio (SMS, or alternative)
  - uuid
  - dayjs or date-fns
  - multer (file uploads)
  - sharp (image processing)
  - winston (logging)

- **Payment Integration**
  - axios (for Paystack/Flutterwave API calls)

- **Dev Tools**
  - nodemon
  - eslint
  - prettier

## 3. External Tools & APIs

- **Database:** PostgreSQL (as per Prisma schema)
- **Payment Gateway:** Paystack or Flutterwave
- **SMS Gateway:** Twilio, Termii, or similar
- **Email:** SMTP (Gmail, SendGrid, etc.)
- **Cloud Storage:** AWS S3, Cloudinary, or similar (for images/docs)
- **Push Notifications:** Firebase Cloud Messaging (for mobile)
- **Geo:** Google Maps API (for geocoding, distance)

## 4. Feature Modules & Implementation Steps

### 4.1 Auth Module
- Registration (email/phone), login, JWT, OTP verification
- Password reset (email/SMS)
- Role-based access middleware

### 4.2 User Management
- CRUD for user profiles (Farmer, Buyer, Logistics, Admin)
- KYC/KYB: Upload & verify docs, farm pinning
- Address management
- User status (suspend, deactivate, verify)
- Rating & reviews

### 4.3 Product Listing & Catalog
- CRUD for product listings
- Upload photos/videos (with multer/sharp)
- Inventory tracking
- Category/variety/unit management (admin)
- Search, filter, sort endpoints

### 4.4 Order & Negotiation
- Cart/direct order
- Negotiation session (messaging)
- Order summary, confirmation, history
- Minimum order quantity logic
- Recurring orders (basic)

### 4.5 Logistics Management
- Assign logistics partner
- Status updates (pickup, in transit, delivered)
- Proof of delivery (photo/code)
- GPS tracking (if available)

### 4.6 Dispute Resolution
- Raise dispute (with evidence)
- Admin review, resolution workflow

### 4.7 Payment & Transaction
- Integrate Paystack/Flutterwave
- Escrow logic
- Commission/fee calculation
- Payout to farmers
- Transaction history

### 4.8 Notifications & Messaging
- In-app messaging (order-based)
- System notifications (email/SMS/push)
- Admin broadcasts

### 4.9 AI & Analytics (Phase 2)
- Price benchmarks
- Matchmaking suggestions
- Demand trends
- FAQ chatbot (optional, later)

### 4.10 Admin Panel
- Secure login
- User/listing/order/dispute/payment management
- Analytics & reporting

## 5. Development Steps

1. **Setup**
   - Initialize Node project, install packages
   - Setup .env, config, and Prisma schema
   - Setup Express app, error handling, logging

2. **Database**
   - Configure PostgreSQL, run Prisma migrations
   - Seed initial data (categories, units, admin user)

3. **Core Modules**
   - Build Auth, User, Product, Order, Transaction, Logistics, Dispute, Notification modules as above

4. **Integrations**
   - Implement payment, SMS, email, file storage integrations

5. **Testing**
   - Unit and integration tests (Jest, Supertest)

6. **Deployment**
   - Dockerize app, setup CI/CD, deploy to cloud (Heroku, AWS, etc.)

## 6. Clarifying Questions

- Which payment gateway do you prefer: Paystack or Flutterwave?
- Which SMS/email provider do you want to use?
- Do you want to support file uploads to local disk or cloud storage (S3/Cloudinary)?
- Will the admin panel be a separate frontend or integrated into the main app?

---

**Reference:** See `prisma/schema.prisma` for all DB models. Each feature module should map to the relevant models and business logic.

