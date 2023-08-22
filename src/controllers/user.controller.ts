import { LoggerService } from "../services/logger.service";
import { injectable } from "inversify";
import { UserModel } from "../models/user";
import jwt from "jsonwebtoken";
import { verifyMessage } from "@ethersproject/wallet";
import AutSDK, { DAOExpander, QuestOnboarding } from "@aut-labs/sdk";
import { getNetworkConfig } from "../services";
import { getSigner } from "../tools/ethers";
import { AutIDBadgeGenerator } from "../tools/ImageGeneration/AutIDBadge/AutIDBadgeGenerator";
import { SWIDParams } from "../tools/ImageGeneration/AutIDBadge/Badge.model";
import NovaContract from "@aut-labs/sdk/dist/contracts/nova";
import { AddressModel } from "../models/address";
import { MultiSigner } from "@aut-labs/sdk/dist/models/models";

const getHiddenAdminAddressesArray = () => {
  if (!process.env.HIDDEN_ADMIN_ADDRESSES) return [];
  return process.env.HIDDEN_ADMIN_ADDRESSES.split(",");
};

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
      const nova = sdk.initService<NovaContract>(NovaContract, daoAddress);
      const admins = await nova.contract.getAdmins();
      const hiddenAdmins = getHiddenAdminAddressesArray();
      if (hiddenAdmins.includes(admins[0])) {
        resolve(null);
      } else {
        const pluginDefinition =
          await sdk.pluginRegistry.getPluginDefinitionByType(daoAddress, 1);
        if (pluginDefinition.data) {
          const expander = sdk.initService<DAOExpander>(
            DAOExpander,
            daoAddress
          );
          const daoAdminsResponse = await expander.contract.admins.getAdmins();
          const daoData = await expander.contract.metadata.getMetadataUri();
          const onboardingQuest = sdk.initService<QuestOnboarding>(
            QuestOnboarding,
            pluginDefinition.data
          );
          const quests = await onboardingQuest.getAllQuests();
          const { pastQuests, allQuests, activeQuests } = (
            quests?.data || []
          ).reduce(
            (prev, curr) => {
              if (curr.active) {
                prev.activeQuests += 1;
              }
              if (curr.isExpired) {
                prev.pastQuests += 1;
              }
              prev.allQuests.push(curr);
              return prev;
            },
            {
              activeQuests: 0,
              pastQuests: 0,
              allQuests: [],
            }
          );

          const isThereAtLeastOneActive = activeQuests > 0;
          const isNovaExpired = pastQuests === allQuests.length;
          if (!isThereAtLeastOneActive) {
            resolve(null);
          } else {
            resolve({
              isNovaExpired,
              onboardingQuestAddress: onboardingQuest.contract.contract.address,
              daoAddress,
              admin: daoAdminsResponse.data[0],
              daoMetadataUri: daoData.data,
              quests: quests.data,
            });
          }
        } else {
          resolve(null);
        }
      }
    } catch (e) {
      return reject(e);
    }
  });
};

