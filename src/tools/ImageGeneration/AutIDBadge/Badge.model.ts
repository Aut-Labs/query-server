import { Canvas } from "canvas";

export interface SWIDParams {
  name: string;
  role: string;
  dao: string;
  timestamp: string;
  hash: string;
  novaAddress: string;
  avatar?: Buffer;
  tokenId?: string;
  canvas?: HTMLCanvasElement;
  config?: ContentConfig;
  network: "mumbai" | "goerli" | "amoy" | "polygon";
}

export interface SWIDOutput {
  previewElement?: Canvas;
  download?: (filename?: string) => void;
  toBase64?: (mimeType?: string) => string;
  toFile?: (filename?: string, mimeType?: string) => Promise<Buffer>;
}

export interface QRConfig {
  text: string;
  logo: string;
  width: number;
  height: number;
  logoSize: number;
  logoWidth: number;
  logoHeight: number;
  logoBorderWidth: number;
  top: number;
}

export interface ContentConfig {
  width: number;
  height: number;
  novaAddress: string;
  network: string;
  canvasFont: {
    name: string;
    url: string;
    fontFamily: string;
  };
  hash: Partial<{
    fontSize?: string;
    fontWeight?: string;
    text: string;
    top?: number;
    color?: string;
  }>;
  name: Partial<{
    fontSize?: string;
    fontWeight?: string;
    text: string;
    top?: number;
    color?: string;
  }>;
  role: Partial<{
    fontSize?: string;
    fontWeight?: string;
    text: string;
    top?: number;
    color?: string;
  }>;
  dao: Partial<{
    fontSize?: string;
    fontWeight?: string;
    text: string;
    top?: number;
    color?: string;
  }>;
  timestamp: Partial<{
    fontSize?: string;
    fontWeight?: string;
    text: string;
    top?: number;
    color?: string;
  }>;
}
