import "reflect-metadata";
import * as dotenv from "dotenv";
import { container } from "./inversify.config";
import { App } from "./app";
import { LoggerService, getNetworkConfig } from "./services";
import { connect } from "mongoose";
import { getSigner } from "./tools/ethers";
import AutSDK from "@aut-labs/sdk";
import { MultiSigner } from "@aut-labs/sdk/dist/models/models";
import { NetworkConfigEnv } from "./models/config";
// initialize configuration
dotenv.config();

const PORT = process.env.SERVER_PORT || 3000;
const application = container.get<App>(App);
const logger = container.get<LoggerService>(LoggerService);

application.app.listen(PORT, async () => {
  try {
    try {
      // const db = await connect('mongodb://127.0.0.1:27017/points');
      // await db.connection.db.dropDatabase();
      const networkEnv: NetworkConfigEnv = process.env
        .NETWORK_ENV as NetworkConfigEnv;
      const networkConfig = getNetworkConfig(networkEnv);
      console.log("Network Environment:", networkEnv);

      const signer = await getSigner(networkConfig);
      const multiSigner: MultiSigner = {
        readOnlySigner: signer,
        signer,
      };

      const sdk = await AutSDK.getInstance(false);
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
