import autID from './abis/AutID.json';
import daoExpander from './abis/DAOExpander.json';
import { getSigner } from '../tools/ethers';
import { NetworkConfig } from '../models/config';
import { ethers } from 'ethers';

require('dotenv').config()

export const autIDContract = (networkConfig: NetworkConfig): ethers.Contract => {
  try {
    let contract = new ethers.Contract(
      networkConfig.contracts.autIDAddress,
      autID.abi,
      getSigner(networkConfig),
    );
    return contract;
  } catch (err) {
    console.log(err);
    return undefined;
  }
};

export const daoExpanderContract = (address: string, networkConfig: NetworkConfig): ethers.Contract => {
  try {
    let contract = new ethers.Contract(
      address,
      daoExpander.abi,
      getSigner(networkConfig),
    );
    return contract;
  } catch (err) {
    console.log(err);
    return undefined;
  }
};

