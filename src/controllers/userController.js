const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const ResponseHelper = require('../utils/responseHelper')

class UserController {
  // Fetch current user and linked profiles
  static async getCurrentUser(req, res) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        include: {
          farmerProfile: true,
          buyerProfile: true,
          logisticsProfile: true,
          adminProfile: true,
        },
      })
      if (!user) return ResponseHelper.error(res, 'User not found')
      ResponseHelper.success(res, 'User fetched', user)
    } catch (error) {
      console.error('Get current user error:', error)
      ResponseHelper.error(res, 'Failed to fetch user')
    }
  }

  // Complete user profile after initial signup
  static async completeProfile(req, res) {
    try {
      const { role, firstName, lastName, farmName, buyerType, companyName, businessRegNumber } = req.body
      // validate required fields
      if (!role || !firstName || !lastName) {
        return ResponseHelper.validationError(res, [{ field: 'role/firstName/lastName', message: 'Required' }])
      }
      const existing = await prisma.user.findUnique({ where: { id: req.user.userId } })
      if (existing.role) {
        return ResponseHelper.error(res, 'Profile already completed')
      }
      const updated = await prisma.$transaction(async tx => {
        await tx.user.update({ where: { id: req.user.userId }, data: { role, firstName, lastName } })
        switch (role) {
          case 'FARMER':
            await tx.farmerProfile.create({ data: { userId: req.user.userId, farmName } })
            break
          case 'BUYER':
            await tx.buyerProfile.create({ data: { userId: req.user.userId, buyerType, displayName: companyName || `${firstName} ${lastName}`, companyName, businessRegNumber } })
            break
          case 'LOGISTICS_PARTNER':
            await tx.logisticsPartner.create({ data: { userId: req.user.userId, companyName: companyName || '' } })
            break
          default:
            break
        }
        return tx.user.findUnique({ where: { id: req.user.userId }, include: { farmerProfile: true, buyerProfile: true, logisticsProfile: true } })
      })
      ResponseHelper.success(res, 'Profile completed', updated)
    } catch (error) {
      console.error('Complete profile error:', error)
      ResponseHelper.error(res, 'Failed to complete profile')
    }
  }

  // List all users (admin only)
  static async listAllUsers(req, res) {
    try {
      const roleParam = req.query.role || req.query.Role
      const statusParam = req.query.status || req.query.Status
      const filter = {}
      if (roleParam) filter.role = roleParam.toUpperCase()
      if (statusParam) filter.status = statusParam.toUpperCase()
      const users = await prisma.user.findMany({
        where: filter,
        select: { id: true, username: true, email: true, role: true, status: true, createdAt: true }
      })
      ResponseHelper.success(res, 'Users fetched', users)
    } catch (error) {
      console.error('List users error:', error)
      ResponseHelper.error(res, 'Failed to list users')
    }
  }
}

module.exports = UserController
