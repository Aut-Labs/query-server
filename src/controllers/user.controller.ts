import { LoggerService } from "../tools/logger.service";
import { injectable } from "inversify";
import { UserModel } from "../models/user";
import jwt from "jsonwebtoken";
import { AutIDBadgeGenerator } from "../tools/ImageGeneration/AutIDBadge/AutIDBadgeGenerator";
import { SWIDParams } from "../tools/ImageGeneration/AutIDBadge/Badge.model";
import { AddressModel } from "../models/address";
import { generateAutSigil } from "../tools/ImageGeneration/AutSIgilGenerator/SigilGenerator";
import axios from "axios";
import Twit from "twit";
import { GraphQLClient, gql } from "graphql-request";
import { isAddress, verifyMessage } from "ethers";

const generateNewNonce = () => {
  return `Nonce: ${Math.floor(Math.random() * 1000000).toString()}`;
};

const generateReferralCode = () => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const length = 8;
  let referralCode = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    referralCode += characters.charAt(randomIndex);
  }

  return referralCode;
};

@injectable()
export class UserController {
  constructor(private loggerService: LoggerService) {}

  public getUser = async (req, res) => {
    try {
      const response = { userData: req.user };
      res.status(200).send(response);
    } catch (e) {
      this.loggerService.error(e);
      res.status(500).send("Something went wrong");
    }
  };

