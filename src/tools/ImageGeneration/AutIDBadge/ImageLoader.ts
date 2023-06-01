import { Image } from "canvas";

export const LoadImage = (
  url: string | Buffer,
  width: number = null,
  height: number = null
): Promise<Image> => {
  const image = new Image();
  return new Promise<Image>((resolve, reject) => {
    if (width) {
      image.width = width;
    }

    if (height) {
      image.height = height;
    }
    image.onerror = reject;
    image.onload = () => {
      resolve(image);
    };
    // image.crossOrigin = "Anonymous";
    image.src = url;
  });
};

export const ScaleImage = (
  maxWidth: number,
  maxHeight: number,
  image: Image
) => {
  const iw = image.width;
  const ih = image.height;
  const scale = Math.min(maxWidth / iw, maxHeight / ih);
  const iwScaled = iw * scale;
  const ihScaled = ih * scale;
  return { iwScaled, ihScaled };
};
