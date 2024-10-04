import AutSDK, { MultiSigner } from "@aut-labs/sdk";
import { NetworkConfig, NetworkConfigEnv } from "../models/config";
import { LoggerService } from "../tools/logger.service";
import { injectable } from "inversify";
import { ethers, getSigner } from "./ethers";
import { getNetworkConfig } from "./helpers";
import { verifyMessage, Wallet } from "ethers";
import { AuthSig } from "../models/auth-sig";
import { SiweMessage } from "siwe";

@injectable()
export class SdkContainerService {
  public sdk: AutSDK;
  public signer: ethers.Signer;
  public network: NetworkConfig;

  constructor(private loggerService: LoggerService) {
    this._initSdk();
  }

  private async _initSdk() {
    try {
      this.sdk = new AutSDK({
        ipfs: {
          apiKey: process.env.IPFS_API_KEY as string,
          secretApiKey: process.env.IPFS_API_SECRET as string,
          gatewayUrl: process.env.IPFS_GATEWAY_URL as string,
        },
      });
      const networkEnv = process.env.NETWORK_ENV as NetworkConfigEnv;
      this.network = getNetworkConfig(networkEnv);
      this.signer = await getSigner(this.network);
      const multiSigner: MultiSigner = {
        readOnlySigner: this.signer,
        signer: this.signer,
      };
      await this.sdk.init(multiSigner, this.network.contracts);
    } catch (error) {
      this.loggerService.error(`Failed to initialize SDK: ${error}`);
      throw error;
    }
  }

  public get privateKey() {
    return (this.signer as Wallet).privateKey;
  }

  public async veryifySignature(autSig: AuthSig): Promise<string> {
    if (!autSig) {
      throw new Error("autSig is required");
    }

    const { sig, signedMessage, address } = autSig;
    const recoveredAddress = verifyMessage(signedMessage, sig).toLowerCase();

    if (recoveredAddress !== address.toLowerCase()) {
      throw new Error("Unauthorized: Invalid signature, address mismatch");
    }

    const siweMessage: SiweMessage = new SiweMessage(signedMessage);

    const response = await siweMessage.verify(
      {
        signature: sig,
        time: new Date().toISOString(),
      },
      {
        provider: this.signer.provider,
      }
    );

    if (!response.success) {
      this.loggerService.error(response.error);
      throw new Error("Unauthorized: Invalid signature");
    }

    return recoveredAddress;
  }
}
