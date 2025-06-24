const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const ResponseHelper = require('../utils/responseHelper');

class LogisticsController {
  // Admin assigns a logistics partner to an order
  static async assignPartner(req, res) {
    try {
      const { orderId, logisticsPartnerId } = req.body;

      const assignment = await prisma.logisticsAssignment.create({
        data: {
          orderId,
          logisticsPartnerId,
          status: 'ASSIGNED',
        },
      });

      ResponseHelper.success(res, 'Logistics partner assigned', assignment);
    } catch (err) {
      console.error('Assign partner error:', err);
      ResponseHelper.error(res, 'Failed to assign logistics partner', err);
    }
  }

  // Partner updates assignment status
  static async updateStatus(req, res) {
    try {
      const { assignmentId } = req.params;
      const { status, trackingCode } = req.body;

      const allowed = ['ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'];
      if (!allowed.includes(status)) {
        return ResponseHelper.error(res, 'Invalid status');
      }

      const updated = await prisma.logisticsAssignment.update({
        where: { id: assignmentId },
        data: {
          status,
          trackingCode: trackingCode || undefined,
        },
      });

      ResponseHelper.success(res, `Status updated to ${status}`, updated);
    } catch (err) {
      console.error('Update status error:', err);
      ResponseHelper.error(res, 'Failed to update logistics status', err);
    }
  }

  // View assignments by logistics partner
  static async getMyAssignments(req, res) {
    try {
      const userId = req.user.id; // Assuming you're using auth middleware
      const partner = await prisma.logisticsPartner.findUnique({
        where: { userId },
      });

      const assignments = await prisma.logisticsAssignment.findMany({
        where: { logisticsPartnerId: partner.id },
        include: { order: true },
      });

      ResponseHelper.success(res, 'My assignments', assignments);
    } catch (err) {
      console.error('Fetch assignments error:', err);
      ResponseHelper.error(res, 'Failed to get assignments', err);
    }
  }
}

module.exports = LogisticsController;
