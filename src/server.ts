import "reflect-metadata";
import { container } from "./inversify.config";
import { App } from "./app";
import { LoggerService } from "./tools/helpers";
import { connect } from "mongoose";
require('dotenv').config();

const PORT = process.env.SERVER_PORT || 3000;
const application = container.get<App>(App);
const logger = container.get<LoggerService>(LoggerService);

application.app.listen(PORT, async () => {
  try {
    try {
      await connect(process.env.MONGODB_CONNECTION_STRING);
      console.log("Connected to mongoose!");
    } catch (error) {
      console.log(error, "error");
    }
  } catch (error) {
    console.error("Could not connect to mongoose!");
  }
  logger.info("Aut API is listening on port " + PORT);
});
