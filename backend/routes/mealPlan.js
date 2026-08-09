import express from 'express';
const router = express.Router();
import * as mealPlanController from '../controllers/mealPlanController.js';
import authMiddleware from '../middleware/auth.js';

//All routes are protected
router.use(authMiddleware);

router.get('')