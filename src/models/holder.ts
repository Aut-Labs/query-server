export interface Holder {
  tokenId: string;
  metadataUri: string;
  network: string;
  chainId: number;
}

export interface DAOMember {
  daonovaAddress: string;
  role: string;
  commitment: string;
  isActive: boolean;
}

export interface DAOData {
  contractType: string;
  novaAddress: string;
  discordServer: string;
}
