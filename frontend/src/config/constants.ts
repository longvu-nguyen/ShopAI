export const APP_CONFIG = {
  BRAND_NAME: 'ShopAI',
  TAGLINE: 'Intelligent E-Commerce Platform',
  FREE_SHIPPING_THRESHOLD: 100.0,
  DEFAULT_SHIPPING_FEE: 10.0,
  DEFAULT_PAGE_SIZE: 12,
  CURRENCY_SYMBOL: '$',
  SUPPORT_EMAIL: 'support@shopai.com',
  HOTLINE: '+84 901 234 567',
  STORAGE_KEYS: {
    ACCESS_TOKEN: 'shopai_access_token',
    REFRESH_TOKEN: 'shopai_refresh_token',
    USER: 'shopai_user',
    GUEST_SESSION: 'shopai_guest_session',
    CHAT_SESSION: 'shopai_chat_session',
  },
} as const;

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};
