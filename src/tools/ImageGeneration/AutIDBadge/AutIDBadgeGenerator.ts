import { ContentConfig, SWIDParams, SWIDOutput } from "./Badge.model";
import { LoadImage, ScaleImage } from "./ImageLoader";
import {
  AutMumbaiLabel,
  AutBackgroundSvg,
  AutAvatarGradient,
} from "./SwBackgroundSvg";
import { generateAutSigil } from "../AutSIgilGenerator/SigilGenerator";
import { Canvas, CanvasRenderingContext2D, createCanvas } from "canvas";

const drawCanvasElements = (
  canvas: Canvas,
  ctx: CanvasRenderingContext2D,
  config: ContentConfig
) => {
  const { name, dao, role, timestamp, hash } = config;

  const drawBackground = async () => {
    let image = null;
    image = await AutBackgroundSvg({
      name: name.text,
      hash: hash.text,
      role: role.text,
      dao: dao.text,
      timestamp: timestamp.text,
    });
    ctx.drawImage(image, 27, 0);
  };

  const drawAvatar = async (avatar: Buffer) => {
    const avatarImage = await LoadImage(avatar);
    const maxWidth = 362;
    const maxHeight = 339;
    const { iwScaled, ihScaled } = ScaleImage(maxWidth, maxHeight, avatarImage);

    let offsetX = 0;
    if (iwScaled < maxWidth) {
      offsetX = maxWidth / 2 - iwScaled / 2;
    }
    let offsetY = 0;
    if (ihScaled < maxHeight) {
      offsetY = maxHeight / 2 - ihScaled / 2;
    }
    ctx.drawImage(avatarImage, 99 + offsetX, 112 + offsetY, iwScaled, ihScaled);
  };

  const drawAvatarGradient = async () => {
    let gradient = null;
    gradient = await AutAvatarGradient();
    ctx.drawImage(gradient, 87, 112);
  };

  const drawLabel = async (network: string) => {
    let label = null;
    label = await AutMumbaiLabel(network);
    ctx.drawImage(label, 0, 114);
  };

  const drawSigil = async (hubAddress: string) => {
    const { toBase64 } = await generateAutSigil(hubAddress);
    const sigilImage = await LoadImage(toBase64());
    const { iwScaled, ihScaled } = ScaleImage(245, 245, sigilImage);
    ctx.drawImage(sigilImage, 253, 460, iwScaled, ihScaled);
  };

  return {
    drawBackground,
    drawLabel,
    drawAvatar,
    drawAvatarGradient,
    drawSigil,
  };
};

const defaulConfig = (
  config: ContentConfig,
  avatar: Buffer,
  name: string,
  dao: string,
  role: string,
  timestamp: string,
  hash: string,
  hubAddress: string,
  network: string
): ContentConfig => {
  const WIDTH = config?.width || 530;
  const HEIGHT = config?.height || 737;
  return {
    width: WIDTH,
    height: HEIGHT,
    hubAddress,
    network,
    canvasFont: {
      name: "custom",
      fontFamily: "Helvetica",
      url: "https://fonts.gstatic.com/s/josefinsans/v20/Qw3PZQNVED7rKGKxtqIqX5E-AVSJrOCfjY46_LjQbMZhKSbpUVzEEQ.woff",
    },
    name: {
      fontSize: "40px",
      fontWeight: "400",
      text: name,
      top: HEIGHT - 20,
      color: "#white",
    },
    hash: {
      text: hash,
    },
    timestamp: {
      color: "#white",
      fontWeight: "100",
      fontSize: "14px",
      text: timestamp,
      top: HEIGHT - 190 + 22,
    },
    role: {
      color: "#white",
      fontWeight: "100",
      fontSize: "14px",
      text: role,
      top: HEIGHT - 190 + 22,
    },
    dao: {
      color: "#white",
      fontWeight: "100",
      fontSize: "14px",
      text: dao,
      top: HEIGHT - 190 + 22,
    },
    ...(config || {}),
  };
};

export const AutIDBadgeGenerator = async ({
  avatar,
  tokenId,
  name,
  role,
  dao,
  timestamp,
  hash,
  hubAddress,
  config,
  network,
}: SWIDParams): Promise<SWIDOutput> => {
  config = defaulConfig(
    config,
    avatar,
    name,
    dao,
    role,
    timestamp,
    hash,
    hubAddress,
    network
  );
  const canvas = createCanvas(config.width, config.height);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  // ctx.imageSmoothingQuality = "high";

  canvas.width = config.width;
  canvas.height = config.height;
  const ctxContents = drawCanvasElements(canvas, ctx, config);
  await ctxContents.drawBackground();
  await ctxContents.drawAvatar(avatar);
  await ctxContents.drawAvatarGradient();
  await ctxContents.drawSigil(hubAddress);
  if (network.toLowerCase() !== "mainnet") {
    await ctxContents.drawLabel(network);
  }

  return {
    previewElement: canvas,
    toBase64: () => canvas.toDataURL("image/png"),
    toBuffer: async (filename = "AutID.png", mimeType = "image/png") => {
      return new Promise(async (resolve) => {
        const base64 = canvas.toDataURL("image/png");
        const base64Data = base64.replace(/^data:image\/png;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        // file object to be a of type File
        // const newFileName = "nodejs.png";
        // now buffer contains the contents of the file we just read
        // await fs.writeFile(`./${newFileName}`, buffer, "utf-8");
        resolve(buffer);
      });
    },
  } as SWIDOutput;
};
