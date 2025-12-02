interface SellAuthCheckoutConfig {
  cart: Array<{
    productId: number;
    variantId?: number;
    quantity: number;
  }>;
  shopId: number;
  modal: boolean;
}

interface SellAuthEmbed {
  checkout: (element: HTMLElement | null, config: SellAuthCheckoutConfig) => void;
}

declare global {
  interface Window {
    sellAuthEmbed?: SellAuthEmbed;
  }
}

export {};
