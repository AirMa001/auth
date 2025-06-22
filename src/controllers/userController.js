const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const ResponseHelper = require('../utils/responseHelper')
const fileService = require('../services/fileService')

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

  // Upload profile picture
  static async uploadProfilePicture(req, res) {
    try {
      const { presignedUrl } = await fileService.uploadAndGetSignedUrl(req.file)
      await prisma.user.update({
        where: { id: req.user.userId },
        data: { profilePictureUrl: presignedUrl },
      })
      ResponseHelper.success(res, 'Profile picture uploaded', { profilePictureUrl: presignedUrl })
    } catch (err) {
      console.error('Upload profile picture error:', err)
      ResponseHelper.error(res, 'Failed to upload profile picture', err)
    }
  }

  static async getProfilePicture(req, res) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { profilePictureUrl: true }
      })
      if (!user || !user.profilePictureUrl) {
        return ResponseHelper.error(res, 'Profile picture not found')
      }
      ResponseHelper.success(res, 'Profile picture fetched', { profilePictureUrl: user.profilePictureUrl })
    } catch (err) {
      console.error('Get profile picture error:', err)
      ResponseHelper.error(res, 'Failed to fetch profile picture', err)
    }
  }

  static async updateUserStatus(req, res) {
    try {
      const { id } = req.params
      const { status } = req.body
      const validStatuses = ['ACTIVE', 'SUSPENDED', 'DEACTIVATED']
      if (!validStatuses.includes(status)) {
        return ResponseHelper.validationError(res, [{ field: 'status', message: 'Invalid status' }])
      }
      const user = await prisma.user.update({ where: { id }, data: { status } })
      ResponseHelper.success(res, 'User status updated', user)
    } catch (error) {
      console.error('Update user status error:', error)
      ResponseHelper.error(res, 'Failed to update user status')
    }
  }

  static async editUser(req, res) {
    try {
      const { id } = req.params;
      const { firstName, lastName, email, role, bio } = req.body;
      if (!firstName || !lastName || !email || !role) {
        return ResponseHelper.validationError(res,[
          { field:'firstName/lastName/email/role', message:'Required' }
        ]);
      }
      const user = await prisma.user.update({
        where:{ id },
        data:{ firstName, lastName, email, role }
      });
      // if farmer and bio provided
      if (role === 'FARMER' && bio !== undefined) {
        await prisma.farmerProfile.update({
          where:{ userId: id },
          data:{ bio }
        });
      }
      ResponseHelper.success(res,'User updated', user);
    } catch (error) {
      console.error('Edit user error:', error);
      ResponseHelper.error(res,'Failed to edit user');
    }
  }

  // 5.1.7 submit review & recalc average
  static async submitReview(req, res) {
    try {
      const subjectId = req.params.id;
      const { rating, comment } = req.body;
      if (!rating || rating<1||rating>5) {
        return ResponseHelper.validationError(res,[{ field:'rating', message:'1-5 required' }]);
      }
      // create review
      await prisma.review.create({
        data:{
          subjectId,
          reviewerId: req.user.userId,
          rating,
          comment
        }
      });
      // recalc on subject's profile
      const stats = await prisma.review.aggregate({
        where:{ subjectId },
        _avg:{ rating:true },
        _count:{ rating:true }
      });
      // determine profile type by role
      const subj = await prisma.user.findUnique({ where:{ id:subjectId } });
      if (subj.role === 'FARMER') {
        await prisma.farmerProfile.update({
          where:{ userId: subjectId },
          data:{
            averageRating: stats._avg.rating,
            totalReviews: stats._count.rating
          }
        });
      } else if (subj.role === 'BUYER') {
        await prisma.buyerProfile.update({
          where:{ userId: subjectId },
          data:{
            averageRating: stats._avg.rating,
            totalReviews: stats._count.rating
          }
        });
      }
      ResponseHelper.success(res,'Review submitted', null);
    } catch (e) {
      console.error('Submit review error:', e);
      ResponseHelper.error(res,'Failed to submit review');
    }
  }

  static async getReviews(req, res) {
    try {
      const subjectId = req.params.id;
      const reviews = await prisma.review.findMany({
        where:{ subjectId },
        include:{ reviewer:{ select:{ firstName:true, lastName:true } } }
      });
      ResponseHelper.success(res,'Reviews fetched', reviews);
    } catch (e) {
      console.error('Get reviews error:', e);
      ResponseHelper.error(res,'Failed to fetch reviews');
    }
  }
}

module.exports = UserController

