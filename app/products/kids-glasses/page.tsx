
'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ProductCard from "@/components/product-card";
import { Product } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface KidsProducts {
  eyeglasses: Product[];
  sunglasses: Product[];
  screenGlasses: Product[];
}

export default function KidsGlassesPage() {
  const [products, setProducts] = useState<KidsProducts>({
    eyeglasses: [],
    sunglasses: [],
    screenGlasses: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchKidsProducts = async () => {
      setIsLoading(true);
      
      const eyeglassesPromise = supabase.from('eyeglasses').select('*').contains('gender', ['Kids']);
      const sunglassesPromise = supabase.from('sunglasses').select('*').contains('gender', ['Kids']);
      const screenGlassesPromise = supabase.from('screen_glasses').select('*').contains('gender', ['Kids']);

      const [
        { data: eyeglasses, error: eyeglassesError },
        { data: sunglasses, error: sunglassesError },
        { data: screenGlasses, error: screenGlassesError },
      ] = await Promise.all([eyeglassesPromise, sunglassesPromise, screenGlassesPromise]);
      
      if (eyeglassesError || sunglassesError || screenGlassesError) {
          console.error("Error fetching kids products:", eyeglassesError || sunglassesError || screenGlassesError);
      }

      const mapToProduct = (p: any) => ({
          ...p,
          id: p.id.toString(),
          slug: p.id.toString(),
          images: p.image_urls,
          imageId: 'product-5', // fallback
      });

      setProducts({
          eyeglasses: (eyeglasses || []).map(p => mapToProduct(p) as Product),
          sunglasses: (sunglasses || []).map(p => mapToProduct(p) as Product),
          screenGlasses: (screenGlasses || []).map(p => mapToProduct(p) as Product),
      });

      setIsLoading(false);
    };

    fetchKidsProducts();
  }, []);

  const renderProductGrid = (products: Product[], categoryId: string) => (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-8">
        {products.length > 0 ? (
            products.map((product) => (
                <ProductCard key={`${categoryId}-${product.id}`} product={{...product, category: categoryId, slug: product.id.toString() }} />
            ))
        ) : (
             <div className="col-span-full text-center py-16 border-2 border-dashed rounded-lg">
                <p className="text-xl font-semibold">No Products Found</p>
                <p className="text-muted-foreground mt-2">There are currently no kids' {categoryId.replace(/-/g, ' ')} available.</p>
            </div>
        )}
    </div>
  );

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
                <BreadcrumbPage>Kids Glasses</BreadcrumbPage>
            </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>
        <div className="text-center mb-12">
            <h1 className="font-headline text-4xl md:text-5xl mb-2">Kids Collection</h1>
            <p className="text-lg text-muted-foreground">Durable, stylish, and fun frames for the little ones.</p>
        </div>

        {isLoading ? (
            <div className="space-y-12">
                <div>
                    <Skeleton className="h-10 w-full max-w-md mx-auto mb-8" />
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-96 w-full" />)}
                    </div>
                </div>
            </div>
        ) : (
            <Tabs defaultValue="eyeglasses" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-8">
                    <TabsTrigger value="eyeglasses">Eyeglasses</TabsTrigger>
                    <TabsTrigger value="screen-glasses">Screen Glasses</TabsTrigger>
                    <TabsTrigger value="sunglasses">Sunglasses</TabsTrigger>
                </TabsList>
                <TabsContent value="eyeglasses">
                    {renderProductGrid(products.eyeglasses, 'eyeglasses')}
                </TabsContent>
                <TabsContent value="screen-glasses">
                    {renderProductGrid(products.screenGlasses, 'screen-glasses')}
                </TabsContent>
                <TabsContent value="sunglasses">
                    {renderProductGrid(products.sunglasses, 'sunglasses')}
                </TabsContent>
            </Tabs>
        )}
    </div>
  );
}
