import { DiscordController } from "../controllers";
import { Router } from "express";
import { inject, injectable } from "inversify";

// @injectable()
export class DiscordRouter {
  private readonly _router: Router;

  constructor(
    @inject(DiscordController)
    private readonly discordController: DiscordController
  ) {
    this._router = Router({ strict: true });
    this.init();
  }

  private init(): void {
    this._router.post("/gathering", this.discordController.createGathering);
    this._router.post("/get-role", this.discordController.getDiscordRole);
    this._router.post("/poll", this.discordController.createPoll);
    this._router.get("/check/:guildId", this.discordController.checkGuild);
    this._router.get("/address", this.discordController.getBotAddress);
    this._router.post("/guild", this.discordController.createOrUpdateGuild);
    this._router.get(
      "/guild/voiceChannels/:guildId",
      this.discordController.getVoiceChannels
    );
    this._router.get(
      "/guild/textChannels/:guildId",
      this.discordController.getTextChannels
    );
    this._router.post("/getRole", this.discordController.getRole);
    this._router.get(
      "/guild/:daoAddress",
      this.discordController.getGuildByDaoAddress
    );
    this._router.get(
      "/gatherings/:guildId",
      this.discordController.getGatherings
    );
    this._router.get("/polls/:guildId", this.discordController.getPolls);
    this._router.get("/guild/:guildId", this.discordController.getGuildById);
  }

  public get router(): Router {
    return this._router;
  }
}
