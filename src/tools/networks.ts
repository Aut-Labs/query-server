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
    domainHubAddress: process.env.AMOY_DOMAIN_HUB_ADDRESS,
    hubRegistryAddress: process.env.AMOY_AUT_HUB_REGISTRY_ADDRESS,
    taskRegistryAddress: process.env.AMOY_HUB_TASK_REGISTRY_ADDRESS,
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
    domainHubAddress: process.env.POLYGON_DOMAIN_HUB_ADDRESS,
    hubRegistryAddress: process.env.POLYGON_AUT_HUB_REGISTRY_ADDRESS,
    taskRegistryAddress: process.env.POLYGON_HUB_TASK_REGISTRY_ADDRESS,
  },
});