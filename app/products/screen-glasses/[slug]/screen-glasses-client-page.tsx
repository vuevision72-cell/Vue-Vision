'use client';

import Image from 'next/image';
import Link from 'next/link';
import { notFound, useRouter } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/use-cart';
import { useUserProfile } from '@/hooks/use-user-profile';
import { ShoppingCart, ShieldCheck, Truck, RotateCw, Wallet, Zap } from 'lucide-react';
import ScreenGlassesConfigurator from '@/components/screen-glasses-configurator';
import type { Product } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function ScreenGlassesClientPage({ product }: { product: Product & { stock_quantity?: number | null, product_specification?: string, return_policy?: string, warranty?: string, cod_available?: boolean, delivery_time?: string, video_url?: string }}) {
  const router = useRouter();
  const { toast } = useToast();
  const { addItem } = useCart();
  const { profile } = useUserProfile([]);

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
    product.images && product.images.length > 0 && product.images[0]?.startsWith('http')
      ? product.images
      : ['https://picsum.photos/seed/1/600/400'];

  const videoUrl = getYouTubeEmbedUrl(product.video_url);

  const handleAddToCart = async () => {
    if (!profile) {
      router.push('/login');
      return;
    }
    // Frame only has no special config, just a base price
    const lensConfig = { type: 'frame_only', name: 'Frame Only', totalPrice: product.price };
    await addItem(product.id.toString(), 1, lensConfig);
    toast({
      title: 'Added to Cart!',
      description: `${product.name} has been added to your cart.`,
    });
  };
  
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
              <Link href="/products/screen-glasses">Screen Glasses</Link>
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
              {productImages.length > 0 ? (
                productImages.map((imgUrl, index) => (
                  <CarouselItem key={index}>
                    <Card className="overflow-hidden">
                      <CardContent className="p-0 aspect-square relative">
                        {imgUrl && (
                          <Image
                            src={imgUrl}
                            alt={`${product.name} - view ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        )}
                         {hasDiscount && (
                            <Badge variant="destructive" className="absolute top-4 left-4 text-base">
                            {discountPercentage}% OFF
                            </Badge>
                        )}
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))
              ) : (
                 <CarouselItem>
                    <Card className="overflow-hidden">
                      <CardContent className="p-0 aspect-square relative bg-secondary flex items-center justify-center">
                        <p className="text-muted-foreground">Image not available</p>
                      </CardContent>
                    </Card>
                  </CarouselItem>
              )}
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
          
          <div className="flex flex-wrap gap-2">
            {product.frameType && <Badge variant="outline">{product.frameType}</Badge>}
            {product.frameShape && (Array.isArray(product.frameShape) ? product.frameShape.map(s => <Badge key={s} variant="outline">{s}</Badge>) : <Badge variant="outline">{product.frameShape}</Badge>)}
            {product.gender && (Array.isArray(product.gender) ? product.gender.map(g => <Badge key={g} variant="outline">{g}</Badge>) : <Badge variant="outline">{product.gender}</Badge>)}
            {product.frameSize && <Badge variant="outline">{product.frameSize}</Badge>}
          </div>

          <div className="flex flex-col gap-4 pt-4">
              <Button size="lg" className="w-full" onClick={handleAddToCart}>
                  <ShoppingCart className="mr-2"/> Add to Cart
              </Button>
              <ScreenGlassesConfigurator product={product} />
          </div>

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
