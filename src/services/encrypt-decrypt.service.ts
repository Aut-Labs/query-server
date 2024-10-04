import { LoggerService } from "../tools/logger.service";
import { injectable } from "inversify";
import EthCrypto from "eth-crypto";
import { SdkContainerService } from "../tools/sdk.container";
import { AuthSig } from "../models/auth-sig";
import { Hub, SDKContractGenericResponse, BaseNFTModel } from "@aut-labs/sdk";

type Roles = "admin" | "member";
type ContractType = "hub" | "autid";

// @TODO: enhance this later
export interface AccessControlCondition {
  parameter: string;
  operator: string;
  value: string;
}

interface Contract {
  contractType: ContractType;
  contractAddress: string;
  conditions: AccessControlCondition[];
}

export interface BaseAccessControl {
  hubAddress: string;
  roles: Roles[]; // if set then only these roles can decrypt the message
  contract?: Contract; // for later use
}

export interface AccessControlWithAddress extends BaseAccessControl {
  address: string; // if set only this address can decrypt the message
}

export type AccessControl = BaseAccessControl | AccessControlWithAddress;

export interface EncryptRequestData {
  autSig: AuthSig;
  message: string;
  accessControl: AccessControl;
}

export interface DecryptRequestData {
  autSig: AuthSig;
  hash: string;
}

export interface EncryptResponseData {
  isSuccess: boolean;
  hash?: string;
  error?: string;
}

export interface DecryptResponseData {
  isSuccess: boolean;
  data?: string;
  error?: string;
}

async function encryptMessage(publicKey: string, message: string) {
  const encrypted = await EthCrypto.encryptWithPublicKey(publicKey, message);
  const encryptedString = EthCrypto.cipher.stringify(encrypted);
  return encryptedString;
}

async function decryptMessage(privateKey: string, encryptedMessage: string) {
  const encryptedObject = EthCrypto.cipher.parse(encryptedMessage);
  const decrypted = await EthCrypto.decryptWithPrivateKey(
    privateKey,
    encryptedObject
  );
  return decrypted;
}

export class EncryptDecryptProperties {
  hash: string;
  accessControl: AccessControl;
  [key: string]: any;

  constructor(data: EncryptDecryptProperties) {
    Object.assign(this, data);

    if (!this.hash) {
      throw new Error("hash is required");
    }

    if (!this.accessControl) {
      throw new Error("accessControl is required");
    }
  }
}

export class EncryptDecryptModel extends BaseNFTModel<EncryptDecryptProperties> {
  constructor(data: Partial<Omit<EncryptDecryptModel, "image">> = {}) {
    const baseData = { ...data } as Partial<
      Omit<BaseNFTModel<EncryptDecryptProperties>, "image">
    >;
    super(baseData as BaseNFTModel<EncryptDecryptProperties>);
    this.properties = new EncryptDecryptProperties(
      data.properties || ({} as EncryptDecryptProperties)
    );
  }
}

@injectable()
export class EncryptDecryptService {
  constructor(
    private loggerService: LoggerService,
    private _sdkService: SdkContainerService
  ) {}

  public encrypt = async ({
    autSig,
    message,
    accessControl,
  }: EncryptRequestData): Promise<EncryptResponseData> => {
    try {
      if (!message) {
        throw new Error("message is required");
      }
      if (typeof message !== "string") {
        throw new Error("message should be a string");
      }

      if (!accessControl) {
        throw new Error("accessControl is required");
      }

      if (!accessControl.roles && !accessControl.hubAddress) {
        throw new Error(
          "accessControl should have either address or roles or hubAddress"
        );
      }

      const address = await this._sdkService.veryifySignature(autSig);
      const publicKey = EthCrypto.publicKeyByPrivateKey(
        this._sdkService.privateKey
      );

      accessControl = {
        ...accessControl,
        address,
      } as AccessControl;

      const _message = JSON.stringify({
        accessControl,
        message,
      });
      const hash = await encryptMessage(publicKey, _message);
      return {
        hash,
        isSuccess: true,
      };
    } catch (e) {
      this.loggerService.error(e);
      return {
        isSuccess: false,
        error: e.message,
      };
    }
  };

  public decrypt = async ({
    autSig,
    hash,
  }: DecryptRequestData): Promise<DecryptResponseData> => {
    try {
      if (!hash) {
        throw new Error("hash is required");
      }
      if (typeof hash !== "string") {
        throw new Error("hash should be a string");
      }

      const address = await this._sdkService.veryifySignature(autSig);
      const _message = await decryptMessage(this._sdkService.privateKey, hash);
      const { accessControl, message } = JSON.parse(_message) as {
        accessControl: AccessControlWithAddress;
        message: string;
      };

      if (accessControl.address?.toLowerCase() === address?.toLowerCase()) {
        return {
          isSuccess: true,
          data: message,
        };
      }

      const hubService = this._sdkService.sdk.initService<Hub>(
        Hub,
        accessControl.hubAddress
      );
      const requests: Promise<SDKContractGenericResponse<boolean>>[] = [];

      for (const role of accessControl.roles) {
        if (role === "admin") {
          requests.push(hubService.contract.admins.isAdmin(address));
        } else if (role === "member") {
          requests.push(hubService.contract.members.isMember(address));
        }
      }
      const responses = await Promise.all(requests);
      const hasAccess = responses.some((response) => response.data);

      if (!hasAccess) {
        return {
          isSuccess: false,
          error: "Unauthorized: Not a member or admin of this hub",
        };
      }

      return {
        isSuccess: true,
        data: message,
      };
    } catch (e) {
      this.loggerService.error(e);
      return {
        isSuccess: false,
        error: e.message,
      };
    }
  };
}
