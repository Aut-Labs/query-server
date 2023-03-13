
import { ethers } from "ethers";
import * as onboardingOffchainVerificationTaskAbi from "../abis/OnboardingOffchainVerificationTaskPlugin.json";
import { getJSONFromURI, ipfsCIDToHttpUrl, getSigner } from "../tools/ethers";
import { getNetworkConfig } from "../services";


// TODO: replace with SDK
export const OnboardingOffchainVerificationTaskAbi = (taskAddress: string) => {
    try {
      const networkConfig = getNetworkConfig("mumbai", "testing" as any);

      let contract = new ethers.Contract(taskAddress, onboardingOffchainVerificationTaskAbi.abi, getSigner(networkConfig));
      return contract;
    } catch (err) {
      console.log(err);
      return undefined;
    }
  };
  
  export async function getTask(taskAddress: string, taskID: string): Promise<any> {
    try {
      const contract = OnboardingOffchainVerificationTaskAbi(taskAddress);
      return await contract.getById(taskID);
    } catch (err) {
      console.log(err);
      return undefined;
    }
  }


  export async function finalizeTask(taskAddress: string, taskID: string, submitter: string): Promise<any> {
    try {
      const contract = OnboardingOffchainVerificationTaskAbi(taskAddress);
      return await contract.finalize(taskID, submitter);
    } catch (err) {
      console.log(err);
      return undefined;
    }
  }