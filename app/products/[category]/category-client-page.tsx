

'use client';

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import ProductCard from "@/components/product-card";
import { categories as allCategories } from "@/lib/placeholder-data";
import type { Category, Product, ContactLens } from "@/lib/types";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Filter, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ScrollArea } from "@/components/ui/scroll-area";

type FilterOption = {
  frameType: string[];
  frameShape: string[];
  gender: string[];
  frameSize: string[];
  priceRange: [number, number];
  brand: string[];
  disposability: string[];
  color: string[];
};

const frameTypes = ["Full Frame", "Rimless", "Half Rim"];
const frameShapes = ["Square", "Round", "Rectangle", "Geometric", "Cat Eye", "Aviator", "Oval"];
const genders = ["Men", "Women", "Unisex", "Kids"];
const frameSizes = ["Narrow", "Medium", "Large"];
const contactLensBrands = ["Bausch & Lomb", "Cooper Vision", "Alcon", "Johnson & Johnson", "Celebration"];
const contactLensDisposability = ["Monthly", "Day & Night", "Daily", "Yearly", "Bi-weekly"];
const contactLensColors = ["Green", "Blue", "Brown", "Turquoise", "Hazel", "Grey"];
const MAX_PRICE = 5000;

export default function CategoryClientPage({ categoryId }: { categoryId: Category['id'] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [products, setProducts] = useState<(Product | ContactLens)[]>([]);
  const [initialProducts, setInitialProducts] = useState<(Product | ContactLens)[]>([]);

  const [filters, setFilters] = useState<FilterOption>({
    frameType: [],
    frameShape: [],
    gender: [],
    frameSize: [],
    priceRange: [0, MAX_PRICE],
    brand: [],
    disposability: [],
    color: [],
  });
  
  const [filteredProducts, setFilteredProducts] = useState<(Product | ContactLens)[]>([]);

  const category = useMemo(() => 
    allCategories.find(c => c.id === categoryId) || { id: 'all', name: 'All Products', description: "Browse all our products" },
    [categoryId]
  );
  
  useEffect(() => {
    // Initialize filters from URL search params
    const getArrayFromParam = (param: string | null) => param ? param.split(',') : [];
    
    setFilters({
        frameType: getArrayFromParam(searchParams.get('frameType')),
        frameShape: getArrayFromParam(searchParams.get('frameShape')),
        gender: getArrayFromParam(searchParams.get('gender')),
        frameSize: getArrayFromParam(searchParams.get('frameSize')),
        brand: getArrayFromParam(searchParams.get('brand')),
        disposability: getArrayFromParam(searchParams.get('disposability')),
        color: getArrayFromParam(searchParams.get('color')),
        priceRange: [
            Number(searchParams.get('minPrice') || 0),
            Number(searchParams.get('maxPrice') || MAX_PRICE)
        ],
    });
  }, [searchParams]);

  useEffect(() => {
    const fetchProducts = async () => {
        let fetchedProducts: (Product | ContactLens)[] = [];
        let query;

        const tableMap = {
            'sunglasses': 'sunglasses',
            'eyeglasses': 'eyeglasses',
            'screen-glasses': 'screen_glasses',
            'contact-lenses': 'contact_lenses'
        };

        const currentTable = tableMap[categoryId as keyof typeof tableMap];

        if (currentTable) {
             query = supabase.from(currentTable).select('*');
        } else if (categoryId === 'kids-glasses') {
             const { data: kidsData, error: kidsError } = await supabase.from('eyeglasses').select('*').eq('gender', 'Kids');
             if (kidsData) {
                fetchedProducts = kidsData.map((p: any) => ({
                    ...p,
                    id: p.id.toString(),
                    slug: p.id.toString(),
                    category: 'kids-glasses',
                    images: p.image_urls,
                    imageId: p.image_urls?.[0] || 'product-5',
                }));
             }
        }
        
        if (query) {
            const { data, error } = await query;
            if (data) {
                 if (categoryId === 'contact-lenses') {
                    fetchedProducts = data as ContactLens[];
                 } else {
                    fetchedProducts = data.map((p: any) => ({
                        ...p,
                        id: p.id.toString(),
                        slug: p.id.toString(),
                        category: categoryId,
                        images: p.image_urls,
                        imageId: p.image_urls?.[0] || 'product-1',
                    }));
                 }
            }
        }
        
        setProducts(fetchedProducts);
        setInitialProducts(fetchedProducts);
        setFilteredProducts(fetchedProducts);
    };
    fetchProducts();
  }, [categoryId]);


  useEffect(() => {
    let productsToFilter = [...initialProducts];

    // Eyewear filters
    if (filters.frameType.length > 0) {
      productsToFilter = productsToFilter.filter(p => 'frame_type' in p && p.frame_type && filters.frameType.includes(p.frame_type));
    }
    if (filters.frameShape.length > 0) {
      productsToFilter = productsToFilter.filter(p => 'frame_shape' in p && p.frame_shape && filters.frameShape.includes(p.frame_shape));
    }
    if (filters.gender.length > 0 && !filters.gender.includes("Kids")) {
        productsToFilter = productsToFilter.filter(p => 'gender' in p && p.gender && filters.gender.includes(p.gender));
    }

    if (filters.frameSize.length > 0) {
      productsToFilter = productsToFilter.filter(p => 'frame_size' in p && p.frame_size && filters.frameSize.includes(p.frame_size));
    }

    // Contact lens filters
    if (filters.brand.length > 0) {
      productsToFilter = productsToFilter.filter(p => 'brand' in p && p.brand && filters.brand.includes(p.brand));
    }
    if (filters.disposability.length > 0) {
      productsToFilter = productsToFilter.filter(p => 'disposability' in p && p.disposability && filters.disposability.includes(p.disposability));
    }
    if (filters.color.length > 0) {
      productsToFilter = productsToFilter.filter(p => 'color' in p && p.color && filters.color.includes(p.color));
    }
    
    // Price range filter should be applied to the result of other filters
    productsToFilter = productsToFilter.filter(p => p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]);

    setFilteredProducts(productsToFilter);
  }, [filters, initialProducts]);

  const handleCheckboxChange = (category: keyof Omit<FilterOption, 'priceRange'>, value: string) => {
    // Special handling for 'Kids' gender filter to navigate
    if (category === 'gender' && value === 'Kids') {
        router.push('/products/kids-glasses');
        return;
    }

    setFilters(prev => {
      const currentValues = prev[category] as string[];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return { ...prev, [category]: newValues };
    });
  };

  const handlePriceChange = (value: number[]) => {
    setFilters(prev => ({ ...prev, priceRange: [value[0], value[1]] }));
  };
  
  const clearFilters = () => {
    setFilters({
      frameType: [],
      frameShape: [],
      gender: [],
      frameSize: [],
      priceRange: [0, MAX_PRICE],
      brand: [],
      disposability: [],
      color: [],
    });
  }

  const isContactLensCategory = categoryId === 'contact-lenses';
  const isKidsCategory = categoryId === 'kids-glasses';
  const isEyewearCategory = ['eyeglasses', 'sunglasses', 'screen-glasses', 'kids-glasses'].includes(categoryId);


  const FilterSidebar = () => (
    <aside className="h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-headline text-2xl">Filters</h2>
        <Button variant="ghost" size="sm" onClick={clearFilters}>Clear All</Button>
      </div>
      <ScrollArea className="h-full pr-4">
        <Accordion type="multiple" defaultValue={isContactLensCategory ? ["brand", "disposability", "color", "price-range"] : ["gender", "frame-shape", "frame-type", "frame-size", "price-range"]} className="w-full">
          {isContactLensCategory ? (
              <>
                  <AccordionItem value="brand">
                      <AccordionTrigger>Brand</AccordionTrigger>
                      <AccordionContent className="space-y-2">
                          {contactLensBrands.map(brand => (
                              <div key={brand} className="flex items-center space-x-2">
                                  <Checkbox id={`filter-brand-${brand}`} checked={filters.brand.includes(brand)} onCheckedChange={() => handleCheckboxChange('brand', brand)} />
                                  <label htmlFor={`filter-brand-${brand}`} className="text-sm">{brand}</label>
                              </div>
                          ))}
                      </AccordionContent>
                  </AccordionItem>
                   <AccordionItem value="disposability">
                      <AccordionTrigger>Disposability</AccordionTrigger>
                      <AccordionContent className="space-y-2">
                          {contactLensDisposability.map(d => (
                              <div key={d} className="flex items-center space-x-2">
                                  <Checkbox id={`filter-disposability-${d}`} checked={filters.disposability.includes(d)} onCheckedChange={() => handleCheckboxChange('disposability', d)} />
                                  <label htmlFor={`filter-disposability-${d}`} className="text-sm">{d}</label>
                              </div>
                          ))}
                      </AccordionContent>
                  </AccordionItem>
                   <AccordionItem value="color">
                      <AccordionTrigger>Color</AccordionTrigger>
                      <AccordionContent className="space-y-2">
                          {contactLensColors.map(c => (
                              <div key={c} className="flex items-center space-x-2">
                                  <Checkbox id={`filter-color-${c}`} checked={filters.color.includes(c)} onCheckedChange={() => handleCheckboxChange('color', c)} />
                                  <label htmlFor={`filter-color-${c}`} className="text-sm">{c}</label>
                              </div>
                          ))}
                      </AccordionContent>
                  </AccordionItem>
              </>
          ) : isEyewearCategory ? (
              <>
                  <AccordionItem value="gender">
                  <AccordionTrigger>Gender</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                      {genders.map(gender => (
                      <div key={gender} className="flex items-center space-x-2">
                          <Checkbox 
                          id={`filter-${gender}`}
                          checked={filters.gender.includes(gender) || (gender === 'Kids' && isKidsCategory)}
                          onCheckedChange={() => handleCheckboxChange('gender', gender)}
                          />
                          <label htmlFor={`filter-${gender}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          {gender}
                          </label>
                      </div>
                      ))}
                  </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="frame-type">
                  <AccordionTrigger>Frame Type</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                      {frameTypes.map(type => (
                      <div key={type} className="flex items-center space-x-2">
                          <Checkbox 
                          id={`filter-${type}`} 
                          checked={filters.frameType.includes(type)}
                          onCheckedChange={() => handleCheckboxChange('frameType', type)}
                          />
                          <label htmlFor={`filter-${type}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          {type}
                          </label>
                      </div>
                      ))}
                  </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="frame-shape">
                  <AccordionTrigger>Frame Shape</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                      {frameShapes.map(shape => (
                      <div key={shape} className="flex items-center space-x-2">
                          <Checkbox 
                          id={`filter-${shape}`} 
                          checked={filters.frameShape.includes(shape)}
                          onCheckedChange={() => handleCheckboxChange('frameShape', shape)}
                          />
                          <label htmlFor={`filter-${shape}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          {shape}
                          </label>
                      </div>
                      ))}
                  </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="frame-size">
                  <AccordionTrigger>Frame Size</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                      {frameSizes.map(size => (
                      <div key={size} className="flex items-center space-x-2">
                          <Checkbox 
                          id={`filter-${size}`}
                          checked={filters.frameSize.includes(size)}
                          onCheckedChange={() => handleCheckboxChange('frameSize', size)}
                          />
                          <label htmlFor={`filter-${size}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          {size}
                          </label>
                      </div>
                      ))}
                  </AccordionContent>
                  </AccordionItem>
              </>
          ) : null}
          <AccordionItem value="price-range">
            <AccordionTrigger>Price Range</AccordionTrigger>
            <AccordionContent>
              <Slider
                defaultValue={[0, MAX_PRICE]}
                value={[filters.priceRange[0], filters.priceRange[1]]}
                max={MAX_PRICE}
                step={100}
                onValueChange={handlePriceChange}
                className="my-4"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>₹{filters.priceRange[0]}</span>
                <span>₹{filters.priceRange[1]}</span>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </ScrollArea>
    </aside>
  );

  const getProductSlug = (product: Product | ContactLens) => {
    return product.id.toString();
  }

  const getProductCategory = (product: Product | ContactLens) => {
    if ('category' in product && product.category) return product.category;
    return 'contact-lenses';
  }

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
            <BreadcrumbPage>{category.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <div className="flex items-baseline justify-between mb-8">
        <div>
            <h1 className="font-headline text-4xl md:text-5xl mb-2">{category.name}</h1>
            <p className="text-lg text-muted-foreground">
              {category.description}
            </p>
        </div>
         <div className="lg:hidden">
           <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline"><Filter className="mr-2"/> Filters</Button>
            </SheetTrigger>
            <SheetContent className="flex flex-col">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>Use the options below to filter the products.</SheetDescription>
              </SheetHeader>
              <ScrollArea className="flex-1 -mx-6">
                <div className="px-6">
                  <FilterSidebar />
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-12">
        <div className="hidden lg:block lg:col-span-1">
          <FilterSidebar />
        </div>
        <main className="lg:col-span-3">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
              {filteredProducts.map((product) => (
                <ProductCard 
                    key={product.id} 
                    product={{
                        ...product,
                        category: getProductCategory(product),
                        slug: getProductSlug(product),
                        imageId: 'product-7', // Fallback for now
                        images: product.image_urls || ['https://picsum.photos/seed/1/600/400'],
                    }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border-2 border-dashed rounded-lg">
              <p className="text-xl font-semibold">No Products Found</p>
              <p className="text-muted-foreground mt-2">Try adjusting your filters to find what you're looking for.</p>
               <Button onClick={clearFilters} className="mt-4">
                <X className="mr-2 h-4 w-4" /> Clear Filters
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
