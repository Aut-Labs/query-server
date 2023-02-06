import { LoggerService } from "../services/logger.service";
import { injectable } from "inversify";
import { Response } from "express";
import axios from "axios";
import {
  getNetworkConfig,
  getNetworksConfig,
  validateTweet,
} from "../services";
import { NetworkConfigEnv } from "../models/config";
// var OAuth = require("oauth").OAuth;

// const _oauth = new OAuth(
//   "https://api.twitter.com/oauth/request_token",
//   "https://api.twitter.com/oauth/access_token",
//   process.env.TWITTER_CONSUMER_ID,
//   process.env.TWITTER_CONSUMER_SECRET,
//   "1.0A",
//   process.env.CALLBACK_URL,
//   "HMAC-SHA1"
// );

// const oauth = {
//   getOAuthRequestToken: () => {
//     return new Promise((resolve, reject) => {
//       _oauth.getOAuthRequestToken(
//         (error, oauth_token, oauth_token_secret, results) => {
//           if (error) {
//             reject(error);
//           } else {
//             resolve({ oauth_token, oauth_token_secret, results });
//           }
//         }
//       );
//     });
//   },
//   getOAuthAccessToken: (oauth_token, oauth_token_secret, oauth_verifier) => {
//     return new Promise((resolve, reject) => {
//       _oauth.getOAuthAccessToken(
//         oauth_token,
//         oauth_token_secret,
//         oauth_verifier,
//         (error, oauth_access_token, oauth_access_token_secret, results) => {
//           if (error) {
//             reject(error);
//           } else {
//             resolve({
//               oauth_access_token,
//               oauth_access_token_secret,
//               results,
//             });
//           }
//         }
//       );
//     });
//   },
// };

@injectable()
export class AutController {
  constructor(private loggerService: LoggerService) {}

  public getNetwork = async (req: any, res: Response) => {
    try {
      const network = req.params.networkName;
      const networkEnv = req.params.networkEnv;
      const avaiableNetEnvs = Object.values(NetworkConfigEnv);

      if (!networkEnv) {
        return res.status(400).send({
          error: `Network env name not provided. Only the following are allowed: ${avaiableNetEnvs.join(
            ","
          )}`,
        });
      }

      if (!avaiableNetEnvs.includes(networkEnv)) {
        return res.status(400).send({
          error: `Network env name not supported. Only the following are allowed: ${avaiableNetEnvs.join(
            ","
          )}`,
        });
      }

      if (!network) {
        return res.status(400).send({ error: "Network name not provided." });
      }

      const configuration = getNetworkConfig(network, networkEnv);
      if (!configuration)
        return res.status(400).send({
          error: `Network not supported. Make sure you using the correct network environment. ${avaiableNetEnvs.join(
            "|"
          )}`,
        });
      return res.status(200).send(configuration);
    } catch (err) {
      this.loggerService.error(err);
      return res
        .status(500)
        .send({ error: "Something went wrong, please try again later." });
    }
  };

  // public twitterVerification = async (req: any, res: Response) => {
  //   try {
  //     if (!req.body.signature)
  //       return res.status(400).send({ error: "No signature passed." });
  //     else if (!req.body.tweetID)
  //       return res.status(400).send({ error: "No tweetID passed." });
  //     else if (!req.body.address)
  //       return res.status(400).send({ error: "No address passed." });

  //     const isValid = await validateTweet(
  //       req.body.address,
  //       req.body.signature,
  //       req.body.tweetID
  //     );
  //     if (isValid) return res.status(200).send({ isValid });
  //     else
  //       return res
  //         .status(500)
  //         .send({ error: "Something went wrong, please try again later." });
  //   } catch (err) {
  //     this.loggerService.error(err);
  //     return res
  //       .status(500)
  //       .send({ error: "Something went wrong, please try again later." });
  //   }
  // };

  // public getOAuthToken = async (_req: any, res: Response) => {
  //   try {
  //     const result = await oauth.getOAuthRequestToken();
  //     console.log(result);
  //     return res.status(200).send(result);
  //   } catch (err) {
  //     this.loggerService.error(err);
  //     return res
  //       .status(500)
  //       .send({ error: "Something went wrong, please try again later." });
  //   }
  // };

  // public getOAuthAccessToken = async (req: any, res: Response) => {
  //   try {
  //     const result = await oauth.getOAuthAccessToken(
  //       req.body.oauthToken,
  //       req.body.oauthTokenSecret,
  //       req.body.oauthVerifier
  //     );
  //     console.log(result);
  //     return res.status(200).send(result);
  //   } catch (err) {
  //     this.loggerService.error(err);
  //     return res
  //       .status(500)
  //       .send({ error: "Something went wrong, please try again later." });
  //   }
  // };

  public getNetworks = async (req: any, res: Response) => {
    try {
      const networkEnv = req.params.networkEnv;
      const avaiableNetEnvs = Object.values(NetworkConfigEnv);

      if (!networkEnv) {
        return res.status(400).send({
          error: `Network env name not provided. Only the following are allowed: ${avaiableNetEnvs.join(
            ","
          )}`,
        });
      }

      if (!avaiableNetEnvs.includes(networkEnv)) {
        return res.status(400).send({
          error: `Network env name not supported. Only the following are allowed: ${avaiableNetEnvs.join(
            ","
          )}`,
        });
      }

      return res.status(200).send(getNetworksConfig(networkEnv));
    } catch (err) {
      this.loggerService.error(err);
      return res
        .status(500)
        .send({ error: "Something went wrong, please try again later." });
    }
  };
}
