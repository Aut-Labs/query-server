import { LoggerService } from "../services/logger.service";
import { injectable } from "inversify";
import { Response } from "express";
import { TempCacheModel, TempCache } from "../models/temp-cache";

const parseToMongooseModel = (request: any) => {
  return Object.keys(request || {}).reduce(
    (prev, key) => {
      if (key === "address" || key === "_id" || key === "cacheKey") {
        if (key === "address") {
          prev.result[key] = request[key]?.toLowerCase();
        } else {
          prev.result[key] = request[key];
        }
      } else if (key === "list") {
        const list = request[key].reduce((arrAcc, item) => {
          const { result } = parseToMongooseModel(item);
          arrAcc = [...arrAcc, result];
          return arrAcc;
        }, []);
        prev.result[key] = list;
      } else {
        const value = request[key];
        if (typeof value === "string") {
          prev.result[`attrc${prev.strCount}`] = {
            key,
            value,
          };
          prev.strCount += 1;
        } else {
          prev.result[`attrn${prev.numCount}`] = {
            key,
            value,
          };
          prev.numCount += 1;
        }
      }
      return prev;
    },
    {
      result: {} as TempCache,
      numCount: 1,
      strCount: 1,
    }
  );
};

const parseToResponseModel = (request: TempCache) => {
  return Object.keys(request).reduce((prev, key) => {
    if (key === "address" || key === "_id" || key === "cacheKey") {
      if (key === "address") {
        prev[key] = request[key]?.toLowerCase();
      } else {
        prev[key] = request[key];
      }
    } else if (key === "list") {
      const list = request[key].reduce((arrAcc, item) => {
        const result = parseToResponseModel(item as any);
        arrAcc = [...arrAcc, result];
        return arrAcc;
      }, []);
      prev[key] = list;
    } else if (key.startsWith("attr")) {
      const attr = request[key];
      prev[attr.key] = attr.value;
    }
    return prev;
  }, {});
};

@injectable()
export class TempCacheController {
  constructor(private loggerService: LoggerService) {}

  public getDAOBetaProgress = async (req: any, res: Response) => {
    try {
      const { daoAddress } = req.params;
      let parsedResult = null;
      try {
        const found = await TempCacheModel.find({
          cacheKey: "UserPhases",
        });

        parsedResult = found
          .map((obj) => {
            let updated_object = parseToResponseModel(obj?.toObject());
            updated_object["createdAt"] = obj.createdAt;
            updated_object["updatedAt"] = obj.updatedAt;
            return updated_object;
          })
          .filter((obj) => obj["daoAddress"] === daoAddress);
      } catch (error) {}
      return res.status(200).send(parsedResult);
    } catch (err) {
      this.loggerService.error(err);
      return res
        .status(500)
        .send({ error: "Something went wrong, please try again later." });
    }
  };

  public getCache = async (req: any, res: Response) => {
    try {
      const { cacheKey } = req.params;
      const { address } = req.query;
      let parsedResult = null;
      try {
        const found = await TempCacheModel.findOne({
          address: address.toLowerCase(),
          cacheKey: cacheKey,
        });

        let updated_object = parseToResponseModel(found?.toObject());
        updated_object["createdAt"] = found.createdAt;
        updated_object["updatedAt"] = found.updatedAt;
        parsedResult = updated_object;
      } catch (error) {}
      return res.status(200).send(parsedResult);
    } catch (err) {
      this.loggerService.error(err);
      return res
        .status(500)
        .send({ error: "Something went wrong, please try again later." });
    }
  };

  public deleteCache = async (req: any, res: Response) => {
    try {
      const { cacheKey } = req.params;
      const { address } = req.query;
      const result = await TempCacheModel.deleteOne({
        address: address.toLowerCase(),
        cacheKey,
      });
      return res.status(200).send(result);
    } catch (err) {
      this.loggerService.error(err);
      return res
        .status(500)
        .send({ error: "Something went wrong, please try again later." });
    }
  };

  public addOrUpdateCache = async (req: any, res: Response) => {
    try {
      const { result } = parseToMongooseModel(req.body);
      const { cacheKey } = req.params;

      await TempCacheModel.findOneAndUpdate(
        {
          address: result.address,
          cacheKey,
        },
        result,
        {
          upsert: true,
        }
      );
      const found = await TempCacheModel.findOne({
        address: result.address,
        cacheKey,
      });

      let updated_object = parseToResponseModel(found?.toObject());
      updated_object["createdAt"] = found.createdAt;
      updated_object["updatedAt"] = found.updatedAt;
      return res.status(200).send(updated_object);
    } catch (error) {
      this.loggerService.error(error);
      return res
        .status(500)
        .send({ error: "Something went wrong, please try again later." });
    }
  };
}