const getLeaderBoardDaoDetailsPromise = async (
  sdk: AutSDK,
  daoAddress: string
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const nova = sdk.initService<NovaContract>(NovaContract, daoAddress);
      const admins = await nova.contract.getAdmins();
      const hiddenAdmins = getHiddenAdminAddressesArray();
      if (hiddenAdmins.includes(admins[0])) {
        resolve(null);
      } else {
        const pluginDefinition =
          await sdk.pluginRegistry.getPluginDefinitionByType(daoAddress, 1);
        if (pluginDefinition.data) {
          const expander = sdk.initService<DAOExpander>(
            DAOExpander,
            daoAddress
          );
          const daoData = await expander.contract.metadata.getMetadataUri();

          let members = [];
          let totalMembers = 0;

          try {
            const membersResponse =
              await expander.contract.members.getAllMembers();
            members = membersResponse.data;
            totalMembers = membersResponse.data.length;
          } catch (error) {
            resolve(null);
          }
          resolve({
            daoAddress,
            daoMetadataUri: daoData.data,
            members,
            totalMembers,
          });
        } else {
          resolve(null);
        }
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
      const sdk = AutSDK.getInstance();
      const networkConfig = getNetworkConfig("mumbai", "testing" as any);

      const signer = getSigner(networkConfig);
      const multiSigner: MultiSigner = {
        readOnlySigner: signer,
        signer
      }

      await sdk.init(multiSigner, networkConfig.contracts);
      // const daosRes = await sdk.daoExpanderRegistry.contract.getDAOExpanders();
      const novaRes = await sdk.novaRegistry.contract.getNovas();

      const allDaos = [...novaRes.data];

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
    } catch (e) {
      this.loggerService.error(e);
      res.status(500).send("Something went wrong");
    }
  };

  public getLeaderDAOs = async (req, res) => {
    const promises = [];
    try {
      const sdk = AutSDK.getInstance();
      const networkConfig = getNetworkConfig("mumbai", "testing" as any);

      const signer = getSigner(networkConfig);
      const multiSigner: MultiSigner = {
        readOnlySigner: signer,
        signer
      }

      await sdk.init(multiSigner, networkConfig.contracts);
      // const daosRes = await sdk.daoExpanderRegistry.contract.getDAOExpanders();
      const novaRes = await sdk.novaRegistry.contract.getNovas();

      const MAX_DAOS = -30;
      const allDaos = [...novaRes.data].splice(MAX_DAOS);

      for (let index = 0; index < allDaos.length; index++) {
        const daoAddress = allDaos[index];
        promises.push(getLeaderBoardDaoDetailsPromise(sdk, daoAddress));
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

      await Promise.all(promises)
        .then((values) => {
          const pruned = values.filter((x) => x);
          return res.status(200).send(pruned.sort(compare));
        })
        .catch((e) => {
          throw e;
        });
    } catch (e) {
      this.loggerService.error(e);
      res.status(500).send("Something went wrong");
    }
  };

  public generate = async (req, res) => {
    try {
      if (!req.body.config) {
        return res.status(400).send(`"config" not provided.`);
      }
      const requestConfig = JSON.parse(req.body.config);
      if (!requestConfig.name) {
        return res.status(400).send(`"name" not provided.`);
      }
      if (!requestConfig.role) {
        return res.status(400).send(`"role" not provided.`);
      }
      if (!requestConfig.dao) {
        return res.status(400).send(`"dao" not provided.`);
      }
      if (!requestConfig.hash) {
        return res.status(400).send(`"hash" not provided.`);
      }
      if (!requestConfig.network) {
        return res.status(400).send(`"network" not provided.`);
      }
      if (!requestConfig.expanderAddress) {
        return res.status(400).send(`"expanderAddress" not provided.`);
      }
      if (!requestConfig.timestamp) {
        return res.status(400).send(`"timestamp" not provided.`);
      }
      const avatarBuffer = req.files.find(
        (x) => x.fieldname === "avatar"
      )?.buffer;
      const config = {
        avatar: avatarBuffer,
        ...requestConfig,
      } as SWIDParams;
      const { toBase64 } = await AutIDBadgeGenerator(config);
      const badge = await toBase64();
      res.status(200).send({ badge });
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

  // Set note
  public setAddressNote = async (req, res) => {
    try {
      const { address, note, daoAddress } = req.body;
      let addressNote = await AddressModel.findOne({
        address: address,
        daoAddress: daoAddress,
      });
      if (addressNote) {
        res.status(200).send();
      } else {
        addressNote = new AddressModel();
        addressNote.address = address;
        addressNote.note = note;
        await addressNote.save();
        res.status(200).send();
      }
    } catch (e) {
      this.loggerService.error(e);
      res.status(500).send("Something went wrong");
    }
  };

  // Get address note
  public getAddressNote = async (req, res) => {
    try {
      const { address, daoAddress } = req.params;
      let addressNote = await AddressModel.findOne({
        address: address,
        daoAddress: daoAddress,
      });
      if (addressNote) {
        res.status(200).send({ address, note: addressNote.note });
      } else {
        res.status(404).send("Address not found");
      }
    } catch (e) {
      this.loggerService.error(e);
      res.status(500).send("Something went wrong");
    }
  };

  // Get many addresses notes
  public getManyAddressNotes = async (req, res) => {
    try {
      const { admins, daoAddress } = req.body;
      const foundAddresses = await AddressModel.find({
        address: { $in: admins },
        daoAddress: daoAddress,
      });
      res.status(200).send(foundAddresses);
    } catch (e) {
      this.loggerService.error(e);
      res.status(500).send("Something went wrong");
    }
  };

  // Set many addresses notes
  public setManyAddresses = async (req, res) => {
    try {
      const { admins, daoAddress } = req.body;
      // const foundAddresses = await AddressModel.find({
      //   address: { $in: addresses },
      // });
      const updated = admins.map((data) => {
        return {
          updateOne: {
            filter: { address: data.address, daoAddress: daoAddress },
            update: { $set: data },
            upsert: true,
          },
        };
      });

      const result = await AddressModel.bulkWrite(updated);

      res.status(200).send(result);
    } catch (e) {
      this.loggerService.error(e);
      res.status(500).send("Something went wrong");
    }
  };

  public deleteManyAddresses = async (req, res) => {
    try {
      const { admins, daoAddress } = req.body;
      // const foundAddresses = await AddressModel.find({
      //   address: { $in: addresses },
      // });
      // const identifiersArray = admins.map((data) => data.address);

      const filter = { address: { $in: admins }, daoAddress: daoAddress }; // Assuming 'address' is the identifier

      const result = await AddressModel.deleteMany(filter);

      res.status(200).send(result);
    } catch (e) {
      this.loggerService.error(e);
      res.status(500).send("Something went wrong");
    }
  };
}
