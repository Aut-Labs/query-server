import { NetworkConfig } from "../models/config";
import { DAOData } from "../models/holder";
import { daoExpanderContract } from "./index";

export class DAOExpanderContract {
  
  public static async getDAOData(daoExpanderAddr: string, networkConfig: NetworkConfig): Promise<DAOData> {
    try {
      const contract = daoExpanderContract(daoExpanderAddr, networkConfig);
      const data = await contract.getDAOData();
      if (data) {
        const res: DAOData = {
          contractType: data['contractType'].toString(),
          daoAddress: data['daoAddress'],
          discordServer: data['discordServer']
        }
        return res;
      } else return undefined;

    } catch (err) {
      console.log(err);
      return undefined;
    }
  }


  public static async getMetadataUri(daoExpanderAddr: string, networkConfig: NetworkConfig): Promise<string> {
    try {
      const contract = daoExpanderContract(daoExpanderAddr, networkConfig);
      const data = await contract.getMetadataUri();
      return data;
    } catch (err) {
      console.log(err);
      return undefined;
    }
  }

  public static async getMarket(daoExpanderAddr: string, networkConfig: NetworkConfig): Promise<string> {
    try {
      const contract = daoExpanderContract(daoExpanderAddr, networkConfig);
      const market = await contract.getMarket();
      return market.toString();
    } catch (err) {
      console.log(err);
      return undefined;
    }
  }

}
