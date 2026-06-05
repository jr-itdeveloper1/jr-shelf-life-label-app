import type { ImageSourcePropType } from 'react-native';

const bundledProductImages: Record<string, ImageSourcePropType> = {
  'product-bk001': require('../../assets/products/product-bk001.png'),
  'product-bk002': require('../../assets/products/product-bk002.jpeg'),
  'product-bk003': require('../../assets/products/product-bk003.jpeg'),
  'product-bk004': require('../../assets/products/product-bk004.png'),
  'product-bk005': require('../../assets/products/product-bk005.png'),
  'product-bk006': require('../../assets/products/product-bk006.png'),
  'product-bs001': require('../../assets/products/product-bs001.png'),
  'product-bs002': require('../../assets/products/product-bs002.png'),
  'product-bs003': require('../../assets/products/product-bs003.png'),
  'product-bs004': require('../../assets/products/product-bs004.jpeg'),
  'product-bs005': require('../../assets/products/product-bs005.jpeg'),
  'product-bs006': require('../../assets/products/product-bs006.png'),
  'product-bv001': require('../../assets/products/product-bv001.jpeg'),
  'product-bv002': require('../../assets/products/product-bv002.jpeg'),
  'product-bv003': require('../../assets/products/product-bv003.jpeg'),
  'product-dp001': require('../../assets/products/product-dp001.png'),
  'product-dp002': require('../../assets/products/product-dp002.png'),
  'product-dy001': require('../../assets/products/product-dy001.png'),
  'product-dy002': require('../../assets/products/product-dy002.png'),
  'product-dy003': require('../../assets/products/product-dy003.png'),
  'product-dy004': require('../../assets/products/product-dy004.png'),
  'product-dy005': require('../../assets/products/product-dy005.png'),
  'product-dy006': require('../../assets/products/product-dy006.jpeg'),
  'product-dy007': require('../../assets/products/product-dy007.jpeg'),
  'product-eg001': require('../../assets/products/product-eg001.png'),
  'product-eg002': require('../../assets/products/product-eg002.png'),
  'product-ff001': require('../../assets/products/product-ff001.jpeg'),
  'product-ff002': require('../../assets/products/product-ff002.png'),
  'product-ff003': require('../../assets/products/product-ff003.png'),
  'product-ff004': require('../../assets/products/product-ff004.png'),
  'product-ff005': require('../../assets/products/product-ff005.png'),
  'product-ms001': require('../../assets/products/product-ms001.jpeg'),
  'product-ms002': require('../../assets/products/product-ms002.png'),
  'product-ms003': require('../../assets/products/product-ms003.png'),
  'product-rte001': require('../../assets/products/product-rte001.png'),
  'product-rte002': require('../../assets/products/product-rte002.jpeg'),
  'product-rte003': require('../../assets/products/product-rte003.png'),
  'product-rte004': require('../../assets/products/product-rte004.png'),
  'product-rte005': require('../../assets/products/product-rte005.png'),
  'product-rte006': require('../../assets/products/product-rte006.png'),
  'product-rte007': require('../../assets/products/product-rte007.png'),
  'product-rte008': require('../../assets/products/product-rte008.png'),
  'product-rte009': require('../../assets/products/product-rte009.png'),
  'product-rte010': require('../../assets/products/product-rte010.jpeg'),
  'product-rte011': require('../../assets/products/product-rte011.png'),
  'product-rte012': require('../../assets/products/product-rte012.png'),
  'product-se001': require('../../assets/products/product-se001.jpeg'),
  'product-se002': require('../../assets/products/product-se002.jpeg'),
  'product-se003': require('../../assets/products/product-se003.png'),
  'product-se004': require('../../assets/products/product-se004.png'),
  'product-veg001': require('../../assets/products/product-veg001.jpeg'),
};

export function getProductImageSource(imageUri?: string): ImageSourcePropType | undefined {
  if (!imageUri) {
    return undefined;
  }

  return bundledProductImages[imageUri] ?? { uri: imageUri };
}
