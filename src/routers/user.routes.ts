import { Router } from "express";
import { UserController } from "../controllers";
import { injectable, inject } from "inversify";
import passport from "passport";
const multer = require("multer");
const upload = multer();

@injectable()
export class UserRouter {
  private readonly _router: Router;

  constructor(@inject(UserController) private userController: UserController) {
    this._router = Router({ strict: true });
    this.init();
  }

  private init(): void {
    /**
     * @swagger
     * /api/user/note/{address}:
     *   get:
     *     summary: Get a note by address
     *     description: Retrieve a specific note based on the given address.
     *     tags:
     *       - User
     *     parameters:
     *       - in: path
     *         name: address
     *         required: true
     *         schema:
     *           type: string
     *         description: The address to retrieve the note for.
     *     responses:
     *       200:
     *         description: Note retrieved successfully
     *       404:
     *         description: Note not found
     */
    this._router.get("/note/:address", this.userController.getAddressNote);

    /**
     * @swagger
     * /api/user/address:
     *   post:
     *     summary: Set a note for an address
     *     description: Set a note for a specific address.
     *     tags:
     *       - User
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               address:
     *                 type: string
     *               note:
     *                 type: string
     *     responses:
     *       200:
     *         description: Note set successfully
     *       400:
     *         description: Bad Request
     */
    this._router.post("/address", this.userController.setAddressNote);

    /**
     * @swagger
     * /api/user/notes/addresses:
     *   post:
     *     summary: Get notes for multiple addresses
     *     description: Retrieve notes for a list of addresses.
     *     tags:
     *       - User
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: array
     *             items:
     *               type: string
     *     responses:
     *       200:
     *         description: Notes retrieved successfully
     *       400:
     *         description: Bad Request
     */
    this._router.post(
      "/notes/addresses",
      this.userController.getManyAddressNotes
    );

    /**
     * @swagger
     * /api/user/notes/addresses:
     *   delete:
     *     summary: Delete multiple address notes
     *     description: Delete notes for multiple addresses.
     *     tags:
     *       - User
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: array
     *             items:
     *               type: string
     *     responses:
     *       200:
     *         description: Notes deleted successfully
     *       400:
     *         description: Bad Request
     */
    this._router.delete(
      "/notes/addresses",
      this.userController.deleteManyAddresses
    );

    /**
     * @swagger
     * /api/user/notes/setmany:
     *   post:
     *     summary: Set notes for multiple addresses
     *     description: Set notes for a list of addresses.
     *     tags:
     *       - User
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: array
     *             items:
     *               type: object
     *               properties:
     *                 address:
     *                   type: string
     *                 note:
     *                   type: string
     *     responses:
     *       200:
     *         description: Notes set successfully
     *       400:
     *         description: Bad Request
     */
    this._router.post("/notes/setmany", this.userController.setManyAddresses);

    /**
     * @swagger
     * /api/user/generateBadge:
     *   post:
     *     summary: Generate a badge
     *     description: Generate a badge with uploaded data.
     *     tags:
     *       - User
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             properties:
     *               files:
     *                 type: array
     *                 items:
     *                   type: string
     *                   format: binary
     *     responses:
     *       200:
     *         description: Badge generated successfully
     *       400:
     *         description: Bad Request
     */
    this._router.post(
      "/generateBadge",
      upload.any(),
      this.userController.generate
    );

    /**
     * @swagger
     * /api/user/generateSigil/{hubAddress}:
     *   get:
     *     summary: Generate a sigil by hub address
     *     description: Generate a sigil for the given hub address.
     *     tags:
     *       - User
     *     parameters:
     *       - in: path
     *         name: hubAddress
     *         required: true
     *         schema:
     *           type: string
     *         description: The hub address to generate the sigil for.
     *     responses:
     *       200:
     *         description: Sigil generated successfully
     *       404:
     *         description: Hub address not found
     */
    this._router.get(
      "/generateSigil/:hubAddress",
      this.userController.generateSigil
    );

    /**
     * @swagger
     * /api/user/nonce/{address}:
     *   get:
     *     summary: Get user nonce by address
     *     description: Retrieve the user nonce for the given address.
     *     tags:
     *       - User
     *     parameters:
     *       - in: path
     *         name: address
     *         required: true
     *         schema:
     *           type: string
     *         description: The address to retrieve the nonce for.
     *     responses:
     *       200:
     *         description: Nonce retrieved successfully
     *       404:
     *         description: Address not found
     */
    this._router.get("/nonce/:address", this.userController.getUserNonce);

    /**
     * @swagger
     * /api/user/getToken:
     *   post:
     *     summary: Get a token
     *     description: Retrieve a token for the user.
     *     tags:
     *       - User
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               address:
     *                 type: string
     *               nonce:
     *                 type: string
     *     responses:
     *       200:
     *         description: Token retrieved successfully
     *       401:
     *         description: Unauthorized
     */
    this._router.post("/getToken", this.userController.getToken);

    /**
     * @swagger
     * /api/user/me:
     *   get:
     *     summary: Get the logged-in user's information
     *     description: Retrieve the information of the currently logged-in user.
     *     tags:
     *       - User
     *     security:
     *       - jwt: []
     *     responses:
     *       200:
     *         description: User information retrieved successfully
     *       401:
     *         description: Unauthorized
     */
    this._router.get(
      "/me",
      passport.authenticate("jwt", { session: false }),
      this.userController.getUser
    );

    /**
     * @swagger
     * /api/user/getReferralCode:
     *   get:
     *     summary: Get a referral code
     *     description: Generate a referral code for the logged-in user.
     *     tags:
     *       - User
     *     security:
     *       - jwt: []
     *     responses:
     *       200:
     *         description: Referral code generated successfully
     *       401:
     *         description: Unauthorized
     */
    this._router.get(
      "/getReferralCode",
      passport.authenticate("jwt", { session: false }),
      this.userController.generateReferralCode
    );

    /**
     * @swagger
     * /api/user/useReferralCode:
     *   get:
     *     summary: Use a referral code
     *     description: Use a referral code to perform an action.
     *     tags:
     *       - User
     *     security:
     *       - jwt: []
     *     responses:
     *       200:
     *         description: Referral code used successfully
     *       401:
     *         description: Unauthorized
     */
    this._router.get(
      "/useReferralCode",
      passport.authenticate("jwt", { session: false }),
      this.userController.useReferralCode
    );

    /**
     * @swagger
     * /api/user/verifyTwitterFollow:
     *   post:
     *     summary: Verify a Twitter follow
     *     description: Verify if the user has followed a specific Twitter account.
     *     tags:
     *       - User
     *     security:
     *       - jwt: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               twitterHandle:
     *                 type: string
     *     responses:
     *       200:
     *         description: Twitter follow verified successfully
     *       401:
     *         description: Unauthorized
     */
    this._router.post(
      "/verifyTwitterFollow",
      passport.authenticate("jwt", { session: false }),
      this.userController.verifyTwitterFollow
    );

    /**
     * @swagger
     * /api/user/verifyHasAddedBio:
     *   get:
     *     summary: Verify if user has added a bio
     *     description: Check if the logged-in user has added a bio to their profile.
     *     tags:
     *       - User
     *     security:
     *       - jwt: []
     *     responses:
     *       200:
     *         description: User bio status verified successfully
     *       401:
     *         description: Unauthorized
     */
    this._router.get(
      "/verifyHasAddedBio",
      passport.authenticate("jwt", { session: false }),
      this.userController.verifyHasAddedBio
    );

    this._router.post("/twitter/me", this.userController.getTwitterMe);
  }

  public get router(): Router {
    return this._router;
  }
}
