import { Agenda } from "agenda";
import mongoose from "mongoose";
import config from "../src/config";

const createAgenda = async (): Promise<Agenda> => {
  // Ensure mongoose is connected
  if (mongoose.connection.readyState !== 1) {
    console.log("⏳ Connecting to MongoDB...");
    await mongoose.connect(config.database.mongo.uri);
    console.log("✅ MongoDB connected for Agenda");
  }

  // Create Agenda instance
  const agenda = new Agenda({
    db: {
      address: config.database.mongo.uri,
      collection: "agendaJobs",
    },
    processEvery: "10 seconds",
    defaultConcurrency: 1,
    maxConcurrency: 5,
  });
  // Event hooks
  agenda.on("start", (job) => {
    console.log(`🔄 Job "${job.attrs.name}" started`);
  });

  agenda.on("complete", (job) => {
    console.log(`✅ Job "${job.attrs.name}" completed`);
  });

  agenda.on("fail", (error, job) => {
    console.error(`❌ Job "${job.attrs.name}" failed:`, error);
  });

  return agenda;
};

export default createAgenda;
