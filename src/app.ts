import express from "express";
var bodyParser = require("body-parser");
import helmet from "helmet";
import { injectable } from "inversify";
import { AutIDRouter } from "./routers";
import AutSDK from "@aut-labs-private/sdk";
// const rateLimit = require('express-rate-limit');
// const slowDown = require("express-slow-down");
const cookieParser = require("cookie-parser");
const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUI = require("swagger-ui-express");
var cors = require("cors");
require("dotenv").config();

// const limiter = rateLimit({
// 	windowMs: 15 * 60 * 1000,
// 	max: 100,
// 	standardHeaders: true,
// 	legacyHeaders: false,
// });
// const speedLimiter = slowDown({
//   windowMs: 15 * 60 * 1000,
//   delayAfter: 100,
//   delayMs: 500
// });

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Aut AutID API",
      version: "1.0.0",
      description: "Aut AutID API Docs",
      servers: ["http://localhost:4005"],
    },
  },
  apis: ["./src/routers/autID.router.ts"],
};

const swagger = swaggerJSDoc(swaggerOptions);

@injectable()
export class App {
  private _app: express.Application;

  constructor(private autIDRouter: AutIDRouter) {
    this._app = express();
    this.config();
  }

  public get app(): express.Application {
    return this._app;
  }

  private config(): void {
    // parse application/x-www-form-urlencoded
    this._app.use(bodyParser.urlencoded({ extended: false }));

    // parse application/json
    this._app.use(bodyParser.json());
    // helmet security
    this._app.use(helmet());
    //support application/x-www-form-urlencoded post data
    this._app.use(bodyParser.urlencoded({ extended: false }));

    this._app.use(cookieParser());

    this._app.use(cors());
    // this._app.use(limiter);
    // this._app.use(speedLimiter);

    //Initialize app routes
    this._initRoutes();
    this._initSdk();
  }

  private _initRoutes() {
    this._app.use("/api/autID", this.autIDRouter.router);
    this._app.use("/api/docs", swaggerUI.serve, swaggerUI.setup(swagger));
  }

  private _initSdk() {
    const sdk = new AutSDK({});
  }
}
