import { CommunityData, CommunityMemberData } from "../models/holder";
import { autIDContract, communityExtensionContract } from "./index";

export class AutIDContract {

  public static async getAddressByUsername(username: string): Promise<string> {
    try {
      const contract = autIDContract();
      const address = await contract.autIDUsername(username);
      return address.toString();
    } catch (err) {
      console.log(err);
      return undefined;
    }
  }


  public static async getCommunities(holder: string): Promise<string[]> {
    try {
      const contract = autIDContract();
      const communities = await contract.getCommunities(holder);
      return communities;
    } catch (err) {
      console.log(err);
      return undefined;
    }
  }

  public static async getCommunityData(community: string): Promise<CommunityData> {
    try {
      const contract = communityExtensionContract(community);
      const data = await contract.getComData();
      if (data && data['commitment']) {

        const res: CommunityData = {
          contractType: data['contractType'].toString(),
          daoAddress: data['daoAddress'],
          metadata: data['metadata'],
          market: data['market'].toString(),
          discordServer: data['discordServer']
        }
        return res;
      } else return undefined;

    } catch (err) {
      console.log(err);
      return undefined;
    }
  }

  public static async getCommunityMemberData(holder: string, community: string): Promise<CommunityMemberData> {
    try {
      const contract = autIDContract();
      const data = await contract.getCommunityData(holder, community);
      if (data && data['commitment']) {

        const res: CommunityMemberData = {
          communityExtension: data['communityExtension'],
          role: data['role'].toString(),
          commitment: data['commitment'].toString(),
          isActive: data['isActive']
        }
        return res;
      } else return undefined;

    } catch (err) {
      console.log(err);
      return undefined;
    }
  }

  public static async getTokenIdByOwner(holder: string): Promise<string> {
    try {
      const contract = autIDContract();
      const tokenID = await contract.getAutIDByOwner(holder);
      return tokenID.toString();
    } catch (err) {
      console.log(err);
      return undefined;
    }
  }
  public static async getTokenUri(tokenID: string): Promise<string> {
    try {
      const contract = autIDContract();
      const uri = await contract.tokenURI(tokenID);
      return uri;
    } catch (err) {
      console.log(err);
      return undefined;
    }
  }

}
