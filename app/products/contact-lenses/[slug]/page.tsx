
'use client';

import { useState, useEffect } from 'react';
import { useParams, notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from '@/lib/supabase';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import ContactLensConfigurator from "@/components/contact-lens-configurator";
import type { ContactLens } from "@/lib/types";
import { Badge } from '@/components/ui/badge';
import type { Metadata } from 'next';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ShieldCheck, Truck, RotateCw, Wallet, Zap } from 'lucide-react';


type Props = {
  params: { slug: string };
};

async function getProduct(slug: string): Promise<ContactLens | null> {
    const { data, error } = await supabase
        .from("contact_lenses")
        .select("*")
        .eq("id", slug)
        .single();

    if (error || !data) {
        console.error("Error fetching contact lens:", error);
        return null;
    }
    return data as ContactLens;
}

// Note: generateMetadata can't be used in a 'use client' component directly.
// This would need to be moved to a Server Component parent if we need dynamic metadata here.
// For now, a static or less-specific metadata approach might be needed if this page must remain a client component.


function ProductPageSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8">
            <Skeleton className="h-6 w-1/3 mb-8" />
            <div className="grid md:grid-cols-2 gap-12">
                <div>
                    <Skeleton className="w-full aspect-square rounded-lg" />
                </div>
                <div className="space-y-6">
                    <Skeleton className="h-12 w-3/4" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            </div>
        </div>
    )
}

export default function ContactLensPage() {
    const params = useParams();
    const { slug } = params;
    const [product, setProduct] = useState<ContactLens | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProduct = async () => {
            if (!slug) return;
            setIsLoading(true);
            const fetchedProduct = await getProduct(slug as string);
            setProduct(fetchedProduct);
            setIsLoading(false);
        };
        fetchProduct();
    }, [slug]);


  if (isLoading) {
    return <ProductPageSkeleton />;
  }

  if (!product) {
    notFound();
  }
  
  const getYouTubeEmbedUrl = (url: string | null | undefined) => {
    if (!url) return null;
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname === 'youtu.be') {
        return `https://www.youtube.com/embed/${urlObj.pathname.slice(1)}`;
      }
      if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
        const videoId = urlObj.searchParams.get('v');
        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}`;
        }
      }
    } catch (e) {
      console.error("Invalid YouTube URL", e);
      return null;
    }
    return null;
  };

  const productImages =
    product.image_urls && product.image_urls.length > 0
      ? product.image_urls
      : ['https://picsum.photos/seed/20/600/400'];

  const videoUrl = getYouTubeEmbedUrl(product.video_url);

  const hasDiscount = product.mrp && product.mrp > product.price;
  const discountPercentage = hasDiscount ? Math.round(((product.mrp! - product.price) / product.mrp!) * 100) : 0;

  const showStockMessage = product.stock_quantity !== null && product.stock_quantity !== undefined && product.stock_quantity <= 10;


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
            <BreadcrumbLink asChild>
              <Link href="/products/contact-lenses">Contact Lenses</Link>
            </BreadcrumbLink>
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
              {productImages.map((imgUrl, index) => (
                <CarouselItem key={index}>
                  <Card className="overflow-hidden">
                    <CardContent className="p-0 aspect-square relative">
                      <Image
                        src={imgUrl}
                        alt={`${product.name} - view ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                       {hasDiscount && (
                        <Badge variant="destructive" className="absolute top-4 left-4 text-base">
                          {discountPercentage}% OFF
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
              {videoUrl && (
                  <CarouselItem>
                     <Card className="overflow-hidden">
                        <CardContent className="p-0 aspect-square relative">
                           <iframe
                                src={videoUrl}
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                className="w-full h-full"
                            ></iframe>
                        </CardContent>
                     </Card>
                  </CarouselItem>
              )}
            </CarouselContent>
            <CarouselPrevious className="left-4" />
            <CarouselNext className="right-4" />
          </Carousel>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold">{product.name}</h1>
           <div className="flex items-baseline gap-4">
              <p className="text-3xl font-semibold text-primary">
                ₹{product.price.toFixed(2)}
              </p>
              {hasDiscount && (
                <p className="text-xl text-muted-foreground line-through">
                  ₹{product.mrp!.toFixed(2)}
                </p>
              )}
          </div>
          {showStockMessage && (
            <div className="flex items-center gap-2 text-destructive font-semibold text-sm animate-pulse">
                <Zap className="h-4 w-4" />
                Hurry! Only {product.stock_quantity} left in stock!
            </div>
          )}
          <p className="text-muted-foreground text-lg">{product.description}</p>
          
          <ContactLensConfigurator product={product} />

          <Accordion type="single" collapsible className="w-full pt-4">
              {product.product_specification && (
                <AccordionItem value="item-1">
                    <AccordionTrigger>Product Specification</AccordionTrigger>
                    <AccordionContent>
                        <p className="whitespace-pre-wrap">{product.product_specification}</p>
                    </AccordionContent>
                </AccordionItem>
              )}
              {(product.return_policy || product.warranty || product.delivery_time || product.cod_available !== undefined) && (
                <AccordionItem value="item-2">
                    <AccordionTrigger>Delivery & Services</AccordionTrigger>
                    <AccordionContent className="space-y-3">
                        {product.delivery_time && <div className="flex items-center gap-2"><Truck className="h-5 w-5 text-primary" /><span>{product.delivery_time}</span></div>}
                        {product.warranty && <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /><span>{product.warranty}</span></div>}
                        {product.return_policy && <div className="flex items-center gap-2"><RotateCw className="h-5 w-5 text-primary" /><span>{product.return_policy}</span></div>}
                        {product.cod_available !== undefined && <div className="flex items-center gap-2"><Wallet className="h-5 w-5 text-primary" /><span>{product.cod_available ? 'Cash on Delivery Available' : 'Cash on Delivery Not Available'}</span></div>}
                    </AccordionContent>
                </AccordionItem>
              )}
          </Accordion>

        </div>
      </div>
    </div>
  );
}

// Since this is a client component, we cannot use generateMetadata directly.
// We could wrap this in a Server Component if dynamic metadata is required.
// For now, the parent layout's metadata will apply.
