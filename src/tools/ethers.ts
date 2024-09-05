// Import the the ethers shims (**BEFORE** ethers)
// import '@ethersproject/shims';

// Import the ethers library
import { ethers, HDNodeWallet, JsonRpcProvider, Wallet } from "ethers";
import { NetworkConfig } from "../models/config";
import axios from "axios";

require("dotenv").config();

function getSigner(networkConfig: NetworkConfig): ethers.Signer {
  const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrls[0]);

  // Create a wallet instance from the mnemonic
  const wallet = ethers.Wallet.fromPhrase(process.env.MNEMONIC as string);

  // Connect the wallet to the provider
  const signer = wallet.connect(provider);

  return signer;
}

function ipfsCIDToHttpUrl(url: string, isJson: boolean) {
  if (!url.includes("https://"))
    return `${process.env.IPFS_GATEWAY}/${url.replace("ipfs://", "")}`;
  else return url;
}

async function getJSONFromURI(uri: string) {
  const result = await axios.get(uri);
  return result.data;
}

export { getSigner, ethers, ipfsCIDToHttpUrl, getJSONFromURI };
