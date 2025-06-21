const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()
const ResponseHelper = require("../utils/responseHelper")
const bcrypt = require("bcryptjs")

class RegistrationController {


  // Register a new user
  static async registerUser(req, res) {
    try {
      const { email, password } = req.body

      // Validate input
      if (!email || !password) {
        return ResponseHelper.validationError(res, [
          { field: !email ? "email" : "password", message: "Email and password are required" }
        ])
      }

      // Check if user exists
      const existingUser = await prisma.user.findUnique({ where: { email } })
      if (existingUser) {
        return ResponseHelper.validationError(res, [
          { field: "email", message: "User with this email already exists" }
        ])
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10)

      // Create user (role defaults to BUYER)
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
        }
      })

      return ResponseHelper.success(res, "Registration successful. Please verify your email.", {
        userId: user.id,
        verificationRequired: true
      })
    } catch (error) {
      console.error("Registration error:", error)
      ResponseHelper.error(res, "Registration failed", null)
    }
  }

  // Get registration statistics
  static async getRegistrationStats(req, res) {
    try {
      const [totalRegistrations, todayRegistrations, weeklyRegistrations, roleStats] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
        prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        }),
        Promise.all([
          prisma.user.count({ where: { role: "FARMER" } }),
          prisma.user.count({ where: { role: "BUYER" } }),
          prisma.user.count({ where: { role: "LOGISTICS_PARTNER" } }),
        ]),
      ])

      ResponseHelper.success(res, {
        total: totalRegistrations,
        today: todayRegistrations,
        thisWeek: weeklyRegistrations,
        byRole: {
          farmers: roleStats[0],
          buyers: roleStats[1],
          logisticsPartners: roleStats[2],
        },
      })
    } catch (error) {
      console.error("Get registration stats error:", error)
      ResponseHelper.error(res, "Failed to get registration statistics")
    }
  }
}

module.exports = RegistrationController
