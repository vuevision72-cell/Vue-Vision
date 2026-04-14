'use client';

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle, Smartphone, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import ProductCard from "@/components/product-card";
import { Card, CardContent } from "@/components/ui/card";
import type { Product, ContactLens } from "@/lib/types";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Autoplay from "embla-carousel-autoplay";

const heroSlides = [
  { id: "hero-1" },
  { id: "hero-2" },
  { id: "hero-3" },
  { id: "hero-4" },
  { id: "hero-5" },
  { id: "hero-6" },
];

const quickLinks = [
    { name: "Eyeglasses", href: "/products/eyeglasses", imageId: "category-eyeglasses" },
    { name: "Sunglasses", href: "/products/sunglasses", imageId: "category-sunglasses" },
    { name: "Screen Glasses", href: "/products/screen-glasses", imageId: "category-screen-glasses" },
    { name: "Contact Lenses", href: "/products/contact-lenses", imageId: "category-contact-lenses" },
];

const genderLinks = [
    { name: "Men", href: "/products/eyeglasses?gender=Men", imageId: "gender-men"},
    { name: "Women", href: "/products/eyeglasses?gender=Women", imageId: "gender-women"},
    { name: "Kids", href: "/products/kids-glasses", imageId: "gender-kids"},
]

const contactLensBrands = [
  { name: "Bausch & Lomb", imageId: "brand-bausch", href: "/products/contact-lenses?brand=Bausch+%26+Lomb" },
  { name: "Softlens", imageId: "brand-softlens", href: "/products/contact-lenses" },
  { name: "Acuvue", imageId: "brand-acuvue", href: "/products/contact-lenses?brand=Acuvue" },
  { name: "Alcon", imageId: "brand-alcon", href: "/products/contact-lenses?brand=Alcon" },
];

async function getHomepageData() {
    const { data: newEyeglasses } = await supabase.from('eyeglasses').select('*').order('created_at', { ascending: false }).limit(2);
    const { data: newSunglasses } = await supabase.from('sunglasses').select('*').order('created_at', { ascending: false }).limit(1);
    const { data: newScreenGlasses } = await supabase.from('screen_glasses').select('*').order('created_at', { ascending: false }).limit(1);
    
    const allContentIds = [
        ...heroSlides.map(s => s.id), ...heroSlides.map(s => `${s.id}-url`),
        ...quickLinks.map(l => l.imageId), ...genderLinks.map(l => l.imageId), ...contactLensBrands.map(b => b.imageId),
        'offer-banner-1', 'offer-banner-1-mobile',
        'offer-banner-2', 'offer-banner-2-mobile',
        'colored-lenses-banner', 'colored-lenses-banner-mobile',
    ];
    
    const { data: images } = await supabase.from('website_content').select('id, content').in('id', allContentIds);
    
    const { data: showcaseData } = await supabase.from('homepage_showcased_products').select('*');

    const featuredProductIds = (showcaseData || []).filter(s => s.section === 'featured_products').map(s => s.product_id);
    const topContactLensIds = (showcaseData || []).filter(s => s.section === 'top_contact_lenses').map(s => s.product_id);

    const allProductIds = [...new Set([...featuredProductIds, ...topContactLensIds])];
    
    let allProducts: any[] = [];
    if (allProductIds.length > 0) {
        const productTables = ['eyeglasses', 'sunglasses', 'screen_glasses', 'contact_lenses'];
        const productPromises = productTables.map(table => supabase.from(table).select('*').in('id', allProductIds));
        const productResults = await Promise.all(productPromises);
        allProducts = productResults.flatMap((res, index) => res.data ? res.data.map(p => ({...p, category: productTables[index].replace(/_/, '-')})) : []);
    }

    const featuredProducts = featuredProductIds.map(id => allProducts.find(p => p.id === id)).filter(Boolean);
    const topContactLenses = topContactLensIds.map(id => allProducts.find(p => p.id === id)).filter(Boolean);

    const { data: zeroPowerProducts } = await supabase.from('screen_glasses').select('*').order('created_at', { ascending: false }).limit(3);

    const newArrivals = [
      ...(newEyeglasses || []).map(p => ({...p, category: 'eyeglasses'})),
      ...(newSunglasses || []).map(p => ({...p, category: 'sunglasses'})),
      ...(newScreenGlasses || []).map(p => ({...p, category: 'screen-glasses'})),
    ];
    
    const imagesMap = (images || []).reduce((acc, img) => {
        acc[img.id] = img.content;
        return acc;
    }, {} as Record<string, string>);

    return { newArrivals, imagesMap, featuredProducts, topContactLenses, zeroPowerProducts: zeroPowerProducts || [] };
}


const WavySeparator = () => (
    <div className="bg-secondary">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-auto" preserveAspectRatio="none">
            <path fill="hsl(var(--background))" fillOpacity="1" d="M0,224L1440,128L1440,320L0,320Z"></path>
        </svg>
    </div>
)

