import { Plugin } from "@hapi/hapi";
import createAgenda from "../../agenda/agenda.instance";

const AgendaPlugin: Plugin<undefined> = {
  name: "AgendaPlugin",
  version: "1.0.0",

  register: async (server) => {
    console.log("🔄 Initializing Agenda...");
    const agenda = await createAgenda();
    
    // Start Agenda
    await agenda.start();
    console.log("🚀 Agenda started");

    // Register jobs
    // await unlockVoucherLocksJob(agenda);
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
