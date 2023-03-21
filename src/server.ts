import "reflect-metadata";
import * as dotenv from "dotenv";
import { container } from "./inversify.config";
import { App } from "./app";
import { LoggerService, getNetworkConfig } from "./services";
import { connect } from "mongoose";
import { verifyTransaction } from "./services/taskVerifiers/transactionTaskVerification";
import { getSigner } from "./tools/ethers";
import AutSDK from "@aut-labs-private/sdk";
// initialize configuration
dotenv.config();

const PORT = process.env.SERVER_PORT || 3000;
const application = container.get<App>(App);
const logger = container.get<LoggerService>(LoggerService);

application.app.listen(PORT, async () => {
  try {
    try {
      // await connect(process.env.MONGODB_CONNECTION_STRING, {
      //   keepAlive: true,
      //   keepAliveInitialDelay: 300000,
      // });

      const networkConfig = getNetworkConfig('mumbai', undefined);

     
      const signer = getSigner(networkConfig);

      const sdk = AutSDK.getInstance();
      await sdk.init(signer as any, networkConfig.contracts);
      
      await verifyTransaction(
        '0xd34a0124b246E1dF8A2068112C15244c240b7fC9', 
        '0xcFe8a416eDDd29e53B408223c887D765dc071502', 
        2, 
        '0x704f52eA3C4d8095e348027FdC0a4cFdc19D0008', 
        'mumbai');
    } catch (error) {
      console.log(error, "error");
      // handleError(error);
    }
  } catch (error) {
    console.error("Could not connect to mongoose!");
  }
  logger.info("Aut API is listening on port " + PORT);
});
