const MELI_BASE = 'https://api.mercadolibre.com';
const MELI_SITE = 'MLA'; // Argentina

export interface MercadoLibreProduct {
  id: string;
  title: string;
  price: number;
  currency_id: string;
  thumbnail: string;
  condition: 'new' | 'used';
  permalink: string;
  seller: {
    id: number;
    nickname: string;
  };
  shipping: {
    free_shipping: boolean;
  };
  available_quantity: number;
  sold_quantity: number;
  category_id: string;
}

export interface MercadoLibreSearchResult {
  results: MercadoLibreProduct[];
  paging: {
    total: number;
    offset: number;
    limit: number;
  };
}

class MercadoLibreService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  setTokens(access: string, refresh: string) {
    this.accessToken = access;
    this.refreshToken = refresh;
  }

  private async fetch(path: string, options: RequestInit = {}): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${MELI_BASE}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Error MercadoLibre: ${response.status}`);
    }

    return response.json();
  }

  async searchProducts(query: string, limit = 20, offset = 0): Promise<MercadoLibreSearchResult> {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString(),
      offset: offset.toString(),
    });
    return this.fetch(`/sites/${MELI_SITE}/search?${params}`);
  }

  async getProductDetails(itemId: string): Promise<MercadoLibreProduct> {
    return this.fetch(`/items/${itemId}`);
  }

  async getCategories() {
    return this.fetch(`/sites/${MELI_SITE}/categories`);
  }

  async getCategoryDetails(categoryId: string) {
    return this.fetch(`/categories/${categoryId}`);
  }

  async createListing(product: {
    title: string;
    description: string;
    price: number;
    category_id: string;
    condition: 'new' | 'used';
    pictures: Array<{ source: string }>;
    attributes: Array<{ id: string; value_name: string }>;
  }) {
    return this.fetch(`/items`, {
      method: 'POST',
      body: JSON.stringify({
        ...product,
        currency_id: 'ARS',
        listing_type_id: 'free',
        available_quantity: 1,
      }),
    });
  }

  async updateStock(itemId: string, quantity: number) {
    return this.fetch(`/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ available_quantity: quantity }),
    });
  }

  async getItemFromURL(url: string): Promise<MercadoLibreProduct | null> {
    const match = url.match(/MLA-?(\d+)/i);
    if (!match) return null;
    const itemId = `MLA${match[1]}`;
    try {
      return await this.getProductDetails(itemId);
    } catch {
      return null;
    }
  }
}

export const mercadolibreService = new MercadoLibreService();
