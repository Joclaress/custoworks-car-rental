import { Router } from 'express';
import { authenticate, requireStaff } from '../../middleware/auth';
import { uploadImage } from '../../middleware/upload';
import * as c from './vehicles.controller';

export const vehicleRoutes = Router();

// Public routes
vehicleRoutes.get('/', c.listVehicles);
vehicleRoutes.get('/slug/:slug', c.getVehicleBySlug);

// Staff / Admin routes
vehicleRoutes.get('/admin', authenticate, requireStaff, c.adminListVehicles);
vehicleRoutes.post('/', authenticate, requireStaff, c.createVehicle);
vehicleRoutes.patch('/:id', authenticate, requireStaff, c.updateVehicle);
vehicleRoutes.delete('/:id', authenticate, requireStaff, c.deleteVehicle);

vehicleRoutes.post('/:id/images', authenticate, requireStaff, uploadImage, c.uploadVehiclePhoto);
vehicleRoutes.delete('/:id/images/:imageId', authenticate, requireStaff, c.deleteVehiclePhoto);
vehicleRoutes.post('/:id/images/:imageId/primary', authenticate, requireStaff, c.setPrimaryPhoto);

