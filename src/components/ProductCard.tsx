import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/hooks/useCurrency";
import { ProductPriceData } from "@/lib/types";

interface ProductCardProps {
  product: ProductPriceData;
  onClick?: () => void;
}

export const ProductCard = ({ product, onClick }: ProductCardProps) => {
  const { formatPrice } = useCurrency();
  const { priceAnalysis } = product;

  const getTrendIcon = () => {
    switch (priceAnalysis.trend) {
      case "increasing":
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case "decreasing":
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendColor = () => {
    switch (priceAnalysis.trend) {
      case "increasing":
        return "text-red-500";
      case "decreasing":
        return "text-green-500";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <Card
      className="hover:shadow-lg transition-all cursor-pointer overflow-hidden"
      onClick={onClick}
    >
      <div className="aspect-square bg-muted flex items-center justify-center">
        <img
          src={product.specifications.imageUrl || "/placeholder.svg"}
          alt={product.productName}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/placeholder.svg";
          }}
        />
      </div>
      <CardContent className="p-4">
        <Badge variant="secondary" className="mb-2 text-xs">
          {product.category}
        </Badge>
        <h3 className="font-semibold text-foreground line-clamp-2 mb-2">
          {product.productName}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-primary">
            {formatPrice(product.currentPriceINR, product.currentPriceUSD)}
          </span>
          <div className="flex items-center gap-1">
            {getTrendIcon()}
            <span className={`text-sm font-medium ${getTrendColor()}`}>
              {Math.abs(priceAnalysis.percentChange)}%
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
          {priceAnalysis.recommendation}
        </p>
      </CardContent>
    </Card>
  );
};
