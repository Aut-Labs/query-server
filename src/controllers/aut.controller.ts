import { LoggerService } from "../services/logger.service";
import { injectable } from "inversify";
import { Response } from "express";
import axios from "axios";
import qs from "querystring";
import {
  getNetworkConfig,
  getNetworksConfig,
  validateTweet,
} from "../services";
import { NetworkConfigEnv } from "../models/config";

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
      
      const configuration = getNetworkConfig(networkEnv);
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

  public getOAuth2AccessTokenDiscord = async (req: any, res: Response) => {
    try {
      const { code, callbackUrl } = req.body;

      if (!code) {
        return res.status(400).send({
          error: `OAuth2 code not provided.`,
        });
      }

      if (!callbackUrl) {
        return res.status(400).send({
          error: `callbackUrl not provided.`,
        });
      }

      const data = qs.stringify({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code: code,
        redirect_uri: callbackUrl,
      });
      const config = {
        method: "post",
        url: process.env.DISCORD_API_ENDPOINT,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        data: data,
      };

      const response = await axios(config);

      console.log(response.data);

      return res.status(200).send(response.data);
    } catch (err) {
      this.loggerService.error(err);
      return res
        .status(500)
        .send({ error: "Something went wrong, please try again later." });
    }
  };

  public getGithubOAuth2AccessToken = async (req: any, res: Response) => {
    try {
      const { code, callbackUrl } = req.body;
      if (!code) {
        return res.status(400).send({
          error: `OAuth2 code not provided.`,
        });
      }

      if (!callbackUrl) {
        return res.status(400).send({
          error: `callbackUrl not provided.`,
        });
      }

      let data = qs.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        grant_type: "authorization_code",
        code: code,
        redirect_uri: callbackUrl,
      });

      let config = {
        method: "post",
        maxBodyLength: Infinity,
        url: process.env.GITHUB_API_ENDPOINT,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        data: data,
      };

      const response = await axios(config);

      const regex = /access_token=([^&]+)/;
      const match = response.data.match(regex);
      const access_token = match ? match[1] : null;
      return res.status(200).send({ access_token });
    } catch (err) {
      this.loggerService.error(err);
      return res
        .status(500)
        .send({ error: "Something went wrong, please try again later." });
    }
  };

  public getXOAuth2AccessToken = async (req: any, res: Response) => {
    try {
      const { code, callbackUrl } = req.body;
      if (!code) {
        return res.status(400).send({
          error: `OAuth2 code not provided.`,
        });
      }

      if (!callbackUrl) {
        return res.status(400).send({
          error: `callbackUrl not provided.`,
        });
      }

      let data = qs.stringify({
        client_id: process.env.X_CLIENT_ID,
        client_secret: process.env.X_CLIENT_SECRET,
        grant_type: "authorization_code",
        code: code,
        redirect_uri: callbackUrl,
        code_verifier: "challenge",
      });

      const value = process.env.X_CLIENT_ID + ":" + process.env.X_CLIENT_SECRET;
      const AuthHeader = Buffer.from(value).toString("base64");

      let config = {
        method: "post",
        maxBodyLength: Infinity,
        url: process.env.X_API_ENDPOINT,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${AuthHeader}`,
        },
        data: data,
      };

      const response = await axios(config);

      return res.status(200).send(response.data);
    } catch (err) {
      this.loggerService.error(err);
      return res
        .status(500)
        .send({ error: "Something went wrong, please try again later." });
    }
  };

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
