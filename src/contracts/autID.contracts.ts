import { DAOData, DAOMember } from "../models/holder";
import { autIDContract, daoExpanderContract } from "./index";

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


  public static async getHolderDAOs(holder: string): Promise<string[]> {
    try {
      const contract = autIDContract();
      const daos = await contract.getHolderDAOs(holder);
      return daos;
    } catch (err) {
      console.log(err);
      return undefined;
    }
  }

  public static async getDAOData(daoExpanderAddr: string): Promise<DAOData> {
    try {
      const contract = daoExpanderContract(daoExpanderAddr);
      const data = await contract.getDAOData();
      if (data && data['commitment']) {

        const res: DAOData = {
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

  public static async getCommunityMemberData(holder: string, daoExpander: string): Promise<DAOMember> {
    try {
      const contract = autIDContract();
      const data = await contract.getMembershipData(holder, daoExpander);
      if (data && data['commitment']) {

        const res: DAOMember = {
          daoExpanderAddress: data['daoExpanderAddress'],
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
