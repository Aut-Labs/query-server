// Import the the ethers shims (**BEFORE** ethers)
// import '@ethersproject/shims';

// Import the ethers library
import { ethers, HDNodeWallet, JsonRpcProvider, Wallet } from "ethers";
import { NetworkConfig } from "../models/config";
import axios from "axios";

require("dotenv").config();

function getSigner(networkConfig: NetworkConfig): ethers.Signer {
  const provider = new JsonRpcProvider(networkConfig.rpcUrls[0]);

  // Wallet connected to a provider
  const senderWalletMnemonic = HDNodeWallet.fromPhrase(
    process.env.MNEMONIC as any,
    "m/44'/60'/0'/0/0"
  );

  let signer = senderWalletMnemonic.connect(provider);
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
