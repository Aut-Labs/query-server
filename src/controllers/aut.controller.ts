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

  public twitterVerification = async (req: any, res: Response) => {
    try {
      if (!req.body.signature)
        return res.status(400).send({ error: "No signature passed." });
      else if (!req.body.tweetID)
        return res.status(400).send({ error: "No tweetID passed." });
      else if (!req.body.address)
        return res.status(400).send({ error: "No address passed." });

      const isValid = await validateTweet(
        req.body.address,
        req.body.signature,
        req.body.tweetID
      );
      if (isValid) return res.status(200).send({ isValid });
      else
        return res
          .status(500)
          .send({ error: "Something went wrong, please try again later." });
    } catch (err) {
      this.loggerService.error(err);
      return res
        .status(500)
        .send({ error: "Something went wrong, please try again later." });
    }
  };

  public twitterToken = async (req: any, res: Response) => {
    try {
      var basicAuth = Buffer.from(
        `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
      );
      var basicAuthToBase64 = basicAuth.toString("base64");

      var config = {
        method: "post",
        url: `${process.env.API_TWITTER_URL}/oauth2/token`,
        headers: {
          Authorization: `Basic ${basicAuthToBase64}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        data: new URLSearchParams({
          code: req.body.code,
          grant_type: "authorization_code",
          client_id: process.env.TWITTER_CLIENT_ID,
          redirect_uri: req.body.redirectUrl,
          code_verifier: req.body.codeVerifier,
        }),
      };

      const response = await axios(config);

      var configLookup = {
        method: "get",
        url: `${process.env.API_TWITTER_URL}/users/me`,
        headers: {
          Authorization: `Bearer ${response.data.access_token}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      };

      const lookupResponse = await axios(configLookup);

      lookupResponse.data.data.token = response.data.access_token;

      return res.status(200).send(lookupResponse.data.data);
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
