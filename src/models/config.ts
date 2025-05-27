export enum NetworkConfigEnv {
  Testnet = "testnet",
  Mainnet = "mainnet",
  Testing = "testing" // temporary, remove later
}

export interface NetworkContracts {
  autIDAddress: string;
  domainHubAddress: string;
  hubRegistryAddress: string;
  taskRegistryAddress: string;
  interactionFactoryAddress: string;
  trustedForwarderAddress: string;
}

export interface NetworkConfig {
  network: string;
  name: string;
  chainId: string | number;
  rpcUrls: string[];
  explorerUrls: string[];
  contracts: NetworkContracts;
  biconomyApiKey: string;
  ipfsGatewayUrl: string;
  disabled: boolean,
}