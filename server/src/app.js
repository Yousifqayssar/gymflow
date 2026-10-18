import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import planRoutes from './routes/plan.routes.js';
import meRoutes from './routes/me.routes.js';
import classRoutes from './routes/class.routes.js';
import checkInRoutes from './routes/checkIn.routes.js';
import gymRoutes from './routes/gym.routes.js';
import accountRoutes from './routes/account.routes.js';
import memberRoutes from './routes/member.routes.js';
import partnerGymRoutes from './routes/partnerGym.routes.js';
import nutritionRoutes from './routes/nutrition.routes.js';
import exerciseRoutes from './routes/exercise.routes.js';
import workoutPlanRoutes from './routes/workoutPlan.routes.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

// Builds the Express app without starting it.
// Keeping this separate from server.js lets tests import the app directly.
export const app = express();

// 1. Global middleware
app.use(cors({ origin: env.CLIENT_ORIGIN }));
// Meal photos are bigger than normal requests: allow up to 4 MB only on this route.
// (It runs first; the general parser below then sees the body is already read and skips it.)
app.use('/api/nutrition', express.json({ limit: '4mb' }));
app.use(express.json());

// 2. Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/me', meRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/check-ins', checkInRoutes);
app.use('/api/gym', gymRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/partner-gyms', partnerGymRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/workout-plans', workoutPlanRoutes);

// 3. Fallbacks (must come after all routes)
app.use(notFound);
app.use(errorHandler);
