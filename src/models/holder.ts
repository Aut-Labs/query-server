
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



export interface CommunityMemberData {
    communityExtension: string;
    role: string;
    commitment: string;
    isActive: boolean;
  }
  
  
  export interface CommunityData {
    contractType: string;
    daoAddress: string;
    metadata: string;
    market: boolean;
    discordServer: string;
  }