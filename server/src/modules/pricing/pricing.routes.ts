import { Router } from 'express';
import { authenticate, requireStaff } from '../../middleware/auth';
import * as c from './pricing.controller';

export const pricingRoutes = Router();

// Public quote & master data
pricingRoutes.get('/quote', c.getQuote);
pricingRoutes.get('/pricelist', c.getPricelist);
pricingRoutes.get('/destinations', c.listDestinations);
pricingRoutes.get('/additional-fees', c.listAdditionalFees);

// Admin destinations
pricingRoutes.get('/admin/destinations', authenticate, requireStaff, c.adminListDestinations);
pricingRoutes.post('/destinations', authenticate, requireStaff, c.createDestination);
pricingRoutes.patch('/destinations/:id', authenticate, requireStaff, c.updateDestination);
pricingRoutes.delete('/destinations/:id', authenticate, requireStaff, c.deleteDestination);

// Admin rate matrix
pricingRoutes.get('/matrix/:vehicleId', authenticate, requireStaff, c.getVehicleRateMatrix);
pricingRoutes.put('/matrix/:vehicleId', authenticate, requireStaff, c.updateVehicleRateMatrix);

// Admin fees
pricingRoutes.get('/admin/additional-fees', authenticate, requireStaff, c.adminListAdditionalFees);
pricingRoutes.post('/additional-fees', authenticate, requireStaff, c.createAdditionalFee);
pricingRoutes.patch('/additional-fees/:id', authenticate, requireStaff, c.updateAdditionalFee);
pricingRoutes.delete('/additional-fees/:id', authenticate, requireStaff, c.deleteAdditionalFee);

// Promotions
pricingRoutes.get('/promotions', authenticate, requireStaff, c.listPromotions);
pricingRoutes.post('/promotions', authenticate, requireStaff, c.createPromotion);
pricingRoutes.patch('/promotions/:id', authenticate, requireStaff, c.updatePromotion);

