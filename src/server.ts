import "reflect-metadata";
import * as dotenv from "dotenv";
import { container } from "./inversify.config";
import { App } from "./app";
import { LoggerService, getNetworkConfig } from "./services";
import { connect } from "mongoose";
import { getSigner } from "./tools/ethers";
import AutSDK from "@aut-labs/sdk";
import { MultiSigner } from "@aut-labs/sdk/dist/models/models";
// initialize configuration
dotenv.config();

const PORT = process.env.SERVER_PORT || 3000;
const application = container.get<App>(App);
const logger = container.get<LoggerService>(LoggerService);

application.app.listen(PORT, async () => {
  try {
    try {
      const db = await connect(process.env.MONGODB_CONNECTION_STRING, {
        keepAlive: true,
        keepAliveInitialDelay: 300000,
      });

      // await db.connection.db.dropDatabase();

      const networkConfig = getNetworkConfig("mumbai", undefined);

      const signer = getSigner(networkConfig);
      const multiSigner: MultiSigner = {
        readOnlySigner: signer,
        signer 
      }

      const sdk = AutSDK.getInstance();
      await sdk.init(multiSigner, networkConfig.contracts);
    } catch (error) {
      console.log(error, "error");
      // handleError(error);
    }
  } catch (error) {
    console.error("Could not connect to mongoose!");
  }
  logger.info("Aut API is listening on port " + PORT);
});
