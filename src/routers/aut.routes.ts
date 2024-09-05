import { Router } from "express";
import { AutController } from "../controllers";
import { injectable, inject } from "inversify";

@injectable()
export class AutRouter {
  private readonly _router: Router;

  constructor(@inject(AutController) private autController: AutController) {
    this._router = Router({ strict: true });
    this.init();
  }

  private init(): void {
    /**
     * @swagger
     * /api/aut/config/network/{networkEnv}:
     *   get:
     *     summary: Get network configurations
     *     description: Endpoint to retrieve network configurations based on the environment.
     *     tags:
     *       - Config
     *     parameters:
     *       - in: path
     *         name: networkEnv
     *         required: true
     *         schema:
     *           type: string
     *         description: The network environment (e.g. testnet, mainnet).
     *     responses:
     *       200:
     *         description: Network configurations retrieved successfully
     *       400:
     *         description: Bad Request
     */
    this._router.get(
      "/config/network/:networkEnv",
      this.autController.getNetworks
    );

    this._router.post(
      "/config/oauth2AccessTokenDiscord",
      this.autController.getOAuth2AccessTokenDiscord
    );

    this._router.post(
      "/config/oauth2AccessTokenX",
      this.autController.getXOAuth2AccessToken
    );

    this._router.post(
      "/config/oauth2AccessTokenGithub",
      this.autController.getGithubOAuth2AccessToken
    );
  }

  public get router(): Router {
    return this._router;
  }
}
