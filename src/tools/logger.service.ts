import { injectable } from "inversify";
import { createLogger, transports, Logger, format } from "winston";

@injectable()
export class LoggerService {
  private _logger: Logger;

  public constructor() {
    this._logger = this.createLoggerConfiguration();
  }

  public info(msg: string) {
    return this._logger.info(msg);
  }

  public debug(msg: string) {
    return this._logger.debug(msg);
  }

  public verbose(msg: string) {
    return this._logger.verbose(msg);
  }

  public warn(msg: string) {
    return this._logger.warn(msg);
  }

  public error(msg: any) {
    return this._logger.error(msg);
  }

  private createLoggerConfiguration(): Logger {
    const logger = createLogger({
      level: "verbose",
      format: format.combine(
        format.timestamp({
          format: "YYYY-MM-DD HH:mm:ss",
        }),
        format.json()
      ),
      transports: [
        // Always add console transport
        new transports.Console({
          format: format.combine(
            format.timestamp({
              format: "YYYY-MM-DD HH:mm:ss",
            }),
            format.simple()
          ),
        }),
      ],
    });

    // Only add file transports if we have write permissions
    try {
      logger.add(new transports.File({ filename: "error.log" }));
      logger.add(new transports.File({ filename: "combined.log" }));
    } catch (error) {
      console.warn("Could not initialize file logging:", error);
    }

    return logger;
  }
}

export function formatObject(obj: any): string {
  return JSON.stringify(obj, undefined, 2);
}
