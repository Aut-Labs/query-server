const { Agenda } = require("@hokify/agenda");
const { defineJobs } = require("./job.definitions");

const agenda = new Agenda({
  db: { address: process.env.MONGODB_AGENDA_CONNECTION_STRING },
});

agenda
  .on("ready", () => console.log("Agenda started!"))
  .on("error", () => console.log("Agenda connection error!"));

defineJobs(agenda);

(async function () {
  // IIFE to give access to async/await
  await agenda.start();

  // await agenda.schedule("in 5 seconds", "finalizeTask", {
  //   id: "6501e2d11b40017d7a78b9d1",
  // });
  // await agenda.schedule("in 1 minutes", "listen", {
  //   to: "admin@example.com",
  // });
})();
