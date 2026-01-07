import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { useCurrency } from "@/hooks/useCurrency";
import { PricePoint } from "@/lib/types";

interface PriceChartProps {
  priceHistory: PricePoint[];
  predictedPrices: PricePoint[];
  currentPriceINR: number;
  currentPriceUSD: number;
}

export const PriceChart = ({
  priceHistory,
  predictedPrices,
  currentPriceINR,
  currentPriceUSD,
}: PriceChartProps) => {
  const { currency, formatPrice, getPrice } = useCurrency();

  // Combine data for chart
  const chartData = [
    ...priceHistory.map((p) => ({
      month: p.month,
      price: getPrice(p.priceINR, p.priceUSD),
      type: "historical",
    })),
    ...predictedPrices.map((p) => ({
      month: p.month,
      predicted: getPrice(p.priceINR, p.priceUSD),
      type: "predicted",
    })),
  ];

  const currentPrice = getPrice(currentPriceINR, currentPriceUSD);

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
            tickFormatter={(value) =>
              currency === "INR" ? `₹${value.toLocaleString()}` : `$${value.toLocaleString()}`
            }
          />
          <Tooltip
            formatter={(value: number) =>
              currency === "INR"
                ? [`₹${value.toLocaleString("en-IN")}`, "Price"]
                : [`$${value.toLocaleString("en-US")}`, "Price"]
            }
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
          />
          <Legend />
          <ReferenceLine
            y={currentPrice}
            label={{ value: "Current", position: "right" }}
            stroke="hsl(var(--primary))"
            strokeDasharray="5 5"
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
            name="Historical Price"
          />
          <Line
            type="monotone"
            dataKey="predicted"
            stroke="hsl(142, 76%, 36%)"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: "hsl(142, 76%, 36%)", strokeWidth: 2 }}
            name="Predicted Price"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
