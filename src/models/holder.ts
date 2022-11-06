export interface Holder {
  tokenId: string;
  metadataUri: string;
  network: string;
  chainId: number;
}

export interface DAOMember {
  daoExpanderAddress: string;
  role: string;
  commitment: string;
  isActive: boolean;
}

export interface DAOData {
  contractType: string;
  daoAddress: string;
  discordServer: string;
}
