import { Plugin } from "@hapi/hapi";
import { Agenda } from "agenda";
import mongoose from "mongoose";
import unlockVoucherLocksJob from "../../agenda/jobs/unlockVoucherLocks.job";

const AgendaPlugin: Plugin<undefined> = {
  name: "AgendaPlugin",
  version: "1.0.0",

  register: async (server) => {
    console.log("🔄 Initializing Agenda...");

    // Connect mongoose if not already connected
    if (mongoose.connection.readyState !== 1) {
      console.log("⏳ Connecting to MongoDB...");
      await mongoose.connect(process.env.MONGO_URI as string);
      console.log("✅ MongoDB connected for Agenda");
    }

    // Create Agenda instance
    const agenda = new Agenda({
      db: {
        address: process.env.MONGO_URI as string,
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
    agenda.on("fail", (err, job) => {
      console.error(`❌ Job "${job.attrs.name}" failed:`, err);
    });

    // Start Agenda
    await agenda.start();
    console.log("🚀 Agenda started");

    // Register jobs
    await unlockVoucherLocksJob(agenda);
    console.log("✅ Jobs registered:", Object.keys(agenda._definitions));

    // Store in server.app
    server.app.agenda = agenda;

    // Graceful shutdown
    server.events.on("stop", async () => {
      console.log("🛑 Stopping Agenda...");
      await agenda.stop();
      console.log("✅ Agenda stopped");
    });
  },
};

export default AgendaPlugin;
