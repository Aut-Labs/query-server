import { LoggerService } from "../services/logger.service";
import { injectable } from "inversify";
import { UserModel } from "../models/user";
import jwt from "jsonwebtoken";
import { verifyMessage } from "@ethersproject/wallet";
import AutSDK, {
  DAOExpander,
  fetchMetadata,
  QuestOnboarding,
} from "@aut-labs-private/sdk";
import { getNetworkConfig } from "../services";
import { getSigner } from "../tools/ethers";
import { BaseNFTModel } from "@aut-labs-private/sdk/dist/models/baseNFTModel";
import axios from "axios";
import { PluginDefinitionType } from "@aut-labs-private/sdk/dist/models/plugin";

const generateNewNonce = () => {
  return `Nonce: ${Math.floor(Math.random() * 1000000).toString()}`;
};

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

function replaceAll(str, find, replace) {
  return str.replace(new RegExp(escapeRegExp(find), "g"), replace);
}

const ipfsCIDToHttpUrl = (url: string, isJson = false) => {
  if (!url) {
    return url;
  }
  if (!url.includes("https://"))
    return isJson
      ? `${"https://cloudflare-ipfs.com/ipfs"}/${replaceAll(
          url,
          "ipfs://",
          ""
        )}/metadata.json`
      : `${"https://cloudflare-ipfs.com/ipfs"}/${replaceAll(
          url,
          "ipfs://",
          ""
        )}`;
  return url;
};

const getDaoDetailsPromise = async (sdk: AutSDK, daoAddress: string) => {
  return new Promise(async (resolve, reject) => {
    try {
      const pluginDefinition =
        await sdk.pluginRegistry.getPluginDefinitionByType(daoAddress, 1);
      if (pluginDefinition.data) {
        const expander = sdk.initService<DAOExpander>(DAOExpander, daoAddress);
        const daoAdminsResponse = await expander.contract.admins.getAdmins();
        const daoData = await expander.contract.metadata.getMetadataUri();
        const onboardingQuest = sdk.initService<QuestOnboarding>(
          QuestOnboarding,
          pluginDefinition.data
        );
        const quests = await onboardingQuest.getAllQuests();
        resolve({
          onboardingQuestAddress: onboardingQuest.contract.contract.address,
          daoAddress,
          admin: daoAdminsResponse.data[0],
          daoMetadataUri: daoData.data,
          quests: quests.data,
        });
      } else {
        resolve(null);
      }
    } catch (e) {
      reject(e);
    }
  });
};

@injectable()
export class UserController {
  constructor(private loggerService: LoggerService) {}

  public getUser = async (req, res) => {
    try {
      const response = { address: req.user.address };
      res.status(200).send(response);
    } catch (e) {
      this.loggerService.error(e);
      res.status(500).send("Something went wrong");
    }
  };

  public getDaos = async (req, res) => {
    const promises = [];
    try {
      console.time("getDaos");
      const sdk = AutSDK.getInstance();
      const networkConfig = getNetworkConfig("mumbai", "testing" as any);

      const signer = getSigner(networkConfig);

      await sdk.init(signer as any, networkConfig.contracts);
      const daosRes = await sdk.daoExpanderRegistry.contract.getDAOExpanders();
      const autDaoRes = await sdk.autDaoRegistry.contract.getAutDAOs();

      const allDaos = [...daosRes.data, ...autDaoRes.data];

      for (let index = 0; index < allDaos.length; index++) {
        const daoAddress = allDaos[index];
        promises.push(getDaoDetailsPromise(sdk, daoAddress));
      }

      await Promise.all(promises)
        .then((values) => {
          const pruned = values.filter((x) => x);
          return res.status(200).send(pruned);
        })
        .catch((e) => {
          throw e;
        });

      // const responseDaos = [];

      // console.timeEnd("getDaos");
      // console.time("getDetails");
      // for (let index = 0; index < allDaos.length; index++) {
      //   console.time(`details ${index}`);
      //   const daoAddress = allDaos[index];
      //   console.time(`getPluginDefinitionByType ${index}`);
      //   const pluginDefinition =
      //     await sdk.pluginRegistry.getPluginDefinitionByType(daoAddress, 1);
      //   console.timeEnd(`getPluginDefinitionByType ${index}`);

      //   console.timeEnd(`details ${index}`);
      //   if (pluginDefinition.data) {
      //     const expander = sdk.initService<DAOExpander>(
      //       DAOExpander,
      //       daoAddress
      //     );
      //     const daoAdminsResponse = await expander.contract.admins.getAdmins();
      //     const daoData = await expander.contract.metadata.getMetadataUri();
      //     console.time(`quests ${index}`);
      //     const onboardingQuest = sdk.initService<QuestOnboarding>(
      //       QuestOnboarding,
      //       pluginDefinition.data
      //     );
      //     const quests = await onboardingQuest.getAllQuests();
      //     responseDaos.push({
      //       onboardingQuestAddress: onboardingQuest.contract.contract.address,
      //       daoAddress,
      //       admin: daoAdminsResponse.data[0],
      //       daoMetadataUri: daoData.data,
      //       quests: quests.data,
      //     });
      //     console.timeEnd(`quests ${index}`);
      //   }
      // }
      // console.timeEnd("getDetails");

      // res.status(200).send(responseDaos);
    } catch (e) {
      this.loggerService.error(e);
      res.status(500).send("Something went wrong");
    }
  };

