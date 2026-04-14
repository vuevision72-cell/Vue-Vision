
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type ProductCardProps = {
  product: Product & { stock_quantity?: number | null };
};

export default function ProductCard({ product }: ProductCardProps) {
  const getImageUrl = () => {
    if (Array.isArray(product.images) && product.images.length > 0 && product.images[0]?.startsWith('http')) {
      return product.images[0];
    }
    return 'https://picsum.photos/seed/1/600/400';
  }

  const imageUrl = getImageUrl();
  const imageAlt = product.name;
  
  const hasDiscount = product.mrp && product.mrp > product.price;
  const discountPercentage = hasDiscount ? Math.round(((product.mrp! - product.price) / product.mrp!) * 100) : 0;

  const showStockBadge = product.stock_quantity !== null && product.stock_quantity !== undefined && product.stock_quantity > 0;

  return (
    <Card className="h-full flex flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm group">
      <Link href={`/products/${product.category}/${product.slug}`} className="block overflow-hidden relative">
        <div className="relative aspect-[4/5]">
            <Image
                src={imageUrl}
                alt={imageAlt}
                fill
                className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
            />
        </div>
        {hasDiscount && (
          <Badge variant="destructive" className="absolute top-2 left-2">{discountPercentage}% OFF</Badge>
        )}
        {showStockBadge && (
          <Badge variant="default" className="absolute top-2 right-2 bg-yellow-500 text-black">
            Only {product.stock_quantity} left!
          </Badge>
        )}
      </Link>
      <div className="flex flex-col flex-1 p-3">
        <h3 className="font-semibold text-sm leading-tight flex-1 truncate">{product.name}</h3>
        <div className="mt-1 flex items-baseline gap-2">
            <p className="text-base font-bold text-primary">
            ₹{product.price.toFixed(2)}
            </p>
            {hasDiscount && (
                <p className="text-sm text-muted-foreground line-through">
                ₹{product.mrp!.toFixed(2)}
                </p>
            )}
        </div>
        <Button asChild variant="outline" size="sm" className="w-full mt-2">
          <Link href={`/products/${product.category}/${product.slug}`}>
            View
          </Link>
        </Button>
      </div>
    </Card>
  );
}
