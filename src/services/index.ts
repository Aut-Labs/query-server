export * from "./logger.service";
export * from "./autID.service";
import { NetworkConfigEnv, NetworkConfig } from "../models/config";
import { GoerliNetwork, MumbaiNetwork } from "./networks";

export function getNetworkConfig(
  network: string,
  networkConfigEnv = NetworkConfigEnv.Testnet
): NetworkConfig {
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
  networkConfigEnv = NetworkConfigEnv.Testnet
): NetworkConfig[] {
  if (networkConfigEnv === NetworkConfigEnv.Testnet) {
    return [GoerliNetwork(), MumbaiNetwork()];
  }
  return [];
}
