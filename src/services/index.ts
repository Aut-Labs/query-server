export * from "./logger.service";
export * from "./autID.service";
import { NetworkConfigEnv, NetworkConfig } from "../models/config";
import { GoerliNetwork, MumbaiNetwork } from "./networks";

export function getNetworkConfig(
  network: string,
  networkConfigEnv = NetworkConfigEnv.Testing
): NetworkConfig {
  if (networkConfigEnv === NetworkConfigEnv.Testing) {
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
  networkConfigEnv = NetworkConfigEnv.Testing
): NetworkConfig[] {
  if (networkConfigEnv === NetworkConfigEnv.Testing) {
    return [GoerliNetwork(), MumbaiNetwork()];
  }
  return [];
}
