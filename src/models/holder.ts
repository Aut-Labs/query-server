export interface CommunityMembershipDetails {
  communityExtension: string;
  holderRole: string;
  holderCommitment: string;
  holderIsActive: boolean;

  contractType: string;
  daoAddress: string;
  metadata: string;
  market: string;
  discordServer: string;
}

export interface HolderData {
  tokenId: string;
  username: string;
  address: string;
  metadataUri: string;
  communities: CommunityMembershipDetails[];
}

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
