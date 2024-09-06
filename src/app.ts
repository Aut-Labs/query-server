import express from "express";
import bodyParser from "body-parser";
import helmet from "helmet";
import { injectable, Container } from "inversify";
import {
  AutIDRouter,
  TaskVerifierRouter,
  ZeelyRouter,
  DiscordRouter,
} from "./routers";
import AutSDK from "@aut-labs/sdk";
import { Client, GatewayIntentBits } from "discord.js";
import { Agenda } from "@hokify/agenda";
import { DiscordController } from "./controllers/discord.controller";
const cookieParser = require("cookie-parser");
const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUI = require("swagger-ui-express");
const cors = require("cors");
require("dotenv").config();

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
  private discordClient: Client;
  private agenda: Agenda;
  private container: Container;

  constructor(
    private autIDRouter: AutIDRouter,
    private taskVerifierRouter: TaskVerifierRouter,
    private zeelyRouter: ZeelyRouter
  ) {
    this._app = express();
    this.container = new Container();
    this.initializeDiscordClient();
    this.initializeAgenda();
    this.initializeDependencies();
    this.config();
  }

  private initializeDiscordClient() {
    this.discordClient = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
      ],
    });
    this.container
      .bind<Client>("DiscordClient")
      .toConstantValue(this.discordClient);
  }

  private initializeAgenda() {
    this.agenda = new Agenda({
      db: { address: process.env.MONGODB_CONNECTION_STRING },
    });
    this.container.bind<Agenda>("Agenda").toConstantValue(this.agenda);
  }

  private initializeDependencies() {
    this.container.bind<DiscordController>(DiscordController).toSelf();
    this.container.bind<DiscordRouter>(DiscordRouter).toSelf();
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
    this._app.use("/api/autID", this.autIDRouter.router);
    this._app.use("/api/zeely", this.zeelyRouter.router);
    this._app.use("/api/taskVerifier", this.taskVerifierRouter.router);
    this._app.use(
      "/api/discord",
      this.container.get<DiscordRouter>(DiscordRouter).router
    );
    this._app.use("/api/docs", swaggerUI.serve, swaggerUI.setup(swagger));
  }

  private _initSdk() {
    const sdk = new AutSDK({});
  }

  public async start(port: number) {
    await this.agenda.start();
    await this.discordClient.login(process.env.DISCORD_BOT_TOKEN);
    this._app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  }
}