export default function Home() {
    const [pageData, setPageData] = useState<Awaited<ReturnType<typeof getHomepageData>> | null>(null);
    const autoplayPlugin = useRef(Autoplay({ delay: 2000, stopOnInteraction: false, stopOnLastSnap: false }));


    useEffect(() => {
        const loadData = async () => {
            const data = await getHomepageData();
            setPageData(data);
        };
        loadData();
    }, []);

    if (!pageData) {
        return <div className="min-h-screen"></div>;
    }
    
    const { newArrivals, imagesMap, featuredProducts, topContactLenses, zeroPowerProducts } = pageData;

  const mapToProduct = (p: any, category: string): Product => ({
      ...p,
      id: p.id.toString(),
      slug: p.id.toString(),
      category: category,
      images: p.image_urls,
      imageId: 'product-1' // fallback
  });

  return (
    <div className="bg-background">
      
      <div className="md:hidden">
        <section className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-4 gap-2 md:gap-4">
                {quickLinks.map((link) => (
                    <Link href={link.href} key={link.name} className="text-center group">
                        <div className="relative aspect-square w-full rounded-full overflow-hidden shadow-sm transition-shadow group-hover:shadow-md">
                            <Image
                                src={imagesMap[link.imageId] || 'https://picsum.photos/seed/quicklink/200/200'}
                                alt={link.name}
                                fill
                                className="object-cover transition-transform group-hover:scale-105"
                            />
                        </div>
                        <p className="mt-2 text-xs md:text-sm font-semibold">{link.name}</p>
                    </Link>
                ))}
            </div>
        </section>
      </div>

      {/* Hero Section */}
      <section className="w-full">
        <Carousel 
            opts={{ loop: true, duration: 50 }} 
            plugins={[autoplayPlugin.current]}
            className="w-full"
            onMouseEnter={autoplayPlugin.current.stop}
            onMouseLeave={autoplayPlugin.current.play}
        >
          <CarouselContent>
            {heroSlides.map((slide) => {
                const imageUrl = imagesMap[slide.id];
                const linkUrl = imagesMap[`${slide.id}-url`];
                if (!imageUrl) return null;

                const slideContent = (
                  <div className="relative w-full aspect-video md:aspect-[21/9] flex items-end justify-center text-center text-white pb-8 md:pb-16">
                      <Image
                          src={imageUrl}
                          alt={`Hero slide ${slide.id}`}
                          fill
                          className="object-cover"
                          priority={slide.id === 'hero-1'}
                      />
                  </div>
                );
                
                return (
                    <CarouselItem key={slide.id}>
                        {linkUrl ? <Link href={linkUrl}>{slideContent}</Link> : slideContent}
                    </CarouselItem>
                );
            })}
          </CarouselContent>
        </Carousel>
      </section>
      
      {/* Shop By Gender */}
      <section className="container mx-auto px-4 pt-20 md:pt-24">
        <h2 className="font-headline text-4xl md:text-5xl text-center mb-12">
            Shop Eyeglasses
          </h2>
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-3 gap-8">
                {genderLinks.map(link => (
                    <Link href={link.href} key={link.name}>
                        <Card className="overflow-hidden group border-2 border-transparent hover:border-primary hover:shadow-xl transition-all duration-300">
                            <div className="relative aspect-[3/4]">
                                <Image
                                src={imagesMap[link.imageId] || 'https://picsum.photos/seed/gender/300/400'}
                                alt={link.name}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                            </div>
                            <p className="font-semibold text-center p-3 bg-card">{link.name}</p>
                        </Card>
                    </Link>
                ))}
            </div>
          </div>
      </section>

      {/* New Arrivals Section */}
        <section className="bg-secondary pt-20 md:pt-32 pb-4">
            <WavySeparator />
            <div className="container mx-auto px-4 -mt-20">
                <div className="text-center mb-12">
                    <h2 className="font-headline text-4xl md:text-5xl">New Arrivals</h2>
                    <p className="mt-2 text-muted-foreground text-lg max-w-2xl mx-auto">Check out the latest styles in our collection.</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {newArrivals.map((product) => (
                        <div key={`${product.category}-${product.id}`}>
                            <ProductCard product={mapToProduct(product, product.category)} />
                        </div>
                    ))}
                </div>
            </div>
        </section>

      {/* Offer Banner 1 - Mobile First */}
        <section className="py-20 md:py-32 w-full">
             <div className="container mx-auto px-4">
                <div className="relative rounded-lg overflow-hidden bg-card shadow-lg flex flex-col md:flex-row">
                    <div className="relative h-64 md:h-auto w-full md:w-1/2">
                        <picture>
                            <source media="(max-width: 767px)" srcSet={imagesMap['offer-banner-1-mobile'] || imagesMap['offer-banner-1']} />
                            <source media="(min-width: 768px)" srcSet={imagesMap['offer-banner-1']} />
                            <Image
                                src={imagesMap['offer-banner-1'] || 'https://picsum.photos/seed/offer1/1200/800'}
                                alt="Stylish eyeglasses"
                                fill
                                className="object-cover"
                            />
                        </picture>
                    </div>
                    <div className="flex flex-col items-center md:items-start justify-center p-8 md:p-12 text-center md:text-left w-full md:w-1/2">
                        <h2 className="font-headline text-3xl md:text-4xl">Upgrade Your Vision</h2>
                        <p className="mt-2 text-lg text-muted-foreground">Get up to 50% off on premium lenses when you purchase any frame.</p>
                        <Button size="lg" className="mt-6" asChild>
                            <Link href="/products/eyeglasses">
                            Shop The Offer <ArrowRight className="ml-2" />
                            </Link>
                        </Button>
                    </div>
                </div>
             </div>
        </section>


      {/* Featured Products Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-headline text-4xl md:text-5xl">Featured Products</h2>
             <p className="mt-2 text-muted-foreground text-lg max-w-2xl mx-auto">Handpicked styles for every look.</p>
          </div>
          <Carousel opts={{ align: "start", loop: true }} className="w-full">
            <CarouselContent className="-ml-4">
              {featuredProducts.map((product) => (
                <CarouselItem key={`${product.category}-${product.id}`} className="pl-4 basis-1/2 md:basis-1/3 lg:basis-1/5">
                  <ProductCard product={mapToProduct(product, product.category)} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex" />
            <CarouselNext className="absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex" />
          </Carousel>
        </div>
      </section>

      {/* Offer Banner 2 */}
      <section className="w-full">
        <div className="container mx-auto px-4">
            <div className="relative bg-zinc-800 text-white rounded-lg overflow-hidden">
                <picture>
                    <source media="(max-width: 767px)" srcSet={imagesMap['offer-banner-2-mobile'] || imagesMap['offer-banner-2']} />
                    <source media="(min-width: 768px)" srcSet={imagesMap['offer-banner-2']} />
                    <Image
                        src={imagesMap['offer-banner-2'] || 'https://picsum.photos/seed/offer2/1200/400'}
                        alt="Blue Light Glasses Offer"
                        fill
                        className="object-cover opacity-30"
                    />
                </picture>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 p-8 md:p-16">
                <div className="md:w-1/2 space-y-3">
                <h2 className="font-headline text-3xl md:text-4xl">Work Smarter, Not Harder</h2>
                <p className="text-lg opacity-90">Protect your eyes from digital strain with our advanced Blue-Cut Lenses, starting at just ₹229.</p>
                <ul className="space-y-2 pt-2">
                    <li className="flex items-center gap-2"><CheckCircle className="text-cyan-400" /><span>Reduces eye fatigue</span></li>
                    <li className="flex items-center gap-2"><CheckCircle className="text-cyan-400" /><span>Improves sleep quality</span></li>
                </ul>
                </div>
                <div className="md:w-auto">
                <Button size="lg" variant="secondary" asChild>
                    <Link href="/products/screen-glasses">
                    Explore Blue-Cut Lenses <ArrowRight className="ml-2" />
                    </Link>
                </Button>
                </div>
            </div>
            </div>
        </div>
      </section>

      {/* Contact Lenses Brands Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-headline text-4xl md:text-5xl">Top Contact Lens Brands</h2>
            <p className="mt-2 text-muted-foreground text-lg">Leading brands for comfort, clarity, and performance.</p>
          </div>
          <div className="relative group flex gap-8 overflow-hidden">
                <div className="flex shrink-0 animate-scroll group-hover:pause gap-8">
                    {[...contactLensBrands, ...contactLensBrands].map((brand, index) => (
                        <Link href={brand.href} key={`${brand.name}-${index}`}>
                            <div className="relative h-16 w-32 shrink-0">
                                <Image
                                    src={imagesMap[brand.imageId] || 'https://picsum.photos/seed/brand/300/150'}
                                    alt={brand.name}
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
            
            {topContactLenses.length > 0 && (
                <div className="mt-16">
                     <Carousel opts={{ align: "start" }} className="w-full">
                        <CarouselContent className="-ml-4">
                        {topContactLenses.map((product) => (
                            <CarouselItem key={`top-cl-${product.id}`} className="pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4">
                            <ProductCard product={mapToProduct(product, 'contact-lenses')} />
                            </CarouselItem>
                        ))}
                        </CarouselContent>
                        <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex" />
                        <CarouselNext className="absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex" />
                    </Carousel>
                </div>
            )}

            <div className="text-center mt-12">
                <Button asChild>
                    <Link href="/products/contact-lenses?color=all">Shop Colored Lenses</Link>
                </Button>
            </div>
        </div>
      </section>

       {/* Zero Power Glasses Section */}
       <section className="bg-secondary py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-headline text-4xl md:text-5xl">Zero Power Computer Glasses</h2>
            <p className="mt-2 text-muted-foreground text-lg max-w-2xl mx-auto">Stylish frames with blue-light filtering lenses for non-prescription wear.</p>
          </div>
           <Carousel opts={{ align: "start" }} className="w-full">
            <CarouselContent className="-ml-4">
              {zeroPowerProducts.map((product) => (
                <CarouselItem key={`zero-power-${product.id}`} className="pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4">
                  <ProductCard product={mapToProduct(product, 'screen-glasses')} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex" />
            <CarouselNext className="absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex" />
          </Carousel>
        </div>
      </section>

    </div>
  );
}
