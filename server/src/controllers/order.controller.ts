import { Response } from 'express';
import { prisma } from '../config/db';
import { AuthenticatedRequest } from '../middleware/authGuard';
import { calculateQuote, RateCardRule, CodConfigRule } from '../services/rateEngine';
import { autoAssignAgent, CandidateAgent } from '../services/assignEngine';
import { sendNotification } from '../services/notifyService';

function generateTrackingNumber(): string {
  const randomStr = Math.floor(100000 + Math.random() * 900000);
  return `TRK-${Date.now().toString().slice(-4)}-${randomStr}`;
}

export async function getQuote(req: AuthenticatedRequest, res: Response) {
  try {
    const {
      pickupPincode,
      dropPincode,
      lengthCm,
      breadthCm,
      heightCm,
      actualWeightKg,
      orderType,
      paymentType,
    } = req.body;

    if (!pickupPincode || !dropPincode || !lengthCm || !breadthCm || !heightCm || !actualWeightKg || !orderType || !paymentType) {
      return res.status(400).json({ error: 'All dimensional, weight, pincode, orderType, and paymentType parameters are required.' });
    }

    // 1. Zone Detection via Pincode lookup
    const pickupArea = await prisma.zoneArea.findUnique({ where: { pincode: pickupPincode } });
    const dropArea = await prisma.zoneArea.findUnique({ where: { pincode: dropPincode } });

    const pickupZoneId = pickupArea ? pickupArea.zoneId : null;
    const dropZoneId = dropArea ? dropArea.zoneId : null;

    const relation = pickupZoneId && dropZoneId && pickupZoneId === dropZoneId ? 'INTRA' : 'INTER';

    // 2. Fetch Rate Card
    const rateCard = await prisma.rateCard.findFirst({
      where: { orderType, relation, isActive: true },
    });

    if (!rateCard) {
      return res.status(404).json({ error: `No active rate card found for ${orderType} / ${relation}` });
    }

    // 3. Fetch COD Surcharge Config
    let codConfig: CodConfigRule | null = null;
    if (paymentType === 'COD') {
      codConfig = await prisma.codSurchargeConfig.findFirst({
        where: { orderType, isActive: true },
      });
    }

    // 4. Pure Engine Calculation
    const quote = calculateQuote(
      {
        pickupPincode,
        dropPincode,
        pickupZoneId,
        dropZoneId,
        lengthCm: Number(lengthCm),
        breadthCm: Number(breadthCm),
        heightCm: Number(heightCm),
        actualWeightKg: Number(actualWeightKg),
        orderType,
        paymentType,
      },
      rateCard as RateCardRule,
      codConfig
    );

    return res.json({
      ...quote,
      pickupAreaName: pickupArea?.areaName || 'Unknown Locality',
      dropAreaName: dropArea?.areaName || 'Unknown Locality',
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to calculate quote.' });
  }
}

export async function createOrder(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });

    const {
      pickupAddress,
      dropAddress,
      pickupPincode,
      dropPincode,
      lengthCm,
      breadthCm,
      heightCm,
      actualWeightKg,
      orderType,
      paymentType,
      scheduledDate,
      customerId: customCustomerId,
    } = req.body;

    // Customer defaults to logged in user, or Admin acting on behalf of Customer
    const customerId = req.user.role === 'ADMIN' && customCustomerId ? customCustomerId : req.user.id;

    // Lookup Zones
    const pickupArea = await prisma.zoneArea.findUnique({ where: { pincode: pickupPincode } });
    const dropArea = await prisma.zoneArea.findUnique({ where: { pincode: dropPincode } });
    const pickupZoneId = pickupArea?.zoneId || null;
    const dropZoneId = dropArea?.zoneId || null;

    const relation = pickupZoneId && dropZoneId && pickupZoneId === dropZoneId ? 'INTRA' : 'INTER';

    const rateCard = await prisma.rateCard.findFirst({
      where: { orderType, relation, isActive: true },
    });

    if (!rateCard) {
      return res.status(400).json({ error: `Cannot place order. No active rate card for ${orderType} ${relation}` });
    }

    let codConfig: CodConfigRule | null = null;
    if (paymentType === 'COD') {
      codConfig = await prisma.codSurchargeConfig.findFirst({ where: { orderType, isActive: true } });
    }

    const quote = calculateQuote(
      {
        pickupPincode,
        dropPincode,
        pickupZoneId,
        dropZoneId,
        lengthCm: Number(lengthCm),
        breadthCm: Number(breadthCm),
        heightCm: Number(heightCm),
        actualWeightKg: Number(actualWeightKg),
        orderType,
        paymentType,
      },
      rateCard as RateCardRule,
      codConfig
    );

    const trackingNumber = generateTrackingNumber();

    // Create Order with initial OrderStatusHistory entry
    const order = await prisma.order.create({
      data: {
        trackingNumber,
        customerId,
        createdByUserId: req.user.id,
        pickupAddress,
        dropAddress,
        pickupPincode,
        dropPincode,
        pickupZoneId,
        dropZoneId,
        lengthCm: Number(lengthCm),
        breadthCm: Number(breadthCm),
        heightCm: Number(heightCm),
        actualWeightKg: Number(actualWeightKg),
        volumetricWeightKg: quote.volumetricWeightKg,
        billedWeightKg: quote.billedWeightKg,
        orderType,
        paymentType,
        baseCharge: quote.baseCharge,
        codSurcharge: quote.codSurcharge,
        totalCharge: quote.totalCharge,
        currentStatus: 'CREATED',
        scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date(),
        statusHistory: {
          create: {
            status: 'CREATED',
            actorUserId: req.user.id,
            actorRole: req.user.role,
            remarks: 'Order submitted and rate calculated.',
          },
        },
      },
      include: {
        customer: true,
        pickupZone: true,
        dropZone: true,
        statusHistory: true,
      },
    });

    // Notify Customer
    await sendNotification(order.id, order.customer.email, 'CREATED', 'Your shipment has been registered.');

    return res.status(201).json(order);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to create order.' });
  }
}

