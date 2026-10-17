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
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

// Builds the Express app without starting it.
// Keeping this separate from server.js lets tests import the app directly.
export const app = express();

// 1. Global middleware
app.use(cors({ origin: env.CLIENT_ORIGIN }));
app.use(express.json());

// 2. Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/me', meRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/check-ins', checkInRoutes);

// 3. Fallbacks (must come after all routes)
app.use(notFound);
app.use(errorHandler);
