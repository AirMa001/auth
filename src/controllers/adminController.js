const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const ResponseHelper = require('../utils/responseHelper')

class AdminController {
  // Fetch users awaiting verification
  static async getPendingUsers(req, res) {
    const users = await prisma.user.findMany({ where: { status: 'PENDING_VERIFICATION' } })
    return ResponseHelper.success(res, 'Pending users fetched', users)
  }

  // Update user status (verification, suspend, deactivate)
  static async updateUserStatus(req, res) {
    const { id } = req.params
    const { status } = req.body
    const valid = ['ACTIVE','SUSPENDED','DEACTIVATED']
    if (!valid.includes(status)) {
      return ResponseHelper.validationError(res, [{ field: 'status', message: 'Invalid status' }])
    }
    const user = await prisma.user.update({ where: { id }, data: { status } })
    return ResponseHelper.success(res, 'User status updated', user)
  }

  // List all users with optional filters (admin only)
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
      return ResponseHelper.success(res, 'Users fetched', users)
    } catch (error) {
      console.error('List users error:', error)
      return ResponseHelper.error(res, 'Failed to list users')
    }
  }
}

module.exports = AdminController