export async function getOrders(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });

    const { status, zoneId, agentId } = req.query;

    const whereClause: any = {};

    // Role-based filtering
    if (req.user.role === 'CUSTOMER') {
      whereClause.customerId = req.user.id;
    } else if (req.user.role === 'AGENT') {
      const agentProfile = await prisma.agent.findUnique({ where: { userId: req.user.id } });
      if (agentProfile) {
        whereClause.assignedAgentId = agentProfile.id;
      }
    }

    if (status) whereClause.currentStatus = String(status);
    if (zoneId) whereClause.pickupZoneId = String(zoneId);
    if (agentId) whereClause.assignedAgentId = String(agentId);

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        assignedAgent: { include: { user: { select: { name: true, phone: true } } } },
        pickupZone: true,
        dropZone: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(orders);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch orders.' });
  }
}

export async function getOrderById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        assignedAgent: { include: { user: { select: { name: true, phone: true } } } },
        pickupZone: true,
        dropZone: true,
        statusHistory: {
          include: { actor: { select: { name: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
        rescheduleRequests: true,
        notifications: true,
      },
    });

    if (!order) return res.status(404).json({ error: 'Order not found.' });
    return res.json(order);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch order.' });
  }
}

export async function getOrderTimeline(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const history = await prisma.orderStatusHistory.findMany({
      where: { orderId: id },
      include: { actor: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    });

    return res.json(history);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch order timeline.' });
  }
}

export async function autoAssignOrder(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({ where: { id } });

    if (!order) return res.status(404).json({ error: 'Order not found.' });

    // Fetch candidate agents
    const agents = await prisma.agent.findMany({
      include: {
        user: { select: { name: true } },
        assignedOrders: {
          where: { currentStatus: { notIn: ['DELIVERED', 'FAILED'] } },
        },
      },
    });

    const candidates: CandidateAgent[] = agents.map((a) => ({
      id: a.id,
      name: a.user.name,
      status: a.status as any,
      currentZoneId: a.currentZoneId,
      currentLat: a.currentLat,
      currentLng: a.currentLng,
      activeOrdersCount: a.assignedOrders.length,
    }));

    const result = autoAssignAgent(
      {
        orderId: order.id,
        pickupZoneId: order.pickupZoneId,
      },
      candidates
    );

    if (!result.assignedAgentId) {
      return res.status(400).json({
        error: 'Auto-assignment failed.',
        reason: result.reason,
      });
    }

    // Perform Assignment DB Updates
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        assignedAgentId: result.assignedAgentId,
        currentStatus: 'ASSIGNED',
        statusHistory: {
          create: {
            status: 'ASSIGNED',
            actorUserId: req.user?.id || null,
            actorRole: req.user?.role || 'SYSTEM',
            remarks: `Auto-assigned agent: ${result.assignedAgentName} (${result.reason})`,
          },
        },
      },
      include: { assignedAgent: { include: { user: true } }, customer: true },
    });

    // Mark agent as BUSY
    await prisma.agent.update({
      where: { id: result.assignedAgentId },
      data: { status: 'BUSY' },
    });

    // Notify customer
    await sendNotification(
      order.id,
      updatedOrder.customer.email,
      'ASSIGNED',
      `Agent ${result.assignedAgentName} has been assigned to your delivery.`
    );

    return res.json({
      message: 'Order auto-assigned successfully.',
      assignment: result,
      order: updatedOrder,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Auto-assignment failed.' });
  }
}

