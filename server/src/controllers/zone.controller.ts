import { Request, Response } from 'express';
import { prisma } from '../config/db';

export async function getZones(req: Request, res: Response) {
  try {
    const zones = await prisma.zone.findMany({
      include: { areas: true },
    });
    return res.json(zones);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch zones.' });
  }
}

export async function createZone(req: Request, res: Response) {
  try {
    const { name, code } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: 'Zone name and code are required.' });
    }

    const zone = await prisma.zone.create({
      data: { name, code: code.toUpperCase() },
    });
    return res.status(201).json(zone);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to create zone.' });
  }
}

export async function addZoneArea(req: Request, res: Response) {
  try {
    const { id: zoneId } = req.params;
    const { pincode, areaName } = req.body;

    if (!pincode || !areaName) {
      return res.status(400).json({ error: 'Pincode and areaName are required.' });
    }

    const area = await prisma.zoneArea.create({
      data: {
        zoneId,
        pincode,
        areaName,
      },
    });

    return res.status(201).json(area);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to add zone area.' });
  }
}

export async function getRateCards(req: Request, res: Response) {
  try {
    const rateCards = await prisma.rateCard.findMany({
      orderBy: { effectiveFrom: 'desc' },
    });
    return res.json(rateCards);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch rate cards.' });
  }
}

export async function createRateCard(req: Request, res: Response) {
  try {
    const { orderType, relation, ratePerKg, baseCharge, minCharge, isActive } = req.body;

    const rateCard = await prisma.rateCard.create({
      data: {
        orderType,
        relation,
        ratePerKg: Number(ratePerKg),
        baseCharge: Number(baseCharge),
        minCharge: Number(minCharge || 0),
        isActive: isActive ?? true,
      },
    });

    return res.status(201).json(rateCard);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to create rate card.' });
  }
}

export async function updateRateCard(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { ratePerKg, baseCharge, minCharge, isActive } = req.body;

    const updated = await prisma.rateCard.update({
      where: { id },
      data: {
        ratePerKg: ratePerKg != null ? Number(ratePerKg) : undefined,
        baseCharge: baseCharge != null ? Number(baseCharge) : undefined,
        minCharge: minCharge != null ? Number(minCharge) : undefined,
        isActive: isActive != null ? Boolean(isActive) : undefined,
      },
    });

    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to update rate card.' });
  }
}

export async function getCodConfigs(req: Request, res: Response) {
  try {
    const configs = await prisma.codSurchargeConfig.findMany();
    return res.json(configs);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch COD surcharge configs.' });
  }
}

export async function updateCodConfig(req: Request, res: Response) {
  try {
    const { orderType } = req.params;
    const { surchargeType, value, isActive } = req.body;

    const existing = await prisma.codSurchargeConfig.findFirst({
      where: { orderType },
    });

    let result;
    if (existing) {
      result = await prisma.codSurchargeConfig.update({
        where: { id: existing.id },
        data: {
          surchargeType: surchargeType || existing.surchargeType,
          value: value != null ? Number(value) : existing.value,
          isActive: isActive != null ? Boolean(isActive) : existing.isActive,
        },
      });
    } else {
      result = await prisma.codSurchargeConfig.create({
        data: {
          orderType,
          surchargeType: surchargeType || 'FLAT',
          value: Number(value || 0),
          isActive: isActive ?? true,
        },
      });
    }

    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to update COD surcharge config.' });
  }
}
