import { FractulAltBoldWoff2Base64, FractulAltBoldWoffBase64 } from './FractulAltBold/base64';
import { FractulAltLightWoff2Base64, FractulAltLightWoffBase64 } from './FractulAltLight/base64';
import { FractulRegularWoff2Base64, FractulRegularWoffBase64 } from './FractulRegular/base64';

export const fonts = `@font-face {
  font-family: 'FractulAltBold';
  src: url(${FractulAltBoldWoff2Base64})
      format('woff2'),
    url(${FractulAltBoldWoffBase64})
      format('woff');
}

@font-face {
  font-family: 'FractulRegular';
  src: url(${FractulRegularWoff2Base64})
      format('woff2'),
    url(${FractulRegularWoffBase64})
      format('woff');
}

@font-face {
  font-family: 'FractulAltLight';
  src: url(${FractulAltLightWoff2Base64})
      format('woff2'),
    url(${FractulAltLightWoffBase64})
      format('woff');
}`;
