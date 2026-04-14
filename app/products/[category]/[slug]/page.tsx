
'use client';

import Image from "next/image";
import Link from "next/link";
import { useParams, notFound, useRouter } from "next/navigation";
import { products, categories as allCategories } from "@/lib/placeholder-data";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import LensConfigurator from "@/components/lens-configurator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useUserProfile } from "@/hooks/use-user-profile";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { slug, category: categoryId } = params;

  const { toast } = useToast();
  const { addItem } = useCart();
  const { profile } = useUserProfile([]); // Using useUserProfile to get Supabase user

  const product = products.find(p => p.slug === slug && p.category === categoryId);

  if (!product) {
    notFound();
  }

  const category = allCategories.find(c => c.id === product.category);

  const imageIds = product.images || [product.imageId];
  const productImages = imageIds.map(id => PlaceHolderImages.find(p => p.id === id)).filter(Boolean);

  const handleAddToCart = async () => {
    if (!profile) { // Check for Supabase profile
      router.push('/login');
      return;
    }
    await addItem(product.id, 1);
    toast({
      title: "Added to Cart!",
      description: `${product.name} - ₹${product.price.toFixed(2)}`,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb className="mb-8">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            {category && (
              <BreadcrumbLink asChild>
                <Link href={`/products/${category.id}`}>{category.name}</Link>
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{product.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid md:grid-cols-2 gap-12">
        <div>
          <Carousel className="w-full">
            <CarouselContent>
              {productImages.map((img, index) => (
                <CarouselItem key={index}>
                  <Card className="overflow-hidden">
                    <CardContent className="p-0 aspect-square relative">
                      {img && (
                        <Image
                          src={img.imageUrl}
                          alt={`${product.name} - view ${index + 1}`}
                          fill
                          className="object-cover"
                          data-ai-hint={img.imageHint}
                        />
                      )}
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-4" />
            <CarouselNext className="right-4" />
          </Carousel>
        </div>

        <div className="space-y-6">
          <h1 className="font-headline text-4xl md:text-5xl">{product.name}</h1>
          <p className="text-3xl font-semibold text-primary">₹{product.price.toFixed(2)}</p>
          <p className="text-muted-foreground text-lg">{product.description}</p>
          
          <div className="flex flex-col md:flex-row gap-4 pt-4">
            <Button size="lg" className="w-full md:w-auto" onClick={handleAddToCart}>
                <ShoppingCart className="mr-2"/> Add to Cart
            </Button>
            {product.category === 'screen-glasses' && (
              <LensConfigurator product={product} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
