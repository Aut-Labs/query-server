import { injectable } from "inversify";
import { Router } from "express";
import { HoldersController } from "../controllers";
@injectable()
export class AutIDRouter {
  private readonly _router: Router;

  constructor(private holdersController: HoldersController) {
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
    this._router.get('/:username', this.holdersController.get);
  }

  public get router(): Router {
    return this._router;
  }
}
