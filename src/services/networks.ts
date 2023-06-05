import { NetworkConfig } from "../models/config";

export const GoerliNetwork = (): NetworkConfig => ({
  name: "Görli (Ethereum)",
  chainId: 5,
  network: "Goerli",
  disabled: process.env.GOERLI_DISABLED == "true",
  explorerUrls: process.env.GOERLI_BLOCK_EXPLORER_URLS.split("|"),
  rpcUrls: process.env.GOERLI_RPC_URLS.split("|"),
  biconomyApiKey: process.env.GOERLI_BICONOMY_API_KEY,
  ipfsGatewayUrl: process.env.IPFS_GATEWAY,
  contracts: {
    autIDAddress: process.env.GOERLI_AUT_ID_ADDRESS,
    daoExpanderRegistryAddress: process.env.GOERLI_DAO_REGISTRY_ADDRESS,
    daoExpanderFactoryAddress: process.env.GOERLI_DAO_FACTORY_ADDRESS,
    novaRegistryAddress: process.env.GOERLI_AUT_DAO_REGISTRY_ADDRESS,
    novaFactoryAddress: process.env.GOERLI_AUT_DAO_FACTORY_ADDRESS,
    hackerDaoAddress: process.env.GOERLI_HACKERS_DAO_ADDRESS,
    daoTypesAddress: process.env.GOERLI_DAO_TYPES_ADDRESS,
    pluginRegistryAddress: process.env.GOERLI_PLUGIN_REGISTRY_ADDRESS,
    moduleRegistryAddress: process.env.GOERLI_MODULE_REGISTRY_ADDRESS,
    questOffchainTaskFactory:
      process.env.GOERLI_QUEST_OFFCHAIN_TASK_FACTORY_ADDRESS,
    questOpenTaskFactory: process.env.GOERLI_QUEST_OPEN_TASK_FACTORY_ADDRESS,
  },
});

export const MumbaiNetwork = (): NetworkConfig => ({
  name: "Mumbai (Polygon)",
  chainId: 80001,
  network: "Mumbai",
  disabled: process.env.MUMBAI_DISABLED == "true",
  explorerUrls: process.env.MUMBAI_BLOCK_EXPLORER_URLS.split("|"),
  rpcUrls: process.env.MUMBAI_RPC_URLS.split("|"),
  biconomyApiKey: process.env.MUMBAI_BICONOMY_API_KEY,
  ipfsGatewayUrl: process.env.IPFS_GATEWAY,
  contracts: {
    autIDAddress: process.env.MUMBAI_AUT_ID_ADDRESS,
    daoExpanderRegistryAddress: process.env.MUMBAI_DAO_REGISTRY_ADDRESS,
    daoExpanderFactoryAddress: process.env.MUMBAI_DAO_FACTORY_ADDRESS,
    novaRegistryAddress: process.env.MUMBAI_AUT_DAO_REGISTRY_ADDRESS,
    novaFactoryAddress: process.env.MUMBAI_AUT_DAO_FACTORY_ADDRESS,
    hackerDaoAddress: process.env.MUMBAI_HACKERS_DAO_ADDRESS,
    daoTypesAddress: process.env.MUMBAI_DAO_TYPES_ADDRESS,
    pluginRegistryAddress: process.env.MUMBAI_PLUGIN_REGISTRY_ADDRESS,
    moduleRegistryAddress: process.env.MUMBAI_MODULE_REGISTRY_ADDRESS,
    questOffchainTaskFactory:
      process.env.MUMBAI_QUEST_OFFCHAIN_TASK_FACTORY_ADDRESS,
    questOpenTaskFactory: process.env.MUMBAI_QUEST_OPEN_TASK_FACTORY_ADDRESS,
  },
});
