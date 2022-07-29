import { NetworkConfig } from "../models/config";
import { DAOData } from "../models/holder";
import { daoExpanderContract } from "./index";

export class DAOExpanderContract {
  
  public static async getDAOData(daoExpanderAddr: string, networkConfig: NetworkConfig): Promise<DAOData> {
    try {
      const contract = daoExpanderContract(daoExpanderAddr, networkConfig);
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

}
