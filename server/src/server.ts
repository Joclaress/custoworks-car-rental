import { app } from './app';
import { env } from './config/env';
import { startBackgroundJobs } from './cron';
import { prisma } from './lib/prisma';

async function bootstrap() {
  await prisma.$connect();
  console.log('📦 Connected to PostgreSQL Database');

  startBackgroundJobs();

  app.listen(env.PORT, () => {
    console.log(`🚀 Custoworks Car Rental API server listening on http://localhost:${env.PORT}`);
    console.log(`   Frontend client URL: ${env.CLIENT_URL}`);
  });
}

bootstrap().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

