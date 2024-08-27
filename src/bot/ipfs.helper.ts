// import { Blob } from "buffer";
// import { NFTStorage } from "nft.storage";

// const client = new NFTStorage({ token: process.env.NFT_STORAGE_KEY || "" });

// export const storeAsBlob = async (json: any): Promise<string> => {
//   console.log(json);
//   const encodedJson = new TextEncoder().encode(JSON.stringify(json));
//   const blob = new Blob([encodedJson], {
//     type: "application/json;charset=utf-8",
//   });
//   const cid = await client.storeBlob(blob);
//   return cid;
// };

// export function ipfsCIDToHttpUrl(cid: string): string {
//   return `https://ipfs.io/ipfs/${cid}`;
// }
