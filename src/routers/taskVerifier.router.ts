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
     *     description: Verifies and finalizes transaction task
     *     responses:
     *       200:
     *         description: Success
     *       500:
     *         description: Something went wrong, please try again later.
     */
    this._router.post(
      "/transaction",
      // passport.authenticate("jwt", { session: false }),
      this.taskVerifierController.verifyTransactionTask
    );


    /**
     * @swagger
     * /api/taskVerifier/quiz:
     *   post:
     *     description: Verifies and finalizes quiz task
     *     responses:
     *       200:
     *         description: Success
     *       500:
     *         description: Something went wrong, please try again later.
     */
    this._router.post(
      "/quiz",
      // passport.authenticate("jwt", { session: false }),
      this.taskVerifierController.verifyQuizTask
    );

    /**
     * @swagger
     * /api/taskVerifier/discordJoin:
     *   post:
     *     description: Verifies and finalizes discord join task
     *     responses:
     *       200:
     *         description: Success
     *       500:
     *         description: Something went wrong, please try again later.
     */
    this._router.post(
      "/discordJoin",
      // passport.authenticate("jwt", { session: false }),
      this.taskVerifierController.verifyDiscordJoinTask
    );
  }

  public get router(): Router {
    return this._router;
  }
}
