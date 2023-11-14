import { injectable } from "inversify";
import { Router } from "express";
import {
  AutController,
  HoldersController,
  QuizController,
  TempCacheController,
  UserController,
} from "../controllers";
import "../passport/passport.config";
import passport from "passport";
const multer = require("multer");
const upload = multer();

@injectable()
export class AutIDRouter {
  private readonly _router: Router;

  constructor(
    private tempCacheController: TempCacheController,
    private holdersController: HoldersController,
    private autController: AutController,
    private userController: UserController,
    private quizController: QuizController
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
      "/cache/addOrUpdateCache/:cacheKey",
      // passport.authenticate("jwt", { session: false }),
      this.tempCacheController.addOrUpdateCache
    );

    this._router.get(
      "/cache/getDAOData/:novaAddress",
      this.tempCacheController.getDAOBetaProgress
    );

    this._router.get(
      "/cache/getCache/:cacheKey",
      // passport.authenticate("jwt", { session: false }),
      this.tempCacheController.getCache
    );

    this._router.delete(
      "/cache/deleteCache/:cacheKey",
      // passport.authenticate("jwt", { session: false }),
      this.tempCacheController.deleteCache
    );

    this._router.get("/user/note/:address", this.userController.getAddressNote);

    this._router.post("/user/address", this.userController.setAddressNote);

    this._router.post(
      "/user/notes/addresses",
      this.userController.getManyAddressNotes
    );

    this._router.delete(
      "/user/notes/addresses",
      this.userController.deleteManyAddresses
    );

    this._router.post(
      "/user/notes/setmany",
      this.userController.setManyAddresses
    );

    this._router.post(
      "/user/generateBadge",
      upload.any(),
      this.userController.generate
    );

    this._router.get("/user/nonce/:address", this.userController.getUserNonce);

    this._router.get("/user/novas", this.userController.getNovas);
    this._router.get("/user/leaderNovas", this.userController.getLeaderNovas);

    this._router.post("/user/getToken", this.userController.getToken);

    this._router.get(
      "/user/me",
      passport.authenticate("jwt", { session: false }),
      this.userController.getUser
    );

    this._router.post("/quiz", this.quizController.saveQestions);
    this._router.post("/removeQuiz", this.quizController.deleteQestions);

    this._router.get(
      "/quizAnswers/:taskAddress",
      this.quizController.getQuestionsAndAnswers
    );

    this._router.get(
      "/quiz/all",
      this.quizController.getAllQuestionsAndAnswers
    );
  }

  public get router(): Router {
    return this._router;
  }
}
