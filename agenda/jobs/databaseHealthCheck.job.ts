import { Agenda, Job } from 'agenda';
import mongoose from 'mongoose';

export default async function databaseHealthCheckJob(agenda: Agenda): Promise<void> {
  agenda.define('database-health-check', async (job: Job) => {
    console.log('🏥 Running database health check...');
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    try {
      // Check if mongoose is connected
      if (mongoose.connection.readyState !== 1) {
        console.error('❌ Database connection is not healthy');
        console.log(`Connection state: ${mongoose.connection.readyState}`);

        console.log(`Connection status: ${states[mongoose.connection.readyState as keyof typeof states]}`);
        return;
      }
      
      console.log('✅ Database connection is healthy');

      // Optional: Run a simple query to verify connection is truly stable
      if (!mongoose.connection.db) {
        console.warn('⚠️ Database is not defined');
        return;
      }
      
      const result = await mongoose.connection.db.admin().ping();
      if (result.ok !== 1) {
        console.warn('⚠️ Database ping failed');
        return;
      }
      
      console.log('✅ Database ping successful');
    } catch (err) {
      console.error('❌ Error during database health check:', err);
    }

    console.log('✅ Database health check completed');
  });

  // Schedule the job to run every minute
  await agenda.every('1 minute', 'database-health-check');
  console.log('✅ Job "database-health-check" scheduled every 1 minute');
}
