import { Response } from 'express';
import { prisma } from '../config/db';
import { AuthenticatedRequest } from '../middleware/authGuard';

export async function getAgents(req: AuthenticatedRequest, res: Response) {
  try {
    const agents = await prisma.agent.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        currentZone: true,
        assignedOrders: {
          where: {
            currentStatus: {
              notIn: ['DELIVERED', 'FAILED'],
            },
          },
        },
      },
    });

    const formatted = agents.map((agent) => ({
      id: agent.id,
      userId: agent.userId,
      name: agent.user.name,
      email: agent.user.email,
      phone: agent.user.phone,
      status: agent.status, // AVAILABLE, BUSY, OFFLINE
      currentZoneId: agent.currentZoneId,
      currentZoneName: agent.currentZone?.name || null,
      currentLat: agent.currentLat,
      currentLng: agent.currentLng,
      vehicleType: agent.vehicleType,
      activeOrdersCount: agent.assignedOrders.length,
    }));

    return res.json(formatted);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch agents.' });
  }
}

export async function getAgentById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const agent = await prisma.agent.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        currentZone: true,
        assignedOrders: true,
      },
    });

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found.' });
    }

    return res.json(agent);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch agent.' });
  }
}

export async function updateAgentStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status, currentZoneId, currentLat, currentLng } = req.body;

    // Verify ownership if requested by AGENT
    if (req.user?.role === 'AGENT') {
      const agentProfile = await prisma.agent.findUnique({ where: { userId: req.user.id } });
      if (!agentProfile || agentProfile.id !== id) {
        return res.status(403).json({ error: 'Forbidden. You can only update your own status.' });
      }
    }

    const updated = await prisma.agent.update({
      where: { id },
      data: {
        status: status || undefined, // AVAILABLE, BUSY, OFFLINE
        currentZoneId: currentZoneId !== undefined ? currentZoneId : undefined,
        currentLat: currentLat != null ? Number(currentLat) : undefined,
        currentLng: currentLng != null ? Number(currentLng) : undefined,
      },
    });

    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to update agent status.' });
  }
}
