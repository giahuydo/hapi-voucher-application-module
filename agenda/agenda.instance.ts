import { Agenda } from 'agenda';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const createAgenda = async (): Promise<Agenda> => {
  // Ensure mongoose is connected
  if (mongoose.connection.readyState !== 1) {
    console.log('⏳ Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log('✅ MongoDB connected for Agenda');
  }

  // Create agenda instance
  const agenda = new Agenda({
    mongo: mongoose.connection.db as any,
    processEvery: '5 seconds',
    defaultConcurrency: 1,
    maxConcurrency: 5,
    lockLimit: 0,
  });

  // Event hooks
  agenda.on('start', (job) => {
    console.log(`🔄 Job "${job.attrs.name}" started`);
  });

  agenda.on('complete', (job) => {
    console.log(`✅ Job "${job.attrs.name}" completed`);
  });

  agenda.on('fail', (error, job) => {
    console.error(`❌ Job "${job.attrs.name}" failed:`, error);
  });

  return agenda;
};

export default createAgenda;