export interface PricePoint {
  month: string;
  priceINR: number;
  priceUSD: number;
}

export interface PriceAnalysis {
  trend: "increasing" | "decreasing" | "stable";
  percentChange: number;
  bestTimeToBuy: string;
  recommendation: string;
}

export interface ProductSpecifications {
  brand: string;
  model: string;
  description: string;
  imageUrl: string;
}

export interface ProductPriceData {
  productName: string;
  category: string;
  currentPriceINR: number;
  currentPriceUSD: number;
  priceHistory: PricePoint[];
  predictedPrices: PricePoint[];
  priceAnalysis: PriceAnalysis;
  specifications: ProductSpecifications;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export type Currency = "INR" | "USD";

export interface WatchlistItem {
  id: string;
  user_id: string;
  product_name: string;
  product_category: string;
  product_image: string | null;
  current_price_inr: number | null;
  current_price_usd: number | null;
  created_at: string;
}

export interface PriceAlert {
  id: string;
  user_id: string;
  product_name: string;
  product_category: string;
  target_price_inr: number;
  target_price_usd: number | null;
  current_price_inr: number | null;
  is_triggered: boolean;
  created_at: string;
}

export interface SearchHistoryItem {
  id: string;
  user_id: string;
  product_name: string;
  product_category: string;
  search_data: ProductPriceData | null;
  created_at: string;
}
