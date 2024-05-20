import { NetworkConfig } from "../models/config";

export const AmoyNetwork = (): NetworkConfig => ({
  name: "Amoy (Polygon)",
  chainId: 80002,
  network: "Amoy",
  disabled: process.env.AMOY_DISABLED == "true",
  explorerUrls: process.env.AMOY_BLOCK_EXPLORER_URLS.split("|"),
  rpcUrls: process.env.AMOY_RPC_URLS.split("|"),
  biconomyApiKey: process.env.AMOY_BICONOMY_API_KEY,
  ipfsGatewayUrl: process.env.IPFS_GATEWAY,
  contracts: {
    autIDAddress: process.env.AMOY_AUT_ID_ADDRESS,
    daoExpanderRegistryAddress: process.env.AMOY_DAO_REGISTRY_ADDRESS,
    daoExpanderFactoryAddress: process.env.AMOY_DAO_FACTORY_ADDRESS,
    novaRegistryAddress: process.env.AMOY_AUT_NOVA_REGISTRY_ADDRESS,
    novaFactoryAddress: process.env.AMOY_AUT_DAO_FACTORY_ADDRESS,
    hackerDaoAddress: process.env.AMOY_HACKERS_DAO_ADDRESS,
    daoTypesAddress: process.env.AMOY_DAO_TYPES_ADDRESS,
    localReputationAddress: process.env.AMOY_LOCAL_REPUTATION_ADDRESS,
    allowListAddress: process.env.AMOY_ALLOW_LIST_ADDRESS,
    offchainVerifierAddress: process.env.AMOY_OFFCHAIN_VERIFIER_ADDRESS,
    pluginRegistryAddress: process.env.AMOY_PLUGIN_REGISTRY_ADDRESS,
    moduleRegistryAddress: process.env.AMOY_MODULE_REGISTRY_ADDRESS,
    questOffchainTaskFactory:
      process.env.AMOY_QUEST_OFFCHAIN_TASK_FACTORY_ADDRESS,
    questOpenTaskFactory: process.env.AMOY_QUEST_OPEN_TASK_FACTORY_ADDRESS,
    basicOnboardingAddress: process.env.AMOY_BASIC_ONBOARDING_ADDRESS,
    onboardingRole1Address: process.env.AMOY_ONBOARDING_ROLE1_ADDRESS,
    onboardingRole2Address: process.env.AMOY_ONBOARDING_ROLE2_ADDRESS,
    onboardingRole3Address: process.env.AMOY_ONBOARDING_ROLE3_ADDRESS,
  },
});


export const PolygonNetwork = (): NetworkConfig => ({
  name: "Polygon",
  chainId: 137,
  network: "Polygon",
  disabled: process.env.POLYGON_DISABLED == "true",
  explorerUrls: process.env.POLYGON_BLOCK_EXPLORER_URLS.split("|"),
  rpcUrls: process.env.POLYGON_RPC_URLS.split("|"),
  biconomyApiKey: process.env.POLYGON_BICONOMY_API_KEY,
  ipfsGatewayUrl: process.env.IPFS_GATEWAY,
  contracts: {
    autIDAddress: process.env.POLYGON_AUT_ID_ADDRESS,
    daoExpanderRegistryAddress: process.env.POLYGON_DAO_REGISTRY_ADDRESS,
    daoExpanderFactoryAddress: process.env.POLYGON_DAO_FACTORY_ADDRESS,
    novaRegistryAddress: process.env.POLYGON_AUT_NOVA_REGISTRY_ADDRESS,
    novaFactoryAddress: process.env.POLYGON_AUT_DAO_FACTORY_ADDRESS,
    hackerDaoAddress: process.env.POLYGON_HACKERS_DAO_ADDRESS,
    daoTypesAddress: process.env.POLYGON_DAO_TYPES_ADDRESS,
    localReputationAddress: process.env.POLYGON_LOCAL_REPUTATION_ADDRESS,
    allowListAddress: process.env.POLYGON_ALLOW_LIST_ADDRESS,
    offchainVerifierAddress: process.env.POLYGON_OFFCHAIN_VERIFIER_ADDRESS,
    pluginRegistryAddress: process.env.POLYGON_PLUGIN_REGISTRY_ADDRESS,
    moduleRegistryAddress: process.env.POLYGON_MODULE_REGISTRY_ADDRESS,
    questOffchainTaskFactory:
      process.env.POLYGON_QUEST_OFFCHAIN_TASK_FACTORY_ADDRESS,
    questOpenTaskFactory: process.env.POLYGON_QUEST_OPEN_TASK_FACTORY_ADDRESS,
    basicOnboardingAddress: process.env.POLYGON_BASIC_ONBOARDING_ADDRESS,
    onboardingRole1Address: process.env.POLYGON_ONBOARDING_ROLE1_ADDRESS,
    onboardingRole2Address: process.env.POLYGON_ONBOARDING_ROLE2_ADDRESS,
    onboardingRole3Address: process.env.POLYGON_ONBOARDING_ROLE3_ADDRESS,
  },
});