import { ethers, JsonRpcProvider, Wallet } from "ethers";
import { NetworkConfig } from "../models/config";
import axios from "axios";

async function getSigner(networkConfig: NetworkConfig): Promise<ethers.Signer> {
  try {
    const [rpcUrl] = networkConfig.rpcUrls;
    console.log("Connecting to network:", rpcUrl);
    const provider = new JsonRpcProvider(rpcUrl);
    const network = await provider.getNetwork();
    console.log("Connected to network:", network?.name);
    console.log("Connected to chainId:", Number(network?.chainId));

    const senderWalletMnemonic = Wallet.fromPhrase(
      process.env.MNEMONIC as string
    );
    let signer = senderWalletMnemonic.connect(provider);
    return signer;
  } catch (error) {
    console.error("Failed to initialize signer:", error);
    throw error;
  }
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

function replaceAll(str, find, replace) {
  return str.replace(new RegExp(escapeRegExp(find), "g"), replace);
}

function ipfsCIDToHttpUrl(url: string, nftStorageUrl: string) {
  if (!url) {
    return url;
  }
  if (!url.includes("https://"))
    return `${nftStorageUrl}/${replaceAll(url, "ipfs://", "")}`;
  return url;
}

async function getJSONFromURI(uri: string) {
  const result = await axios.get(uri);
  return result.data;
}

export { getSigner, ethers, ipfsCIDToHttpUrl, getJSONFromURI };
