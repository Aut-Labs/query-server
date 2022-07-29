
export * from "./logger.service";
export * from "./autID.service";
import { NetworkConfig } from '../models/config';

export function getConfiguration(network: string): NetworkConfig {
    switch (network) {
        case 'mumbai': return {
            network: 'mumbai',
            rpc: process.env.MUMBAI_RPC_PROVIDER,
            autIDAddress: process.env.MUMBAI_AUTID_CONTRACT_ADDRESS,
            daoExpanderRegistryAddress: process.env.MUMBAI_DAOEXPANDER_REGISTRY_ADDRESS
        }
        case 'goerli': return {
            network: 'goerli',
            rpc: process.env.GOERLI_RPC_PROVIDER,
            autIDAddress: process.env.GOERLI_AUTID_CONTRACT_ADDRESS,
            daoExpanderRegistryAddress: process.env.GOERLI_DAOEXPANDER_REGISTRY_ADDRESS
        }
        default: return undefined;
    }
}