import { useState, createContext, useContext, ReactNode } from "react";
import { Currency } from "@/lib/types";

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatPrice: (priceINR: number, priceUSD: number) => string;
  getPrice: (priceINR: number, priceUSD: number) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrency] = useState<Currency>("INR");

  const formatPrice = (priceINR: number, priceUSD: number) => {
    const safeINR = Number.isFinite(priceINR) ? priceINR : 0;
    const safeUSD = Number.isFinite(priceUSD) ? priceUSD : 0;

    if (currency === "INR") {
      return `₹${safeINR.toLocaleString("en-IN")}`;
    }
    return `$${safeUSD.toLocaleString("en-US")}`;
  };

  const getPrice = (priceINR: number, priceUSD: number) => {
    return currency === "INR" ? priceINR : priceUSD;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice, getPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};
