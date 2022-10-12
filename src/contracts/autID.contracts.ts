import { ethers } from "ethers";
import { NetworkConfig } from "../models/config";
import { DAOMember } from "../models/holder";
import { autIDContract } from "./index";

export class AutIDContract {
  autID: ethers.Contract;
  networkConfig: NetworkConfig;
  constructor(config: NetworkConfig) {
    this.networkConfig = config;
    this.autID = autIDContract(config);
  }

  public async getAddressByUsername(username: string): Promise<string> {
    try {
      const address = await this.autID.getAutIDHolderByUsername(username);
      return address.toString();
    } catch (err) {
      console.log(err);
      return undefined;
    }
  }


  public async getHolderDAOs(holder: string): Promise<string[]> {
    try {
      const daos = await this.autID.getHolderDAOs(holder);
      return daos;
    } catch (err) {
      console.log(err);
      return undefined;
    }
  }
  public async getCommunityMemberData(holder: string, daoExpander: string): Promise<DAOMember> {
    try {
      const data = await this.autID.getMembershipData(holder, daoExpander);
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

  public async getTokenIdByOwner(holder: string): Promise<string> {
    try {
      const tokenID = await this.autID.getAutIDByOwner(holder);
      return tokenID.toString();
    } catch (err) {
      console.log(err);
      return undefined;
    }
  }
  public async getTokenUri(tokenID: string): Promise<string> {
    try {
      const uri = await this.autID.tokenURI(tokenID);
      return uri;
    } catch (err) {
      console.log(err);
      return undefined;
    }
  }

}
