import { injectable } from "inversify";
import { Router } from "express";
import { ZeelyController } from "../controllers/zeely.controller";
import { container } from "../inversify.config";
import { getNetworkConfig, LoggerService } from "../services";
import { NetworkConfigEnv } from "../models/config";

@injectable()
export class ZeelyRouter {
  private readonly _router: Router;
  private readonly _zeelyProdController: ZeelyController;
  private readonly _zeelyDevController: ZeelyController;

  constructor() {
    this._router = Router({ strict: true });
    this._zeelyDevController = new ZeelyController(
      process.env.GRAPH_API_DEV_URL,
      getNetworkConfig(NetworkConfigEnv.Testnet),
      container.get<LoggerService>(LoggerService)
    );
    this._zeelyProdController = new ZeelyController(
      process.env.GRAPH_API_PROD_URL,
      getNetworkConfig(NetworkConfigEnv.Mainnet),
      container.get<LoggerService>(LoggerService)
    );
    this.init();
  }

  private validateApiKey(req, res, next) {
    const apiKey = req.header("X-Api-Key");
    if (!apiKey || apiKey !== process.env.ZEELY_API_KEY) {
      return res.status(401).send("Unauthorized");
    }
    next();
  }

  private init(): void {
    this._router.post(
      "/hasDeployed",
      this.validateApiKey,
      this._zeelyProdController.hasDeployed
    );
    this._router.post(
      "/isAdmin",
      this.validateApiKey,
      this._zeelyProdController.isAdmin
    );
    this._router.post(
      "/20members",
      this.validateApiKey,
      this._zeelyProdController.has20Members
    );
    this._router.post(
      "/50members",
      this.validateApiKey,
      this._zeelyProdController.has50Members
    );
    this._router.post(
      "/100members",
      this.validateApiKey,
      this._zeelyProdController.has100Members
    );
    this._router.post(
      "/archetype",
      this.validateApiKey,
      this._zeelyProdController.hasAddedAnArchetype
    );
    this._router.post(
      "/domain",
      this.validateApiKey,
      this._zeelyProdController.hasRegisteredADomain
    );

    //DEV controller

    this._router.post(
      "/dev/hasDeployed",
      this.validateApiKey,
      this._zeelyDevController.hasDeployed
    );
    this._router.post(
      "/dev/isAdmin",
      this.validateApiKey,
      this._zeelyDevController.isAdmin
    );
    this._router.post(
      "/dev/20members",
      this.validateApiKey,
      this._zeelyDevController.has20Members
    );
    this._router.post(
      "/dev/50members",
      this.validateApiKey,
      this._zeelyDevController.has50Members
    );
    this._router.post(
      "/dev/100members",
      this.validateApiKey,
      this._zeelyDevController.has100Members
    );
    this._router.post(
      "/dev/archetype",
      this.validateApiKey,
      this._zeelyDevController.hasAddedAnArchetype
    );

    this._router.post(
      "/dev/domain",
      this.validateApiKey,
      this._zeelyDevController.hasRegisteredADomain
    );
  }

  public get router(): Router {
    return this._router;
  }
}
