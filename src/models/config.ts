export enum NetworkConfigEnv {
  Testnet = "testing", // rename in the future to testnet
  Mainnet = "mainnet",
}

export interface NetworkContracts {
  autIDAddress: string;
  daoExpanderRegistryAddress: string;
  daoExpanderFactoryAddress: string;
  autDaoRegistryAddress: string;
  autDaoFactoryAddress: string;
  hackerDaoAddress: string;
  daoTypesAddress: string;
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
}