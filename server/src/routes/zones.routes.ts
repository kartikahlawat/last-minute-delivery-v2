import { Router } from 'express';
import {
  getZones,
  createZone,
  addZoneArea,
  getRateCards,
  createRateCard,
  updateRateCard,
  getCodConfigs,
  updateCodConfig,
} from '../controllers/zone.controller';
import { authGuard, roleGuard } from '../middleware/authGuard';

const router = Router();

// Zones & Areas
router.get('/zones', getZones);
router.post('/zones', authGuard, roleGuard(['ADMIN']), createZone);
router.post('/zones/:id/areas', authGuard, roleGuard(['ADMIN']), addZoneArea);

// Rate Cards
router.get('/rate-cards', getRateCards);
router.post('/rate-cards', authGuard, roleGuard(['ADMIN']), createRateCard);
router.put('/rate-cards/:id', authGuard, roleGuard(['ADMIN']), updateRateCard);

// COD Surcharge
router.get('/cod-surcharge', getCodConfigs);
router.put('/cod-surcharge/:orderType', authGuard, roleGuard(['ADMIN']), updateCodConfig);

export default router;
