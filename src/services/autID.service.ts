import { ethers } from "ethers";
import { Holder, HolderData } from "../models/holder";
import { AutIDContract } from "../contracts/autID.contracts";
import { DAOExpanderContract } from "../contracts/daoExpander.contracts";
import { getNetworkConfig, getNetworksConfig } from "../services";

export async function getAutID(
  username: string,
  network: string
): Promise<HolderData> {
  const config = getNetworkConfig(network);
  const autContract = new AutIDContract(config);
  const address = await autContract.getAddressByUsername(
    username.toLowerCase()
  );
  if (!address) return undefined;

  const holderData: HolderData = { communities: [] } as any;
  if (address != ethers.constants.AddressZero) {
    holderData.address = address;
    holderData.tokenId = await autContract.getTokenIdByOwner(address);
    holderData.metadataUri = await autContract.getTokenUri(holderData.tokenId);

    const daos = await autContract.getHolderDAOs(address);

    for (let i = 0; i < daos.length; i++) {
      const comData = await autContract.getCommunityMemberData(
        address,
        daos[i]
      );
      const communityMetadata = await DAOExpanderContract.getDAOData(
        daos[i],
        config
      );

      holderData.communities.push({
        communityExtension: daos[i],
        holderRole: comData.role,
        holderCommitment: comData.commitment,
        holderIsActive: comData.isActive,
        contractType: communityMetadata.contractType,
        daoAddress: communityMetadata.daoAddress,
        metadata: communityMetadata.metadata,
        market: communityMetadata.market,
        discordServer: communityMetadata.discordServer,
      });
    }

    return holderData;
  }
  return undefined;
}

export async function checkForAutIdsOnAllowedNetworks(
  address: string
): Promise<Holder[]> {
  //   const config = getNetworkConfig(network);
  const autIds: Holder[] = [];
  const networkConfigs = getNetworksConfig();
  networkConfigs.map(async (config) => {
    const autContract = new AutIDContract(config);
    const tokenId = await autContract.getTokenIdByOwner(address);
    const metadataUri = await autContract.getTokenUri(tokenId);
    autIds.push({ tokenId, metadataUri });
  });
  return autIds;
}
