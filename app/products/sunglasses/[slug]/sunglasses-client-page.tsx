
"use client";

import { useState, useMemo, useRef, ChangeEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
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
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/use-user-profile";
import type { Sunglass, LensColor, PrescriptionValue } from "@/lib/types";
import SunglassesConfigurator from "@/components/sunglasses-configurator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, ShieldCheck, Truck, RotateCw, Wallet, ShoppingCart, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";


type Prescription = {
  sph: string;
  cyl: string;
  axis: string;
};

const WhatsAppIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 inline-block ml-1"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path
        d="M12.04 2C6.58 2 2.13 6.45 2.13 12c0 1.78.46 3.45 1.28 4.95L2 22l5.25-1.42c1.45.77 3.06 1.18 4.79 1.18h.01c5.46 0 9.9-4.45 9.9-9.9S17.5 2 12.04 2m-1.22 14.88l-.21.12c-1.23.69-2.67.95-4.13.75l-.26-.04-2.88.78.8-2.82-.05-.27c-.3-.82-.46-1.7-.46-2.61 0-4.3 3.49-7.8 7.8-7.8 2.1 0 4.06.83 5.51 2.29s2.29 3.41 2.29 5.51c-.01 4.3-3.5 7.8-7.81 7.8m4.4-3.23c-.22-.11-1.3-.65-1.5-.72s-.35-.11-.5.11-.57.72-.7 1.07-.26.22-.48.11c-.22-.11-.9-.33-1.72-.94-.64-.55-1.06-1.23-1.18-1.45s-.02-.34.1-.45c.1-.11.22-.28.33-.42.11-.14.14-.25.22-.42s.04-.31-.02-.42c-.06-.11-.5-1.2-.68-1.64s-.37-.36-.5-.37c-.12 0-.27-.01-.42-.01s-.4.06-.61.31-.79.78-.79 1.88.81 2.18.92 2.33c.12.15 1.58 2.42 3.83 3.39.54.23.96.36 1.29.47.63.2 1.2.17 1.65.1.5-.08 1.5-.61 1.71-1.2s.21-1.11.15-1.2z"
      />
    </svg>
  );

export type SunglassesConfig = {
  power: "with" | "without" | null;
  prescriptionType: "manual" | "upload" | "whatsapp" | null;
  manualPrescription: {
    right: Prescription;
    left: Prescription;
  };
  prescriptionFile: File | null;
  prescriptionUrl: string | null;
  color: LensColor | null;
  customColorFile: File | null;
  customColorUrl: string | null;
  totalPrice: number;
};

const POWER_COST = 459;
const CUSTOM_COLOR_COST = 459;

export default function SunglassesClientPage({
  product,
  colors,
  prescriptionValues,
  contactInfo,
}: {
  product: Sunglass;
  colors: LensColor[];
  prescriptionValues: {
    sph: PrescriptionValue[];
    cyl: PrescriptionValue[];
    axis: PrescriptionValue[];
  };
  contactInfo: { phone_number: string };
}) {

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

  const hasDiscount = product.mrp && product.mrp > product.price;
  const discountPercentage = hasDiscount ? Math.round(((product.mrp! - product.price) / product.mrp!) * 100) : 0;
  
  const productImages =
    product.image_urls && product.image_urls.length > 0
      ? product.image_urls
      : ['https://picsum.photos/seed/20/600/400'];
      
  const videoUrl = getYouTubeEmbedUrl(product.video_url);

  const showStockMessage = product.stock_quantity !== null && product.stock_quantity !== undefined && product.stock_quantity <= 10;


  return (
    <>
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
                <Link href="/products/sunglasses">Sunglasses</Link>
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
                 <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{product.frame_type}</Badge>
                    {Array.isArray(product.frame_shape) ? (
                    product.frame_shape.map(shape => <Badge key={shape} variant="outline">{shape}</Badge>)
                    ) : (<Badge variant="outline">{product.frame_shape}</Badge>)}
                    {Array.isArray(product.gender) ? (
                    product.gender.map(g => <Badge key={g} variant="outline">{g}</Badge>)
                    ) : (<Badge variant="outline">{product.gender}</Badge>)}
                    <Badge variant="outline">{product.frame_size}</Badge>
                </div>
                <SunglassesConfigurator
                    product={product}
                    colors={colors}
                    prescriptionValues={prescriptionValues}
                    contactInfo={contactInfo}
                />
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
    </>
  );
}
