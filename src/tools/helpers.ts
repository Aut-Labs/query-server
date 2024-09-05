export * from "./logger.service";
import axios from "axios";
import { NetworkConfigEnv, NetworkConfig } from "../models/config";
import { AmoyNetwork, PolygonNetwork } from "./networks";
// import { TwitterVerificationModel } from "../models/tweetVerif";

export function getNetworkConfig(networkConfigEnv: NetworkConfigEnv): NetworkConfig {
  if (!networkConfigEnv || (networkConfigEnv !== NetworkConfigEnv.Testnet && networkConfigEnv !== NetworkConfigEnv.Mainnet)) {
    networkConfigEnv = NetworkConfigEnv.Testnet;
  }
  if (networkConfigEnv === NetworkConfigEnv.Testnet) {
    return AmoyNetwork();
  }
  return PolygonNetwork();
}

export function getNetworksConfig(
  networkConfigEnv: NetworkConfigEnv
): NetworkConfig[] {
  if (!networkConfigEnv || (networkConfigEnv !== NetworkConfigEnv.Testnet && networkConfigEnv !== NetworkConfigEnv.Mainnet)) {
    networkConfigEnv = NetworkConfigEnv.Testnet;
  }
  if (networkConfigEnv === NetworkConfigEnv.Testnet) {
    return [AmoyNetwork()];
  }
  return [PolygonNetwork()];
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
