export const supportedNetworks = [
    'btc-mainnet',
    'eth-mainnet',
    'eth-goerli',
    'matic-mainnet',
    'matic-mumbai',
    'bsc-mainnet',
    'bsc-testnet',
    'avalanche-mainnet',
    'avalanche-testnet',
    'fantom-mainnet',
    'fantom-testnet',
    'aurora-mainnet',
    'aurora-testnet',
    'harmony-mainnet',
    'harmony-testnet',
    'solana-mainnet'
]

export const supportFunction = (networkName: string): boolean => {
    return supportedNetworks.find(x => x == networkName.toLocaleLowerCase()) != undefined;
}