  public getLeaderDAOs = async (req, res) => {
    try {
      const sdk = AutSDK.getInstance();
      const networkConfig = getNetworkConfig("mumbai", "testing" as any);

      const signer = getSigner(networkConfig);

      await sdk.init(signer as any, networkConfig.contracts);
      const daosRes = await sdk.daoExpanderRegistry.contract.getDAOExpanders();
      const autDaoRes = await sdk.autDaoRegistry.contract.getAutDAOs();

      const MAX_DAOS = -30;
      const allDaos = [...daosRes.data, ...autDaoRes.data].splice(MAX_DAOS);

      const responseDaos = [];

      for (let index = 0; index < allDaos.length; index++) {
        const daoAddress = allDaos[index];
        const expander = sdk.initService<DAOExpander>(DAOExpander, daoAddress);
        const daoData = await expander.contract.metadata.getMetadataUri();

        let members = [];
        let totalMembers = 0;

        try {
          const membersResponse =
            await expander.contract.members.getAllMembers();
          members = membersResponse.data;
          totalMembers = membersResponse.data.length;
        } catch (error) {}

        responseDaos.push({
          daoAddress,
          daoMetadataUri: daoData.data,
          members,
          totalMembers,
        });
      }

      function compare(a, b) {
        if (a.totalMembers > b.totalMembers) {
          return -1;
        }
        if (a.totalMembers < b.totalMembers) {
          return 1;
        }
        return 0;
      }

      res.status(200).send(responseDaos.sort(compare));
    } catch (e) {
      this.loggerService.error(e);
      res.status(500).send("Something went wrong");
    }
  };

  // Get user nonce
  public getUserNonce = async (req, res) => {
    try {
      const { address } = req.params;
      let user = await UserModel.findOne({ address: address });
      if (user) {
        res.status(200).send({ nonce: user.nonce });
      } else {
        user = new UserModel();
        user.address = address;
        user.nonce = generateNewNonce();
        await user.save();
        res.status(200).send({ nonce: user.nonce });
      }
    } catch (e) {
      this.loggerService.error(e);
      res.status(500).send("Something went wrong");
    }
  };

  // Process signed message
  public getToken = async (req, res) => {
    const { signature, address } = req.body;
    try {
      const user = await UserModel.findOne({ address: address });
      if (user) {
        const recoveredAddress = await verifyMessage(user.nonce, signature);

        // Check if address matches
        if (recoveredAddress.toLowerCase() === user.address.toLowerCase()) {
          // Change user nonce
          user.nonce = generateNewNonce();
          await user.save();
          // Set jwt token
          const token = jwt.sign(
            {
              _id: user._id,
              address: user.address,
            },
            process.env.JWT_SECRET,
            { expiresIn: "60 days" }
          );
          res.status(200).json({
            success: true,
            token: `Bearer ${token}`,
            user: user,
            msg: "You are now logged in.",
          });
        } else {
          // User is not authenticated
          res.status(401).send("Invalid credentials");
        }
      } else {
        res.status(404).send("User does not exist");
      }
    } catch (e) {
      this.loggerService.error(e);
      res.status(500).send("Something went wrong");
    }
  };
}
