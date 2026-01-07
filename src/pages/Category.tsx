import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Search, Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { CategoryNav } from "@/components/CategoryNav";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { categories } from "@/lib/categories";
import { ProductPriceData } from "@/lib/types";

// Sample product suggestions per category
const categorySuggestions: Record<string, string[]> = {
  electronics: ["iPhone 15", "Samsung Galaxy S24", "MacBook Air", "Sony WH-1000XM5", "iPad Pro"],
  "home-appliances": ["LG Refrigerator", "Samsung Washing Machine", "Sony Bravia TV", "Dyson V15", "Philips Air Fryer"],
  grocery: ["Basmati Rice 5kg", "Olive Oil 1L", "Almonds 500g", "Green Tea 100 bags", "Honey 500g"],
  vehicles: ["Honda City", "Maruti Swift", "Royal Enfield Classic 350", "Hero Splendor", "TVS Jupiter"],
  shoes: ["Nike Air Max", "Adidas Ultraboost", "Puma RS-X", "New Balance 574", "Reebok Classic"],
  sports: ["Yonex Badminton Racket", "Nivia Football", "Cosco Cricket Bat", "Decathlon Yoga Mat", "Dumbbells 10kg"],
  fashion: ["Levi's Jeans", "Nike T-Shirt", "Ray-Ban Sunglasses", "Fossil Watch", "Tommy Hilfiger Shirt"],
  beauty: ["The Ordinary Serum", "Maybelline Mascara", "Lakme Foundation", "Cetaphil Moisturizer", "Biotique Face Wash"],
};

const Category = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<ProductPriceData[]>([]);

  const category = categories.find((c) => c.id === categoryId);
  const suggestions = categorySuggestions[categoryId || "electronics"] || [];

  const searchProduct = async (productName: string) => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-price-search", {
        body: { productName, category: categoryId },
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

      setProducts((prev) => {
        // Avoid duplicates
        const exists = prev.some((p) => p.productName === data.productName);
        if (exists) return prev;
        return [data, ...prev];
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchProduct(searchQuery.trim());
      setSearchQuery("");
    }
  };

  if (!category) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Category Not Found</h1>
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <CategoryNav />

      <div className="container mx-auto px-4 py-8">
        {/* Category Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{category.icon}</span>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{category.name}</h1>
              <p className="text-muted-foreground">{category.description}</p>
            </div>
          </div>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={`Search ${category.name.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
          </Button>
        </form>

        {/* Suggestions */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Popular Searches</h2>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                size="sm"
                onClick={() => searchProduct(suggestion)}
                disabled={isLoading}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Analyzing prices with AI...</p>
          </div>
        )}

        {/* Products Grid */}
        {products.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Search Results ({products.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product, index) => (
                <ProductCard
                  key={index}
                  product={product}
                  onClick={() =>
                    navigate(`/search?q=${encodeURIComponent(product.productName)}`)
                  }
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {products.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <span className="text-6xl mb-4 block">{category.icon}</span>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Explore {category.name}
            </h2>
            <p className="text-muted-foreground">
              Search for products or click on popular searches above
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Category;
