export enum NetworkConfigEnv {
  Testnet = "testnet",
  Mainnet = "mainnet",
  Testing = "testing" // temporary, remove later
}

export interface NetworkContracts {
  autIDAddress: string;
  domainHubAddress: string;
  daoExpanderRegistryAddress: string;
  daoExpanderFactoryAddress: string;
  hubRegistryAddress: string;
  taskRegistryAddress: string;
  interactionFactoryAddress: string;
  trustedForwarderAddress: string;
  novaRegistryAddress: string;
  novaFactoryAddress: string;
  hackerDaoAddress: string;
  allowListAddress: string;
  offchainVerifierAddress: string;
  daoTypesAddress: string;
  localReputationAddress: string;
  pluginRegistryAddress: string;
  moduleRegistryAddress: string;
  questOpenTaskFactory: string;
  questOffchainTaskFactory: string;
  basicOnboardingAddress: string;
  onboardingRole1Address: string;
  onboardingRole2Address: string;
  onboardingRole3Address: string;
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