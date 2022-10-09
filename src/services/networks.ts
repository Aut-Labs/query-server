import { NetworkConfig } from "../models/config";

export const GoerliNetwork = (): NetworkConfig => ({
  name: "Görli (Ethereum)",
  chainId: 5,
  network: "Goerli",
  explorerUrls: process.env.GOERLI_BLOCK_EXPLORER_URLS.split("|"),
  rpcUrls: process.env.GOERLI_RPC_URLS.split("|"),
  contracts: {
    autIDAddress: process.env.GOERLI_AUT_ID_ADDRESS,
    daoExpanderRegistryAddress: process.env.GOERLI_DAO_REGISTRY_ADDRESS,
    daoExpanderFactoryAddress: process.env.GOERLI_DAO_FACTORY_ADDRESS,
    hackerDaoAddress: process.env.GOERLI_HACKERS_DAO_ADDRESS,
    daoTypesAddress: process.env.GOERLI_DAO_TYPES_ADDRESS
  },
});

export const MumbaiNetwork = (): NetworkConfig => ({
  name: "Mumbai (Polygon)",
  chainId: 80001,
  network: "Mumbai",
  explorerUrls: process.env.MUMBAI_BLOCK_EXPLORER_URLS.split("|"),
  rpcUrls: process.env.MUMBAI_RPC_URLS.split("|"),
  contracts: {
    autIDAddress: process.env.MUMBAI_AUT_ID_ADDRESS,
    daoExpanderRegistryAddress: process.env.MUMBAI_DAO_REGISTRY_ADDRESS,
    daoExpanderFactoryAddress: process.env.MUMBAI_DAO_FACTORY_ADDRESS,
    hackerDaoAddress: process.env.MUMBAI_HACKERS_DAO_ADDRESS,
    daoTypesAddress: process.env.MUMBAI_DAO_TYPES_ADDRESS
  },
});
