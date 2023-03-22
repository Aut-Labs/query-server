import { injectable } from "inversify";
import { Router } from "express";
import {
  TaskVerifierController,
} from "../controllers";
import "../passport/passport.config";
import passport from "passport";

@injectable()
export class TaskVerifierRouter {
  private readonly _router: Router;

  constructor(
    private taskVerifierController: TaskVerifierController,
  ) {
    this._router = Router({ strict: true });
    this.init();
  }

  private init(): void {
    // GET

  
    /**
     * @swagger
     * /api/taskVerifier/transaction:
     *   post:
     *     description: Discord token OAuth2.
     *     responses:
     *       200:
     *         description: Success
     *       500:
     *         description: Something went wrong, please try again later.
     */
    this._router.post(
      "/transaction",
      this.taskVerifierController.verifyTransactionTask
    );
  }

  public get router(): Router {
    return this._router;
  }
}
