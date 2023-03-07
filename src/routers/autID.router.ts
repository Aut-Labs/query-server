import { injectable } from "inversify";
import { Router } from "express";
import {
  AutController,
  HoldersController,
  TempCacheController,
} from "../controllers";
@injectable()
export class AutIDRouter {
  private readonly _router: Router;

  constructor(
    private tempCacheController: TempCacheController,
    private holdersController: HoldersController,
    private autController: AutController
  ) {
    this._router = Router({ strict: true });
    this.init();
  }

  private init(): void {
    // GET

    /**
     * @swagger
     * /api/autID/username:
     *   get:
     *     description: Gets all autID signees.
     *     responses:
     *       200:
     *         description: Success
     *       500:
     *         description: Something went wrong, please try again later.
     */
    this._router.get("/:username", this.holdersController.get);

    /**
     * @swagger
     * /api/autID/scanNetworks/{address}:
     *   get:
     *     description: Scans all supported networks for autIds.
     *     parameters:
     *       - in: path
     *         name: address
     *         required: true
     *         description: Address to search for.
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Success
     *       500:
     *         description: Something went wrong, please try again later.
     */
    this._router.get(
      "/scanNetworks/:address",
      this.holdersController.scanNetworks
    );

    /**
     * @swagger
     * /api/autID/config/network/networkEnv:
     *   get:
     *     description: Gets all networks.
     *     responses:
     *       200:
     *         description: Success
     *       500:
     *         description: Something went wrong, please try again later.
     */
    this._router.get(
      "/config/network/:networkEnv",
      this.autController.getNetworks
    );

    /**
     * @swagger
     * /api/autID/config/network/networkEnv:/networkEnv:
     *   get:
     *     description: Gets single network.
     *     responses:
     *       200:
     *         description: Success
     *       500:
     *         description: Something went wrong, please try again later.
     */
    this._router.get(
      "/config/network/:networkEnv/:networkName",
      this.autController.getNetwork
    );

    /**
     * @swagger
     * /api/autID/config/twitterVerification:
     *   post:
     *     description: Twitter verification.
     *     responses:
     *       200:
     *         description: Success
     *       500:
     *         description: Something went wrong, please try again later.
     */
    // this._router.post(
    //   "/config/twitterVerification",
    //   this.autController.twitterVerification
    // );

    /**
     * @swagger
     * /api/autID/config/twitterToken:
     *   get:
     *     description: Twitter token OAuth2.
     *     responses:
     *       200:
     *         description: Success
     *       500:
     *         description: Something went wrong, please try again later.
     */
    // this._router.get("/config/oauthToken", this.autController.getOAuthToken);

    /**
     * @swagger
     * /api/autID/config/oauthAccessToken:
     *   post:
     *     description: Discord token OAuth2.
     *     responses:
     *       200:
     *         description: Success
     *       500:
     *         description: Something went wrong, please try again later.
     */
    this._router.post(
      "/config/oauth2AccessToken",
      this.autController.getOAuth2AccessToken
    );

    this._router.post(
      "/cache/addOrUpdateCache",
      this.tempCacheController.addOrUpdateCache
    );

    this._router.get(
      "/cache/getCache/:address",
      this.tempCacheController.getCache
    );

    this._router.delete(
      "/cache/deleteCache/:address",
      this.tempCacheController.deleteCache
    );
  }

  public get router(): Router {
    return this._router;
  }
}
