import { useMemo, useState } from 'react';

import { outlets, products } from '../data/sampleData';
import type { Outlet, Product } from '../domain/models';
import { OutletSelectionScreen } from '../screens/OutletSelectionScreen';
import { ProductDetailScreen } from '../screens/ProductDetailScreen';
import { ProductGridScreen } from '../screens/ProductGridScreen';

type Screen = 'outlets' | 'products' | 'product-detail';

export function RootApp() {
  const [screen, setScreen] = useState<Screen>('outlets');
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);

  const visibleProducts = useMemo(() => {
    if (!selectedOutlet) {
      return [];
    }

    return products.filter((product) => product.source === 'company' || product.outletId === selectedOutlet.id);
  }, [selectedOutlet]);

  if (screen === 'outlets' || !selectedOutlet) {
    return (
      <OutletSelectionScreen
        outlets={outlets}
        onSelectOutlet={(outlet) => {
          setSelectedOutlet(outlet);
          setScreen('products');
        }}
      />
    );
  }

  if (screen === 'product-detail' && selectedProduct) {
    return (
      <ProductDetailScreen
        outlet={selectedOutlet}
        product={selectedProduct}
        quantity={quantity}
        onChangeQuantity={setQuantity}
        onBack={() => setScreen('products')}
      />
    );
  }

  return (
    <ProductGridScreen
      outlet={selectedOutlet}
      products={visibleProducts}
      onChangeOutlet={() => {
        setSelectedOutlet(null);
        setScreen('outlets');
      }}
      onSelectProduct={(product) => {
        setSelectedProduct(product);
        setQuantity(1);
        setScreen('product-detail');
      }}
    />
  );
}