export async function manualAssignOrder(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { agentId } = req.body;

    if (!agentId) return res.status(400).json({ error: 'Agent ID is required.' });

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: { user: true },
    });

    if (!agent) return res.status(404).json({ error: 'Agent not found.' });

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        assignedAgentId: agentId,
        currentStatus: 'ASSIGNED',
        statusHistory: {
          create: {
            status: 'ASSIGNED',
            actorUserId: req.user?.id,
            actorRole: req.user?.role || 'ADMIN',
            remarks: `Manually assigned to agent ${agent.user.name} by Admin.`,
          },
        },
      },
      include: { customer: true },
    });

    await prisma.agent.update({ where: { id: agentId }, data: { status: 'BUSY' } });

    await sendNotification(id, updatedOrder.customer.email, 'ASSIGNED', `Agent ${agent.user.name} assigned.`);

    return res.json(updatedOrder);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Manual assignment failed.' });
  }
}

export async function updateOrderStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const allowedStatuses = ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}` });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        currentStatus: status,
        statusHistory: {
          create: {
            status,
            actorUserId: req.user?.id,
            actorRole: req.user?.role || 'AGENT',
            remarks: remarks || `Status set to ${status}`,
          },
        },
      },
      include: { customer: true, assignedAgent: true },
    });

    // If terminal state (DELIVERED/FAILED), update agent status back to AVAILABLE
    if ((status === 'DELIVERED' || status === 'FAILED') && updatedOrder.assignedAgentId) {
      await prisma.agent.update({
        where: { id: updatedOrder.assignedAgentId },
        data: { status: 'AVAILABLE' },
      });
    }

    await sendNotification(id, updatedOrder.customer.email, status, remarks);

    return res.json(updatedOrder);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to update order status.' });
  }
}

export async function overrideOrderStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        currentStatus: status,
        statusHistory: {
          create: {
            status,
            actorUserId: req.user?.id,
            actorRole: 'ADMIN',
            remarks: `[ADMIN OVERRIDE] ${remarks || 'Privileged status override applied.'}`,
          },
        },
      },
      include: { customer: true },
    });

    await sendNotification(id, updatedOrder.customer.email, status, `[Admin Override] ${remarks || ''}`);

    return res.json(updatedOrder);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Admin override failed.' });
  }
}

export async function rescheduleOrder(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { newDate, reason } = req.body;

    if (!newDate) return res.status(400).json({ error: 'New delivery date is required.' });

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    // Insert Reschedule Request
    await prisma.rescheduleRequest.create({
      data: {
        orderId: id,
        previousDate: order.scheduledDate,
        newDate: new Date(newDate),
        reason,
        requestedById: req.user!.id,
      },
    });

    // Reset status to RESCHEDULED and clear assigned agent for re-assignment
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        scheduledDate: new Date(newDate),
        currentStatus: 'RESCHEDULED',
        assignedAgentId: null,
        statusHistory: {
          create: {
            status: 'RESCHEDULED',
            actorUserId: req.user!.id,
            actorRole: req.user!.role,
            remarks: `Rescheduled to ${newDate}. Reason: ${reason || 'Customer request'}`,
          },
        },
      },
      include: { customer: true },
    });

    await sendNotification(id, updatedOrder.customer.email, 'RESCHEDULED', `Delivery rescheduled to ${newDate}`);

    return res.json(updatedOrder);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Reschedule failed.' });
  }
}
