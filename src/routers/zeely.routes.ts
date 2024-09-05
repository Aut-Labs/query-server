import { injectable } from "inversify";
import { Router } from "express";
import { ZeelyController } from "../controllers/zeely.controller";

@injectable()
export class ZeelyRouter {
  private readonly _router: Router;

  constructor(private _zeelyController: ZeelyController) {
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
    /**
     * @swagger
     * /api/zeely/hasDeployed:
     *   post:
     *     summary: Check if a deployment has been made
     *     description: Endpoint to check if a deployment has been made.
     *     tags:
     *       - Zeely
     *     security:
     *       - ApiKeyAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               accounts:
     *                 type: object
     *                 properties:
     *                   wallet:
     *                     type: string
     *                 required:
     *                   - wallet
     *             example:
     *               accounts:
     *                 wallet: "0x123456789abcdef"
     *     responses:
     *       200:
     *         description: Deployment status checked successfully
     *       400:
     *         description: Bad request
     *       401:
     *         description: Unauthorized
     *     headers:
     *       X-Api-Key:
     *         schema:
     *           type: string
     *         required: true
     *         description: The API key for authentication
     */
    this._router.post(
      "/hasDeployed",
      this.validateApiKey,
      this._zeelyController.hasDeployed
    );

    /**
     * @swagger
     * /api/zeely/isAdmin:
     *   post:
     *     summary: Check if the user is an admin
     *     description: Endpoint to check if the user is an admin.
     *     tags:
     *       - Zeely
     *     security:
     *       - ApiKeyAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               accounts:
     *                 type: object
     *                 properties:
     *                   wallet:
     *                     type: string
     *                   hubAddress:
     *                     type: string
     *                 required:
     *                   - wallet
     *             example:
     *               accounts:
     *                 wallet: "0x123456789abcdef"
     *                 hubAddress: "0xabcdef123456789"
     *     responses:
     *       200:
     *         description: Admin status checked successfully
     *       400:
     *         description: Bad request
     *       401:
     *         description: Unauthorized
     *     headers:
     *       X-Api-Key:
     *         schema:
     *           type: string
     *         required: true
     *         description: The API key for authentication
     */
    this._router.post(
      "/isAdmin",
      this.validateApiKey,
      this._zeelyController.isAdmin
    );

    /**
     * @swagger
     * /api/zeely/20members:
     *   post:
     *     summary: Check if there are 20 members
     *     description: Endpoint to check if there are 20 members.
     *     tags:
     *       - Zeely
     *     security:
     *       - ApiKeyAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               accounts:
     *                 type: object
     *                 properties:
     *                   wallet:
     *                     type: string
     *                   hubAddress:
     *                     type: string
     *                 required:
     *                   - wallet
     *                   - hubAddress
     *             example:
     *               accounts:
     *                 wallet: "0x123456789abcdef"
     *                 hubAddress: "0xabcdef123456789"
     *     responses:
     *       200:
     *         description: Member count status checked successfully
     *       400:
     *         description: Bad request
     *       401:
     *         description: Unauthorized
     *     headers:
     *       X-Api-Key:
     *         schema:
     *           type: string
     *         required: true
     *         description: The API key for authentication
     */
    this._router.post(
      "/20members",
      this.validateApiKey,
      this._zeelyController.has20Members
    );

    /**
     * @swagger
     * /api/zeely/50members:
     *   post:
     *     summary: Check if there are 50 members
     *     description: Endpoint to check if there are 50 members.
     *     tags:
     *       - Zeely
     *     security:
     *       - ApiKeyAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               accounts:
     *                 type: object
     *                 properties:
     *                   wallet:
     *                     type: string
     *                   hubAddress:
     *                     type: string
     *                 required:
     *                   - wallet
     *                   - hubAddress
     *             example:
     *               accounts:
     *                 wallet: "0x123456789abcdef"
     *                 hubAddress: "0xabcdef123456789"
     *     responses:
     *       200:
     *         description: Member count status checked successfully
     *       400:
     *         description: Bad request
     *       401:
     *         description: Unauthorized
     *     headers:
     *       X-Api-Key:
     *         schema:
     *           type: string
     *         required: true
     *         description: The API key for authentication
     */
    this._router.post(
      "/50members",
      this.validateApiKey,
      this._zeelyController.has50Members
    );

    /**
     * @swagger
     * /api/zeely/100members:
     *   post:
     *     summary: Check if there are 100 members
     *     description: Endpoint to check if there are 100 members
     *     tags:
     *       - Zeely
     *     security:
     *       - ApiKeyAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               accounts:
     *                 type: object
     *                 properties:
     *                   wallet:
     *                     type: string
     *                   hubAddress:
     *                     type: string
     *                 required:
     *                   - wallet
     *                   - hubAddress
     *             example:
     *               accounts:
     *                 wallet: "0x123456789abcdef"
     *                 hubAddress: "0xabcdef123456789"
     *     responses:
     *       200:
     *         description: Member count status checked successfully
     *       400:
     *         description: Bad request
     *       401:
     *         description: Unauthorized
     *     headers:
     *       X-Api-Key:
     *         schema:
     *           type: string
     *         required: true
     *         description: The API key for authentication
     */
    this._router.post(
      "/100members",
      this.validateApiKey,
      this._zeelyController.has100Members
    );

    /**
     * @swagger
     * /api/zeely/archetype:
     *   post:
     *     summary: Check if an archetype has been added
     *     description: Endpoint to check if an archetype has been added.
     *     tags:
     *       - Zeely
     *     security:
     *       - ApiKeyAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               accounts:
     *                 type: object
     *                 properties:
     *                   wallet:
     *                     type: string
     *                   hubAddress:
     *                     type: string
     *                 required:
     *                   - wallet
     *                   - hubAddress
     *             example:
     *               accounts:
     *                 wallet: "0x123456789abcdef"
     *                 hubAddress: "0xabcdef123456789"
     *     responses:
     *       200:
     *         description: Archetype addition status checked successfully
     *       400:
     *         description: Bad request
     *       401:
     *         description: Unauthorized
     *     headers:
     *       X-Api-Key:
     *         schema:
     *           type: string
     *         required: true
     *         description: The API key for authentication
     */
    this._router.post(
      "/archetype",
      this.validateApiKey,
      this._zeelyController.hasAddedAnArchetype
    );

    /**
     * @swagger
     * /api/zeely/domain:
     *   post:
     *     summary: Check if a domain has been registered
     *     description: Endpoint to check if a domain has been registered.
     *     tags:
     *       - Zeely
     *     security:
     *       - ApiKeyAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               accounts:
     *                 type: object
     *                 properties:
     *                   wallet:
     *                     type: string
     *                   hubAddress:
     *                     type: string
     *                 required:
     *                   - wallet
     *                   - hubAddress
     *             example:
     *               accounts:
     *                 wallet: "0x123456789abcdef"
     *                 hubAddress: "0xabcdef123456789"
     *     responses:
     *       200:
     *         description: Domain registration status checked successfully
     *       400:
     *         description: Bad request
     *       401:
     *         description: Unauthorized
     *     headers:
     *       X-Api-Key:
     *         schema:
     *           type: string
     *         required: true
     *         description: The API key for authentication
     */
    this._router.post(
      "/domain",
      this.validateApiKey,
      this._zeelyController.hasRegisteredADomain
    );
  }

  public get router(): Router {
    return this._router;
  }
}
