# NaijaHarvest Backend Progress Summary

## 1. Authentication & User Onboarding
- **Signup & Email Verification**  
  • POST `/api/auth/signup` → create user, send verification email with JWT link  
  • GET `/api/auth/verify-email?token=` → activate account  
- **Login**  
  • POST `/api/auth/login` → issue JWT (7 d expiry)  
- **Password Reset**  
  • POST `/api/auth/forgot-password` → email reset link (24 h JWT)  
  • POST `/api/auth/reset-password` → verify token, update password  

## 2. User Profile Management
- **Complete Profile**  
  • PUT `/api/users/me/profile` → select role (FARMER/BUYER/LOGISTICS_PARTNER), create sub-profile  
- **Profile Picture**  
  • POST `/api/users/me/profile-picture` → upload + store presigned URL  
  • GET `/api/users/me/profile-picture` → fetch URL  
- **Admin User Management**  
  • GET `/api/users/admin/users` (+filters)  
  • PATCH `/api/users/admin/users/:id/status` → suspend/activate/deactivate  
  • PUT `/api/users/admin/users/:id` → edit user fields + farmer bio  

## 3. Reviews & Ratings
- **Submit Review**  
  • POST `/api/users/:id/reviews` → create review, recalc averageRating & totalReviews on profiles  
- **Fetch Reviews**  
  • GET `/api/users/:id/reviews`

## 4. Product Listings
- **CRUD Endpoints** (auth protected)  
  • POST `/api/listings/` (multer: max 10 photos, 5 videos)  
  • GET `/api/listings/`  
  • GET `/api/listings/:id`  
  • PATCH `/api/listings/:id`  
  • DELETE `/api/listings/:id`  
  • PATCH `/api/listings/:id/status` → toggle `isActive`  
- **Sockets**: emit `listingCreated/Updated/Deleted/StatusChanged`  

## 5. Search & Discovery
- **Search Products**  
  • GET `/api/search?filters…` → full‐text, category, price, quantity, rating, distance, pagination  
  • Push each query into `User.searchHistory`  
- **Saved Searches & Alerts** (removed endpoints, now integrated via history + scheduled alerts)  

## 6. Cart & Orders
- **Cart**  
  • POST `/api/orders/cart/add/:userId` → push to `BuyerProfile.savedSearches.cart`  
- **Direct Order**  
  • POST `/api/orders/direct/:buyerId` → create `Order`, `OrderItem`, initial `Transaction PENDING`, notify farmer  
- **Place Order (from listing)**  
  • POST `/api/orders/order` → same as direct but uses authenticated `req.user.userId`  
- **Order Summary & History**  
  • GET `/api/orders/summary/:orderId` → full order + items + buyer/farmer info  
  • GET `/api/orders/history/buyer/:buyerId`  
  • GET `/api/orders/history/farmer/:farmerId`  

## 7. Negotiation & Messaging
- **Session Management**  
  • POST `/api/orders/:id/negotiate` → create `NegotiationSession`  
  • POST `/api/orders/:id/negotiate/msg` → append message to JSON array, timestamp  
  • PUT `/api/orders/:id/negotiate` → accept/reject, create `Notification`, email other party  

## 8. Payments & Wallet
- **Paystack Integration**  
  • POST `/api/payments/initiate` → include `orderId` in metadata, create `Transaction PENDING`  
  • GET `/api/payments/verify?reference=` → verify transaction  
  • POST `/api/payments/webhook` → validate signature, on `charge.success` update `Order.paymentStatus` & `Transaction`  
  • POST `/api/payments/release/:orderId` → buyer confirms delivery, update `Order.status=COMPLETED`, call payout via Paystack  
  • GET `/api/payments/history` → fetch user’s `Transaction` history  
- **Wallet Top-Up**  
  • GET `/api/wallet/balance` → upsert `Wallet` record  
  • POST `/api/wallet/topup` → init Paystack payment with `type: 'wallet'`, record `Transaction`  

## 9. Notifications & Admin Utilities
- **Notifications**: created on new orders, negotiation updates, saved-search alerts, payouts, disputes  
- **Admin Category Management**  
  • CRUD for `CropCategory`, `CropVariety`, `UnitOfMeasure`  
- **Broadcast Messages**  
  • POST `/api/admin/notifications/broadcast` → send `PLATFORM_ANNOUNCEMENT` to all active users  
- **Exports**  
  • CSV export of `Orders` and `Transactions` with optional date/type/status filters  
- **Dispute Resolution**  
  • PATCH `/api/admin/disputes/:id/resolve` → update statuses, refund via Paystack, create `REFUND` transaction  

---

_All endpoints are JSON-based, protected with JWT. Role guards (ADMIN, etc.) enforce access. AWS S3 used for file uploads. Prisma ORM for database. Nodemailer



Here are all the registered endpoints grouped by route file:

1) c:\Users\USER\auth\src\routes\auth.routes.js  
• POST   /api/auth/signup  
• GET    /api/auth/verify-email  
• POST   /api/auth/login  
• POST   /api/auth/forgot-password  
• POST   /api/auth/reset-password  

2) c:\Users\USER\auth\src\routes\user.routes.js  
• GET    /api/users/me  
• PUT    /api/users/me/profile  
• POST   /api/users/me/profile-picture  
• GET    /api/users/admin/users  
• PATCH  /api/users/admin/users/:id/status  
• PUT    /api/users/admin/users/:id  
• POST   /api/users/:id/reviews  
• GET    /api/users/:id/reviews  

3) c:\Users\USER\auth\src\routes\productListing.Routes.js  
(all under `/api/listings`, auth-protected)  
• POST   /api/listings/  
• GET    /api/listings/  
• GET    /api/listings/:id  
• PATCH  /api/listings/:id  
• DELETE /api/listings/:id  
• PATCH  /api/listings/:id/status  

4) c:\Users\USER\auth\src\routes\order.routes.js  
(all under `/api/orders`)  
• POST   /api/orders/:id/negotiate  
• POST   /api/orders/:id/negotiate/msg  
• PUT    /api/orders/:id/negotiate  
• POST   /api/orders/cart/add/:userId  
• POST   /api/orders/direct/:buyerId  
• POST   /api/orders/order  
• GET    /api/orders/summary/:orderId  
• GET    /api/orders/history/buyer/:buyerId  
• GET    /api/orders/history/farmer/:farmerId  

5) c:\Users\USER\auth\src\routes\productSearch.routes.js  
• GET    /api/search  

6) c:\Users\USER\auth\src\routes\payment.routes.js  
(all under `/api/payments`)  
• POST   /api/payments/initiate  
• GET    /api/payments/verify  
• POST   /api/payments/webhook