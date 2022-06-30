import autID from './abis/AutID.json';
import communityExtension from './abis/CommunityExtension.json';
import { ethers, signer } from '../tools/ethers';

require('dotenv').config()

export const autIDContract = () => {
  try {
    let contract = new ethers.Contract(
      process.env.AUTID_CONTRACT_ADDRESS,
      autID.abi,
      signer,
    );
    return contract;
  } catch (err) {
    console.log(err);
    return undefined;
  }
};

export const communityExtensionContract = (address: string) => {
  try {
    let contract = new ethers.Contract(
      address,
      communityExtension.abi,
      signer,
    );
    return contract;
  } catch (err) {
    console.log(err);
    return undefined;
  }
};

