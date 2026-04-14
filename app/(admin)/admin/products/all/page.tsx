
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

type Product = {
  id: number;
  name: string;
  price: number;
  image_urls: string[] | null;
  category: string;
  [key: string]: any; // for other properties
};

const CATEGORIES = [
    { value: 'eyeglasses', label: 'Eyeglasses' },
    { value: 'sunglasses', label: 'Sunglasses' },
    { value: 'screen-glasses', label: 'Screen Glasses' },
    { value: 'contact-lenses', label: 'Contact Lenses' },
];

const ProductDetail = ({ label, value }: { label: string, value: any }) => {
    if (!value) return null;
    return (
        <div className="flex justify-between text-sm">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-medium text-right">{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}</dd>
        </div>
    );
};

export default function AllProductsPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    const fetchAllProducts = async () => {
      setIsLoading(true);

      const productPromises = CATEGORIES.map(cat => 
        supabase.from(cat.value.replace(/-/g, '_')).select('*')
      );

      const results = await Promise.all(productPromises);
      
      const combinedProducts: Product[] = [];
      results.forEach((res, index) => {
        if (res.data) {
          const category = CATEGORIES[index].value;
          res.data.forEach((p: any) => {
            combinedProducts.push({
              ...p,
              category: category,
            });
          });
        }
      });
      
      combinedProducts.sort((a, b) => b.id - a.id);

      setAllProducts(combinedProducts);
      setFilteredProducts(combinedProducts);
      setIsLoading(false);
    };

    fetchAllProducts();
  }, []);

  useEffect(() => {
    let products = [...allProducts];

    if (searchTerm) {
        products = products.filter(product => 
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.id.toString().includes(searchTerm)
        );
    }

    if (categoryFilter !== 'all') {
        products = products.filter(product => product.category === categoryFilter);
    }
    
    setFilteredProducts(products);

  }, [searchTerm, categoryFilter, allProducts]);

  const getCategoryLabel = (value: string) => {
    return CATEGORIES.find(c => c.value === value)?.label || 'Unknown';
  }

  const renderProductDetails = (product: Product) => {
    if (product.category === 'contact-lenses') {
        return (
            <dl className="space-y-2">
                <ProductDetail label="Brand" value={product.brand} />
                <ProductDetail label="Disposability" value={product.disposability} />
                <ProductDetail label="Color" value={product.color} />
                <ProductDetail label="Power Type" value={product.power_type} />
                <ProductDetail label="Has Spherical" value={product.has_spherical} />
                <ProductDetail label="Has Cylindrical" value={product.has_cylindrical} />
                <ProductDetail label="Has Axis" value={product.has_axis} />
                <ProductDetail label="Has Addition Power" value={product.has_ap} />
            </dl>
        )
    }
    return (
        <dl className="space-y-2">
            <ProductDetail label="Frame Type" value={product.frame_type} />
            <ProductDetail label="Frame Shape" value={product.frame_shape} />
            <ProductDetail label="Gender" value={product.gender} />
            <ProductDetail label="Frame Size" value={product.frame_size} />
        </dl>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-3xl">All Products</CardTitle>
        <CardDescription>
          A complete catalog of every product available in your store.
        </CardDescription>
        <div className="flex flex-col md:flex-row gap-4 pt-4">
            <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search by product name or ID..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Filter by category..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg">
          {isLoading && (
            <div className="p-4 space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          )}
          {!isLoading && filteredProducts.length > 0 && (
            <Accordion type="single" collapsible>
              {filteredProducts.map(product => (
                <AccordionItem value={product.id.toString()} key={`${product.category}-${product.id}`}>
                   <AccordionTrigger className="p-4 grid grid-cols-3 md:grid-cols-5 items-center gap-4 hover:bg-muted/50 hover:no-underline">
                        <div className="flex items-center gap-4 col-span-2 md:col-span-2">
                            <div className="relative h-16 w-16 rounded-md overflow-hidden bg-secondary shrink-0">
                                {product.image_urls && product.image_urls[0] ? (
                                    <Image src={product.image_urls[0]} alt={product.name} fill className="object-cover"/>
                                ) : <div className="h-full w-full bg-muted" />}
                            </div>
                            <div className="text-left flex-1">
                                <p className="font-medium truncate">{product.name}</p>
                                <p className="text-xs text-muted-foreground font-mono">ID: {product.id}</p>
                                <div className="md:hidden mt-1">
                                  <Badge variant="outline">{getCategoryLabel(product.category)}</Badge>
                                </div>
                            </div>
                        </div>
                        <div className="hidden md:block">
                            <Badge variant="outline">{getCategoryLabel(product.category)}</Badge>
                        </div>
                        <div className="hidden md:block text-right font-medium">₹{Number(product.price).toFixed(2)}</div>
                        <div className="text-right font-medium md:hidden">₹{Number(product.price).toFixed(2)}</div>
                   </AccordionTrigger>
                   <AccordionContent className="p-4 pt-0 bg-secondary/50">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <h4 className="font-semibold mb-2">Product Details</h4>
                                {renderProductDetails(product)}
                            </div>
                            <div className="block md:hidden">
                                <h4 className="font-semibold mb-2">Category</h4>
                                <Badge variant="outline">{getCategoryLabel(product.category)}</Badge>
                            </div>
                        </div>
                   </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
          {!isLoading && filteredProducts.length === 0 && (
            <div className="h-48 text-center flex flex-col items-center justify-center text-muted-foreground">
              <p className="font-semibold">No products found.</p>
              <p className="text-sm">Try adjusting your search or filter.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
