import { injectable } from "inversify";
import { Router } from "express";
import { AutController, HoldersController } from "../controllers";
@injectable()
export class AutIDRouter {
  private readonly _router: Router;

  constructor(
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
     * @OTOD
     * Add parameter for which NetworkConfigEnv to load the networks for
     */

    /**
     * @swagger
     * /api/autID/config/network:
     *   get:
     *     description: Gets all networks.
     *     responses:
     *       200:
     *         description: Success
     *       500:
     *         description: Something went wrong, please try again later.
     */
    this._router.get("/config/network", this.autController.getNetworks);

    /**
     * @swagger
     * /api/autID/config/network:
     *   get:
     *     description: Gets single network.
     *     responses:
     *       200:
     *         description: Success
     *       500:
     *         description: Something went wrong, please try again later.
     */
    this._router.get(
      "/config/network/:networkName",
      this.autController.getNetwork
    );

    // DEPRECATED
    // TODO: Removed once replaced everywhere with the new endpoints
    this._router.get(
      "/config/:networkName",
      this.autController.getLegacyNetwork
    );
  }

  public get router(): Router {
    return this._router;
  }
}
