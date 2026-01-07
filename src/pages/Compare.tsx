import { useState } from "react";
import { GitCompare, Plus, X, Loader2, Search } from "lucide-react";
import { Header } from "@/components/Header";
import { CategoryNav } from "@/components/CategoryNav";
import { PriceChart } from "@/components/PriceChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrency } from "@/hooks/useCurrency";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { categories } from "@/lib/categories";
import { ProductPriceData } from "@/lib/types";

const Compare = () => {
  const [products, setProducts] = useState<ProductPriceData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("electronics");
  const [isLoading, setIsLoading] = useState(false);
  const { formatPrice } = useCurrency();
  const { toast } = useToast();

  const addProduct = async () => {
    if (!searchQuery.trim()) return;
    if (products.length >= 4) {
      toast({
        title: "Limit Reached",
        description: "You can compare up to 4 products at a time.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-price-search", {
        body: { productName: searchQuery, category: selectedCategory },
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      setProducts([...products, data]);
      setSearchQuery("");
      toast({
        title: "Added",
        description: `${data.productName} added to comparison.`,
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to fetch product data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <CategoryNav />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <GitCompare className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Compare Products</h1>
            <p className="text-muted-foreground">Compare prices of similar products side by side</p>
          </div>
        </div>

        {/* Add Product Form */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search product to add..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  onKeyDown={(e) => e.key === "Enter" && addProduct()}
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={addProduct} disabled={isLoading || products.length >= 4}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </>
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Add up to 4 products to compare. {products.length}/4 products added.
            </p>
          </CardContent>
        </Card>

        {/* Comparison View */}
        {products.length === 0 ? (
          <div className="text-center py-16">
            <GitCompare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No products to compare</h2>
            <p className="text-muted-foreground">
              Search and add products above to start comparing
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Product Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {products.map((product, index) => (
                <Card key={index} className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={() => removeProduct(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <CardContent className="p-4">
                    <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                      <img
                        src={product.specifications.imageUrl || "/placeholder.svg"}
                        alt={product.productName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder.svg";
                        }}
                      />
                    </div>
                    <Badge variant="secondary" className="mb-2 text-xs">
                      {product.category}
                    </Badge>
                    <h3 className="font-semibold text-foreground text-sm line-clamp-2 mb-2">
                      {product.productName}
                    </h3>
                    <div className="text-xl font-bold text-primary">
                      {formatPrice(product.currentPriceINR, product.currentPriceUSD)}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      <span
                        className={
                          product.priceAnalysis.trend === "decreasing"
                            ? "text-green-500"
                            : product.priceAnalysis.trend === "increasing"
                            ? "text-red-500"
                            : ""
                        }
                      >
                        {product.priceAnalysis.trend === "decreasing" ? "↓" : product.priceAnalysis.trend === "increasing" ? "↑" : "→"}
                        {" "}{Math.abs(product.priceAnalysis.percentChange)}%
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Comparison Table */}
            <Card>
              <CardHeader>
                <CardTitle>Price Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 font-medium text-muted-foreground">Attribute</th>
                        {products.map((p, i) => (
                          <th key={i} className="text-left py-3 font-medium text-foreground">
                            {p.productName.slice(0, 20)}...
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-3 text-muted-foreground">Current Price</td>
                        {products.map((p, i) => (
                          <td key={i} className="py-3 font-semibold text-primary">
                            {formatPrice(p.currentPriceINR, p.currentPriceUSD)}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 text-muted-foreground">Trend</td>
                        {products.map((p, i) => (
                          <td key={i} className="py-3">
                            <Badge
                              variant={
                                p.priceAnalysis.trend === "decreasing"
                                  ? "default"
                                  : p.priceAnalysis.trend === "increasing"
                                  ? "destructive"
                                  : "secondary"
                              }
                              className={p.priceAnalysis.trend === "decreasing" ? "bg-green-500" : ""}
                            >
                              {p.priceAnalysis.trend}
                            </Badge>
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 text-muted-foreground">Change</td>
                        {products.map((p, i) => (
                          <td key={i} className="py-3">
                            {p.priceAnalysis.percentChange}%
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 text-muted-foreground">Best Time to Buy</td>
                        {products.map((p, i) => (
                          <td key={i} className="py-3 text-xs">
                            {p.priceAnalysis.bestTimeToBuy}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3 text-muted-foreground">Recommendation</td>
                        {products.map((p, i) => (
                          <td key={i} className="py-3 text-xs">
                            {p.priceAnalysis.recommendation}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Compare;