  public generateSigil = async (req, res) => {
    try {
      if (!req.params.hubAddress) {
        return res.status(400).send(`"hubAddress" not provided.`);
      }
      if (!isAddress(req.params.hubAddress)) {
        return res.status(400).send(`Invalid "hubAddress" provided.`);
      }
      const { toBase64: toBase64Sigil } = await generateAutSigil(
        req.params.hubAddress
      );
      const sigil = await toBase64Sigil();
      res.status(200).send({ sigil });
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
      if (!requestConfig.hubAddress) {
        return res.status(400).send(`"hubAddress" not provided.`);
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
      const { toBase64: toBase64Sigil } = await generateAutSigil(
        requestConfig.hubAddress
      );
      const sigil = await toBase64Sigil();
      res.status(200).send({ badge, sigil });
    } catch (e) {
      this.loggerService.error(e);
      res.status(500).send("Something went wrong");
    }
  };

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

  public setAddressNote = async (req, res) => {
    try {
      const { address, note, hubAddress } = req.body;
      let addressNote = await AddressModel.findOne({
        address: address,
        hubAddress: hubAddress,
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

  public getAddressNote = async (req, res) => {
    try {
      const { address, hubAddress } = req.params;
      let addressNote = await AddressModel.findOne({
        address: address,
        hubAddress: hubAddress,
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

  public getManyAddressNotes = async (req, res) => {
    try {
      const { admins, hubAddress } = req.body;
      const foundAddresses = await AddressModel.find({
        address: { $in: admins },
        hubAddress: hubAddress,
      });
      res.status(200).send(foundAddresses);
    } catch (e) {
      this.loggerService.error(e);
      res.status(500).send("Something went wrong");
    }
  };

  public setManyAddresses = async (req, res) => {
    try {
      const { admins, hubAddress } = req.body;
      // const foundAddresses = await AddressModel.find({
      //   address: { $in: addresses },
      // });
      const updated = admins.map((data) => {
        return {
          updateOne: {
            filter: { address: data.address, hubAddress: hubAddress },
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
      const { admins, hubAddress } = req.body;
      // const foundAddresses = await AddressModel.find({
      //   address: { $in: addresses },
      // });
      // const identifiersArray = admins.map((data) => data.address);

      const filter = { address: { $in: admins }, hubAddress: hubAddress }; // Assuming 'address' is the identifier

      const result = await AddressModel.deleteMany(filter);

      res.status(200).send(result);
    } catch (e) {
      this.loggerService.error(e);
      res.status(500).send("Something went wrong");
    }
  };

  public generateReferralCode = async (req, res) => {
    try {
      const { address } = req.user;
      const user = await UserModel.findOne({ address: address });
      if (user) {
        const referralCode = generateReferralCode(); // Implement your own logic to generate a unique referral code
        user.referralCodes.push(referralCode);
        await user.save();
        res.status(200).send({ referralCode });
      } else {
        res.status(404).send("User not found");
      }
    } catch (e) {
      this.loggerService.error(e);
      res.status(500).send("Something went wrong");
    }
  };

  public useReferralCode = async (req, res) => {
    try {
      const { address } = req.user;
      const { referralCode } = req.body;
      const referrer = await UserModel.findOne({ referralCodes: referralCode });
      if (referrer) {
        if (referrer.address === address) {
          return res.status(400).send("Cannot use your own referral code");
        }
        const user = await UserModel.findOne({ address: address });
        if (user) {
          if (!user.referredBy) {
            user.referredBy = referrer.address;
            referrer.referredAddresses.push(user.address);
            referrer.points += 1;
            referrer.referralCodes = referrer.referralCodes.filter(
              (code) => code !== referralCode
            );
            await user.save();
            await referrer.save();
            return res.status(200).send("Referral code applied successfully");
          } else {
            return res.status(400).send("User has already been referred");
          }
        } else {
          return res.status(404).send("User not found");
        }
      } else {
        return res.status(404).send("Invalid referral code");
      }
    } catch (e) {
      this.loggerService.error(e);
      return res.status(500).send("Something went wrong");
    }
  };

  public verifyHasAddedBio = async (req, res) => {
    const { address } = req.user;
    try {
      const graphqlClient = new GraphQLClient(process.env.GRAPH_API_DEV_URL);
      const query = gql`
    query GetAutID {
      autID(id: "${address.toLowerCase()}") {
        id
        username
        tokenID
        role
        commitment
        metadataUri
      }
    }
  `;
      const autIdResponse: any = await graphqlClient.request(query);
      let { metadataUri } = autIdResponse.autID;
      const prefix = "ipfs://";
      if (metadataUri.startsWith(prefix)) {
        metadataUri = metadataUri.substring(prefix.length);
      }
      const autId = await axios.get(
        `${process.env.IPFS_GATEWAY}/${metadataUri}`
      );
      const { properties } = autId.data;
      if (properties.bio) {
        const user = await UserModel.findOne({ address: address });

        if (user) {
          if (!user.hasAddedBio) {
            user.hasAddedBio = true;
            user.points += 1;
            await user.save();
            return res.status(200).send({ message: "Bio verified." });
          } else {
            return res.status(200).send({ message: "Reward already claimed." });
          }
        } else {
          return res.status(404).send({ error: "User not found." });
        }
      } else {
        return res.status(200).send({ message: "Bio not set." });
      }
    } catch (e) {
      this.loggerService.error(e);
      return res.status(500).send("Something went wrong");
    }
  };

  public verifyTwitterFollow = async (req: any, res: any) => {
    try {
      const { accessToken, userId } = req.body;
      const twitterHandle = "opt_aut"; // Replace with the Twitter handle you want to check

      if (!accessToken) {
        return res.status(400).send({
          error: "Access token not provided.",
        });
      }

      if (!userId) {
        return res.status(400).send({
          error: "User ID not provided.",
        });
      }

      const T = new Twit({
        consumer_key: process.env.X_CONSUMER_API_KEY,
        consumer_secret: process.env.X_CONSUMER_API_SECRET,
        access_token: process.env.X_ACCESS_TOKEN,
        access_token_secret: process.env.X_TOKEN_SECRET,
      });
      const response = await T.get("followers/ids", {
        screen_name: twitterHandle,
      });
      const followerIds = response.data.ids;

      if (followerIds.includes(userId)) {
        // User follows the specified Twitter account
        const user = await UserModel.findOne({ twitterId: userId });

        if (user) {
          user.hasFollowedOnTwitter = true;
          await user.save();
          return res.status(200).send({ message: "Twitter follow verified." });
        } else {
          return res.status(404).send({ error: "User not found." });
        }
      } else {
        return res.status(400).send({
          error: "User does not follow the specified Twitter account.",
        });
      }
    } catch (err) {
      this.loggerService.error(err);
      return res
        .status(500)
        .send({ error: "Something went wrong, please try again later." });
    }
  };

  public getTwitterMe = async (req, res) => {
    try {
      const { accessToken } = req.body;

      if (!accessToken) {
        return res.status(400).send({
          error: "Access token not provided.",
        });
      }

      const userMeResponse = await axios.get("https://api.twitter.com/2/users/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log(userMeResponse.data);

      res.status(200).send(userMeResponse.data.data);
    } catch (err) {
      this.loggerService.error(err);
      return res.status(500).send({ error: "Something went wrong, please try again later." });
    }
  };
}
