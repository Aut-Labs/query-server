export * from "./logger.service";
import axios from "axios";
import { NetworkConfigEnv, NetworkConfig } from "../models/config";
import { GoerliNetwork, MumbaiNetwork } from "./networks";
// import { TwitterVerificationModel } from "../models/tweetVerif";

export function getNetworkConfig(
  network: string,
  networkConfigEnv: NetworkConfigEnv.Testnet
): NetworkConfig {
  if (!networkConfigEnv) {
    networkConfigEnv = NetworkConfigEnv.Testnet;
  }
  if (networkConfigEnv === NetworkConfigEnv.Testnet) {
    switch (network) {
      case "mumbai":
        return MumbaiNetwork();
      case "goerli":
        return GoerliNetwork();
      default:
        return undefined;
    }
  }
  return undefined;
}

export function getNetworksConfig(
  networkConfigEnv: NetworkConfigEnv
): NetworkConfig[] {
  if (!networkConfigEnv) {
    networkConfigEnv = NetworkConfigEnv.Testnet;
  }
  if (networkConfigEnv === NetworkConfigEnv.Testnet) {
    return [GoerliNetwork(), MumbaiNetwork()];
  }
  return [];
}


async function getTweetByID(id: string): Promise<string> {

  const result = await axios.get(`${process.env.API_TWITTER_URL}/tweets/${id}`, {
    headers: {
      Authorization: `Bearer ${process.env.TWITTER_AUTH_TOKEN}`,
    }
  });
  return result.data.data.text;
}

export async function validateTweet(address: string, signature: string, tweetID: string): Promise<boolean> {
  const tweetText = await getTweetByID(tweetID);
  if (tweetText && tweetText.includes(signature)) {
    // TwitterVerificationModel.insertMany({ address, signature, tweetID });
    return true;
  } else return false;
}
