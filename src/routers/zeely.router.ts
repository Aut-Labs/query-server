import { injectable } from "inversify";
import { Router } from "express";
import { ZeelyController } from "../controllers/zeely.controller";

@injectable()
export class ZeelyRouter {
  private readonly _router: Router;

  constructor(private zeelyController: ZeelyController) {
    this._router = Router({ strict: true });
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
      this.zeelyController.hasDeployed
    );
    this._router.post(
      "/isAdmin",
      this.validateApiKey,
      this.zeelyController.isAdmin
    );
    this._router.post(
      "/20members",
      this.validateApiKey,
      this.zeelyController.has20Members
    );
    this._router.post(
      "/50members",
      this.validateApiKey,
      this.zeelyController.has50Members
    );
    this._router.post(
      "/100members",
      this.validateApiKey,
      this.zeelyController.has100Members
    );
    this._router.post(
      "/archetype",
      this.validateApiKey,
      this.zeelyController.hasAddedAnArchetype
    );
  }

  public get router(): Router {
    return this._router;
  }
}
