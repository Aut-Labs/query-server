import { Agenda } from "@hokify/agenda";
import { Client } from "discord.js";

export class AgendaManager {
  private discordClient: Client;
  agenda: Agenda;
  constructor(discordClient) {
    this.discordClient = discordClient;
    this.agenda = new Agenda({
      db: { address: `${process.env.MONGODB_CONNECTION_STRING}/agenda` },
    });

    this.initializeJobs();
    this.startAgenda();
  }

  initializeJobs() {
    this.agenda.define("finalizeGathering", async (job) => {
      console.log("job date", job.attrs.lockedAt);
      console.log(job.attrs.data.id);
      await finalizeGathering(job.attrs.data.id);
    });

    this.agenda.define("initializeGathering", async (job) => {
      console.log("job date", job.attrs.lockedAt);
      console.log(job.attrs.data.id);
      await initializeGathering(job.attrs.data.id);
    });

    this.agenda.define("finalizePoll", async (job) => {
      console.log("job date", job.attrs.lockedAt);
      console.log(job.attrs.data.id);
      await finalizePoll(job.attrs.data.id);
    });
  }

  async startAgenda() {
    try {
      console.log("Trying to start agenda");
      await this.agenda.start();
      console.log("Agenda started successfully");
    } catch (error) {
      console.error("Failed to start Agenda:", error);
    }
  }

  // Method to schedule a job
  async scheduleJob(jobName, data, when) {
    try {
      await this.agenda.schedule(when, jobName, data);
      console.log(`Job '${jobName}' scheduled successfully`);
    } catch (error) {
      console.error(`Failed to schedule job '${jobName}':`, error);
    }
  }
}

// Helper functions (you'll need to implement these based on your requirements)
async function finalizeGathering(id) {
  // Implementation of finalizeGathering
}

async function initializeGathering(id) {
  // Implementation of initializeGathering
}

async function finalizePoll(id) {
  // Implementation of finalizePoll
}
