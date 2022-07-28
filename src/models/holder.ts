
export interface CommunityMembershipDetails {
  communityExtension: string;
  holderRole: string;
  holderCommitment: string;
  holderIsActive: boolean;

  contractType: string;
  daoAddress: string;
  metadata: string;
  market: boolean;
  discordServer: string;
}


export interface HolderData {
  tokenId: string;
  username: string;
  address: string;
  metadataUri: string;
  communities: CommunityMembershipDetails[];
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
  metadata: string;
  market: boolean;
  discordServer: string;
}