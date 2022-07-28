import { ethers } from 'ethers';
import { HolderData } from '../models/holder';
import { AutIDContract } from '../contracts/autID.contracts';


export async function getAutID(username: string): Promise<HolderData> {
    const address = await AutIDContract.getAddressByUsername(username);
    console.log('address', address);

    const holderData: HolderData = { communities: []} as any;
    if (address != ethers.constants.AddressZero) {

        holderData.address = address;
        holderData.tokenId = await AutIDContract.getTokenIdByOwner(address);
        holderData.metadataUri = await AutIDContract.getTokenUri(holderData.tokenId);

        const daos = await AutIDContract.getHolderDAOs(address);

        for (let i = 0; i < daos.length; i++) {

            const comData = await AutIDContract.getCommunityMemberData(address, daos[i]);
            const communityMetadata = await AutIDContract.getDAOData(daos[i]);

            holderData.communities.push({
                communityExtension: daos[i],
                holderRole: comData.role,
                holderCommitment: comData.commitment,
                holderIsActive: comData.isActive,
                contractType: communityMetadata.contractType,
                daoAddress: communityMetadata.daoAddress,
                metadata: communityMetadata.metadata,
                market: communityMetadata.market,
                discordServer: communityMetadata.discordServer
            });
        }

        console.log(holderData);

        return holderData;
    }
    return undefined;
}