import { Link } from "react-router-dom";
import { categories } from "@/lib/categories";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export const CategoryNav = () => {
  return (
    <div className="bg-muted/30 border-b border-border">
      <div className="container mx-auto px-4">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex py-3 gap-2">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/category/${category.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background border border-border hover:bg-primary hover:text-primary-foreground transition-colors text-sm font-medium"
              >
                <span>{category.icon}</span>
                <span>{category.name}</span>
              </Link>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
};
