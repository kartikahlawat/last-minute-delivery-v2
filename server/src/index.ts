import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import zoneRoutes from './routes/zones.routes';
import agentRoutes from './routes/agents.routes';
import orderRoutes from './routes/orders.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Last-Mile Delivery Tracker API',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', zoneRoutes);
app.use('/api', agentRoutes);
app.use('/api', orderRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// Start Server
if (process.env.NODE_ENV !== 'test') {
  const startServer = (portToUse: number) => {
    const server = app.listen(portToUse, () => {
      console.log(`🚀 Last-Mile Tracker Server running on port ${portToUse}`);
      console.log(`📡 Healthcheck: http://localhost:${portToUse}/api/health`);
    });

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`⚠️ Port ${portToUse} is in use. Retrying on port ${portToUse + 1}...`);
        startServer(portToUse + 1);
      } else {
        console.error('Server error:', err);
      }
    });
  };

  startServer(Number(PORT));
}

export default app;
