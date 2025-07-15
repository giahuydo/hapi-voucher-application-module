import { Agenda } from 'agenda';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const agenda = new Agenda({
  mongo: mongoose.connection.db as any,
  processEvery: '1 minute',
  defaultConcurrency: 1,
  maxConcurrency: 1
});

export default agenda; 