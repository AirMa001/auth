const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const ResponseHelper = require('../utils/responseHelper')
const { Parser } = require('json2csv')
const PaystackService = require('../services/paystackService')

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


      // Crop Categories
    static async addCategory(req, res) {
      try {
        const { name } = req.body;
        const category = await prisma.cropCategory.create({ data: { name } });
        res.json({ success: true, category });
      } catch (err) {
        res.status(400).json({ success: false, error: err.message });
      }
    }

    static async getAllCategory(req, res) {
      try {
        const units = await prisma.unitOfMeasure.findMany();
        ResponseHelper.success(res, 'Categories fetched', units);
      } catch (err) {
        console.error('Get units error:', err);
        ResponseHelper.error(res, 'Failed to fetch Categories', err);
      }
    }


    static async updateCategory(req, res) {
      try {
        const { id } = req.params;
        const { name } = req.body;
        const category = await prisma.cropCategory.update({
          where: { id },
          data: { name }
        });
        res.json({ success: true, category });
      } catch (err) {
        res.status(400).json({ success: false, error: err.message });
      }
    }

    static async deleteCategory(req, res) {
      try {
        const { id } = req.params;
        await prisma.cropCategory.delete({ where: { id } });
        res.json({ success: true, message: 'Deleted successfully' });
      } catch (err) {
        res.status(400).json({ success: false, error: err.message });
      }
    }  
    static async createVariety(req, res) {
    try {
      const { name, categoryId } = req.body;
      if (!name || !categoryId) {
        return ResponseHelper.error(res, 'Name and categoryId are required');
      }

      const newVariety = await prisma.cropVariety.create({
        data: { name, categoryId },
      });

      ResponseHelper.success(res, 'Variety created', newVariety);
    } catch (err) {
      console.error('Create variety error:', err);
      ResponseHelper.error(res, 'Failed to create variety', err);
    }
  }

  static async updateVariety(req, res) {
    try {
      const { id } = req.params;
      const { name, categoryId } = req.body;

      const updatedVariety = await prisma.cropVariety.update({
        where: { id },
        data: { name, categoryId },
      });

      ResponseHelper.success(res, 'Variety updated', updatedVariety);
    } catch (err) {
      console.error('Update variety error:', err);
      ResponseHelper.error(res, 'Failed to update variety', err);
    }
  }

  static async deleteVariety(req, res) {
    try {
      const { id } = req.params;

      await prisma.cropVariety.delete({
        where: { id },
      });

      ResponseHelper.success(res, 'Variety deleted');
    } catch (err) {
      console.error('Delete variety error:', err);
      ResponseHelper.error(res, 'Failed to delete variety', err);
    }
  }

  static async getAllVarieties(req, res) {
    try {
      const varieties = await prisma.cropVariety.findMany({
        include: {
          category: true,
        },
      });

      ResponseHelper.success(res, 'Varieties fetched', varieties);
    } catch (err) {
      console.error('Fetch varieties error:', err);
      ResponseHelper.error(res, 'Failed to fetch varieties', err);
    }
  }
  static async createUnit(req, res) {
    try {
      const { name, abbreviation, conversionToKg } = req.body;
      const unit = await prisma.unitOfMeasure.create({
        data: {
          name,
          abbreviation,
          conversionToKg: conversionToKg ? parseFloat(conversionToKg) : null
        }
      });
      ResponseHelper.success(res, 'Unit created successfully', unit);
    } catch (err) {
      console.error('Create unit error:', err);
      ResponseHelper.error(res, 'Failed to create unit', err);
    }
  }

  static async getAllUnits(req, res) {
    try {
      const units = await prisma.unitOfMeasure.findMany();
      ResponseHelper.success(res, 'Units fetched', units);
    } catch (err) {
      console.error('Get units error:', err);
      ResponseHelper.error(res, 'Failed to fetch units', err);
    }
  }

  static async updateUnit(req, res) {
    try {
      const { id } = req.params;
      const { name, abbreviation, conversionToKg } = req.body;
      const updated = await prisma.unitOfMeasure.update({
        where: { id },
        data: {
          name,
          abbreviation,
          conversionToKg: conversionToKg ? parseFloat(conversionToKg) : null
        }
      });
      ResponseHelper.success(res, 'Unit updated successfully', updated);
    } catch (err) {
      console.error('Update unit error:', err);
      ResponseHelper.error(res, 'Failed to update unit', err);
    }
  }

  static async deleteUnit(req, res) {
    try {
      const { id } = req.params;
      await prisma.unitOfMeasure.delete({ where: { id } });
      ResponseHelper.success(res, 'Unit deleted successfully');
    } catch (err) {
      console.error('Delete unit error:', err);
      ResponseHelper.error(res, 'Failed to delete unit', err);
    }
  }
  
   static async broadcast(req, res) {
    try {
      const { content } = req.body;

      if (!content) return ResponseHelper.error(res, 'Content is required');

      // Get all active users (you could scope it more: only buyers, only farmers, etc.)
      const users = await prisma.user.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true }
      });

      const notifications = users.map(user => ({
        userId: user.id,
        content,
        type: 'PLATFORM_ANNOUNCEMENT',
      }));

      await prisma.notification.createMany({ data: notifications });

      ResponseHelper.success(res, 'Broadcast notification sent to all users');
    } catch (err) {
      console.error('Broadcast error:', err);
      ResponseHelper.error(res, 'Failed to send broadcast', err);
    }
  }

  static async exportTransactions(req, res) {
    const { dateFrom, dateTo, type, status } = req.query
    let where = {}
    if (dateFrom || dateTo) where.createdAt = {}
    if (dateFrom) where.createdAt.gte = new Date(dateFrom)
    if (dateTo) where.createdAt.lte = new Date(dateTo)
    if (type) where.type = type.toUpperCase()
    if (status) where.status = status.toUpperCase()

    const data = await prisma.transaction.findMany({ where })
    const csv = new Parser().parse(data)
    res.header('Content-Type','text/csv')
    res.attachment('transactions.csv').send(csv)
  }

  static async exportOrders(req, res) {
    const { dateFrom, dateTo, status } = req.query
    let where = {}
    if (dateFrom||dateTo) where.createdAt = {}
    if (dateFrom) where.createdAt.gte = new Date(dateFrom)
    if (dateTo) where.createdAt.lte = new Date(dateTo)
    if (status) where.status = status.toUpperCase()

    const data = await prisma.order.findMany({ where })
    const csv = new Parser().parse(data)
    res.header('Content-Type','text/csv')
    res.attachment('orders.csv').send(csv)
  }

  static async resolveDispute(req, res) {
    const { id } = req.params
    const { resolutionNotes } = req.body
    // update dispute & refund
    const disp = await prisma.dispute.update({
      where:{ id },
      data:{ status:'RESOLVED', resolutionNotes }
    })
    await prisma.order.update({
      where:{ id: disp.orderId },
      data:{ paymentStatus:'REFUNDED', status:'CANCELLED' }
    })
    // refund via Paystack
    const txn = await prisma.transaction.findFirst({
      where:{ orderId: disp.orderId, type:'PAYMENT', status:'SUCCESSFUL' }
    })
    await PaystackService.paystackClient.transaction.refund(txn.gatewayReference)
    await prisma.transaction.create({
      data:{
        userId: disp.raisedById,
        orderId: disp.orderId,
        amount: txn.amount,
        type: 'REFUND',
        status: 'PENDING',
        gatewayReference: txn.gatewayReference
      }
    })
    ResponseHelper.success(res,'Dispute resolved and refund initiated',null)
  }
}

module.exports = AdminController