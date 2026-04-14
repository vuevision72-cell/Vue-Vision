'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, PlusCircle, X } from 'lucide-react';
import Image from 'next/image';
import type { Product } from '@/lib/types';

interface HomepageProductSelectorProps {
    section: 'featured_products' | 'top_contact_lenses';
    title: string;
    description: string;
    defaultCategory?: string;
}

const CATEGORIES = [
    { value: 'all', label: 'All Categories' },
    { value: 'eyeglasses', label: 'Eyeglasses' },
    { value: 'sunglasses', label: 'Sunglasses' },
    { value: 'screen-glasses', label: 'Screen Glasses' },
    { value: 'contact-lenses', label: 'Contact Lenses' },
];

export function HomepageProductSelector({ section, title, description, defaultCategory = 'all' }: HomepageProductSelectorProps) {
    const { toast } = useToast();
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState(defaultCategory);

    const fetchAllProducts = useCallback(async () => {
        const productTables = [
            { name: 'eyeglasses', category: 'eyeglasses' },
            { name: 'sunglasses', category: 'sunglasses' },
            { name: 'screen_glasses', category: 'screen-glasses' },
            { name: 'contact_lenses', category: 'contact-lenses' },
        ];
        
        const productPromises = productTables.map(t => supabase.from(t.name).select('*'));
        const results = await Promise.all(productPromises);

        const combinedProducts: Product[] = [];
        results.forEach((res, index) => {
            if (res.data) {
                const category = productTables[index].category;
                res.data.forEach((p: any) => {
                    combinedProducts.push({
                        ...p,
                        id: p.id.toString(),
                        slug: p.id.toString(),
                        category: category,
                        images: p.image_urls,
                    });
                });
            }
        });
        setAllProducts(combinedProducts);
    }, []);

    const fetchSelectedProducts = useCallback(async () => {
        const { data: showcaseData } = await supabase
            .from('homepage_showcased_products')
            .select('*')
            .eq('section', section);
        
        if (showcaseData && showcaseData.length > 0 && allProducts.length > 0) {
            const selectedIds = showcaseData.map(s => s.product_id);
            const selected = allProducts.filter(p => selectedIds.includes(Number(p.id)));
            setSelectedProducts(selected);
        } else {
            setSelectedProducts([]);
        }
    }, [section, allProducts]);

    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            await fetchAllProducts();
            setIsLoading(false);
        }
        loadInitialData();
    }, [fetchAllProducts]);

    useEffect(() => {
        if(allProducts.length > 0) {
            fetchSelectedProducts();
        }
    }, [allProducts, fetchSelectedProducts]);
    
    useEffect(() => {
        let products = [...allProducts];
        if (searchTerm) {
            products = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        if (categoryFilter !== 'all') {
            products = products.filter(p => p.category === categoryFilter);
        }
        setFilteredProducts(products);
    }, [searchTerm, categoryFilter, allProducts]);
    
    const handleAddProduct = (product: Product) => {
        if (!selectedProducts.find(p => p.id === product.id)) {
            setSelectedProducts(prev => [...prev, product]);
        }
    };

    const handleRemoveProduct = (productId: string) => {
        setSelectedProducts(prev => prev.filter(p => p.id !== productId));
    };

    const handleSaveChanges = async () => {
        // 1. Delete all existing entries for this section
        const { error: deleteError } = await supabase
            .from('homepage_showcased_products')
            .delete()
            .eq('section', section);

        if (deleteError) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not clear existing selection.' });
            return;
        }
        
        if (selectedProducts.length === 0) {
             toast({ title: 'Success', description: 'Selection has been cleared.' });
             return;
        }

        // 2. Insert the new selection
        const newEntries = selectedProducts.map((p, index) => ({
            section: section,
            product_id: Number(p.id),
            product_category: p.category,
            display_order: index,
        }));

        const { error: insertError } = await supabase
            .from('homepage_showcased_products')
            .insert(newEntries);

        if (insertError) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to save new selection.' });
        } else {
            toast({ title: 'Success', description: 'Homepage has been updated.' });
        }
    };

    const renderProductItem = (product: Product, isSelected: boolean) => (
        <div key={product.id} className="flex items-center gap-4 p-2 border rounded-lg bg-background">
            <div className="relative h-16 w-16 rounded-md overflow-hidden bg-secondary shrink-0">
                {product.images && product.images[0] ? (
                    <Image src={product.images[0]} alt={product.name} fill className="object-cover"/>
                ) : <div className="h-full w-full bg-muted" />}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{product.name}</p>
                <p className="text-xs text-muted-foreground">{product.category}</p>
            </div>
            <Button
                variant={isSelected ? 'destructive' : 'outline'}
                size="icon"
                onClick={() => isSelected ? handleRemoveProduct(product.id) : handleAddProduct(product)}
            >
                {isSelected ? <X className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
            </Button>
        </div>
    );

    if (isLoading) {
        return <Skeleton className="h-96 w-full" />
    }

    return (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-8">
                <div>
                    <h3 className="font-semibold mb-4">Available Products</h3>
                    <div className="flex gap-2 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search products..." className="pl-8" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {CATEGORIES.map(cat => (
                                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 h-[400px] overflow-y-auto pr-2 border rounded-md p-2">
                        {filteredProducts.map(p => renderProductItem(p, false))}
                    </div>
                </div>
                 <div>
                    <h3 className="font-semibold mb-4">Selected Products for Homepage</h3>
                    <div className="space-y-2 h-[400px] overflow-y-auto pr-2 border rounded-md p-2 bg-secondary">
                        {selectedProducts.length > 0 ? (
                             selectedProducts.map(p => renderProductItem(p, true))
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                <p>Add products from the left panel.</p>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
            <div className="p-6 pt-0">
                 <Button onClick={handleSaveChanges}>Save Changes</Button>
            </div>
        </Card>
    );
}
