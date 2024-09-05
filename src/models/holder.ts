export interface Holder {
  tokenId: string;
  metadataUri: string;
  network: string;
  chainId: number;
}

export interface DAOMember {
  hubAddress: string;
  role: string;
  commitment: string;
  isActive: boolean;
}

export interface DAOData {
  contractType: string;
  hubAddress: string;
  discordServer: string;
}
