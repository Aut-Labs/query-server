import express from "express";

import helmet from "helmet";
import { injectable } from "inversify";
import { AutRouter, TaskRouter, UserRouter, ZeelyRouter } from "./routers";
import AutSDK from "@aut-labs/sdk";
import { MultiSigner } from "@aut-labs/sdk/dist/models/models";
import { NetworkConfigEnv } from "./models/config";
import { getNetworkConfig } from "./tools/helpers";
import { getSigner } from "./tools/ethers";
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUI = require("swagger-ui-express");
const cors = require("cors");
const PORT = process.env.SERVER_PORT || 3000;
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Aut API",
      version: "1.0.0",
      description: "Aut API Docs",
      servers: [`http://localhost:${PORT}`],
    },
  },
  apis: [
    "./src/routers/aut.routes.ts",
    "./src/routers/task.routes.ts",
    "./src/routers/user.routes.ts",
    "./src/routers/zeely.routes.ts",
  ],
};

const swagger = swaggerJSDoc(swaggerOptions);

@injectable()
export class App {
  private _app: express.Application;

  constructor(
    private autRouter: AutRouter,
    private taskRouter: TaskRouter,
    private userRouter: UserRouter,
    private zeelyRouter: ZeelyRouter
  ) {
    this._app = express();
    this.config();
  }

  public get app(): express.Application {
    return this._app;
  }

  private config(): void {
    this._app.use(bodyParser.urlencoded({ extended: false }));
    this._app.use(bodyParser.json());
    this._app.use(helmet());
    this._app.use(cookieParser());
    this._app.use(cors());
    this._initRoutes();
    this._initSdk();
  }

  private _initRoutes() {
    this._app.use("/api/aut", this.autRouter.router);
    this._app.use("/api/zeely", this.zeelyRouter.router);
    this._app.use("/api/task", this.taskRouter.router);
    this._app.use("/api/user", this.userRouter.router);
    this._app.use("/api/docs", swaggerUI.serve, swaggerUI.setup(swagger));
  }

  private async _initSdk() {
    const sdk = new AutSDK({});
    const networkEnv = process.env.NETWORK_ENV as NetworkConfigEnv;
    const networkConfig = getNetworkConfig(networkEnv);
    const signer = getSigner(networkConfig);
    const multiSigner: MultiSigner = {
      readOnlySigner: signer,
      signer,
    };
    await sdk.init(multiSigner, networkConfig.contracts);
  }
}
