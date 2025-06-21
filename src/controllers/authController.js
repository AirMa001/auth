const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const ResponseHelper = require("../utils/responseHelper");
const { sendEmail } = require("../utils/emailService");
// const sendVerificationEmail = require("../utils/emailHelper"); // Implement as needed



const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const EMAIL_TOKEN_EXPIRY = "24h";

class AuthController {
  // Signup: username, email, password
  static async signup(req, res) {
    try {
      const { username, email, password } = req.body;
      if (!username || !email || !password) {
        return ResponseHelper.validationError(res, [
          { field: !username ? "username" : !email ? "email" : "password", message: "All fields are required" }
        ]);
      }

      // Check for existing username/email
      const existingUser = await prisma.user.findFirst({
        where: { OR: [{ username }, { email }] }
      });
      if (existingUser) {
        return ResponseHelper.validationError(res, [
          { field: existingUser.username === username ? "username" : "email", message: "Already taken" }
        ]);
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          username,
          email,
          passwordHash,
          status: "PENDING_VERIFICATION"
        }
      });

      // Generate email verification token
      const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: EMAIL_TOKEN_EXPIRY });

      // Send verification email
      const verifyLink = `${process.env.BASE_URL || 'http://localhost:5000'}/api/auth/verify-email?token=${token}`;
      console.log('email' , user.email);
      sendEmail(
        user.email,
        'Verify your NaijaHarvest account',
        `Please verify your account by clicking: ${verifyLink}`
      );

      return ResponseHelper.success(res, "Please check your email to verify your account.", {
        verificationRequired: true
      });
    } catch (error) {
      console.error("Signup error:", error);
      ResponseHelper.error(res, "Signup failed", null);
    }
  }

  // Email verification
  static async verifyEmail(req, res) {
    try {
      const { token } = req.query;
      if (!token) return ResponseHelper.validationError(res, [{ field: "token", message: "Token required" }]);
      let payload;
      try {
        payload = jwt.verify(token, JWT_SECRET);
      } catch {
        return ResponseHelper.error(res, "Invalid or expired token", null);
      }
      const user = await prisma.user.findUnique({ where: { id: payload.userId } });
      if (!user) return ResponseHelper.error(res, "User not found", null);
      if (user.status === "ACTIVE") {
        return ResponseHelper.success(res, "Account already verified.", null);
      }
      await prisma.user.update({ where: { id: user.id }, data: { status: "ACTIVE" } });
      // Optionally redirect to frontend
      return ResponseHelper.success(res, "Verification successful! Please log in.", null);
    } catch (error) {
      console.error("Verify email error:", error);
      ResponseHelper.error(res, "Verification failed", null);
    }
  }

  // Login
  static async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return ResponseHelper.validationError(res, [
          { field: !email ? "email" : "password", message: "Email and password required" }
        ]);
      }
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return ResponseHelper.error(res, "Invalid credentials", null);
      }
      if (user.status !== "ACTIVE") {
        return ResponseHelper.error(res, "Account not verified", null);
      }
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return ResponseHelper.error(res, "Invalid credentials", null);
      }
      const token = jwt.sign({ userId: user.id, role : user.role, username: user.username }, JWT_SECRET, { expiresIn: "7d" });
      return ResponseHelper.success(res, "Login successful", { token });
    } catch (error) {
      console.error("Login error:", error);
      ResponseHelper.error(res, "Login failed", null);
    }
  }
}

module.exports = AuthController;
