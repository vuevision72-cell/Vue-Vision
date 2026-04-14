'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Search, Loader2, Package } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from '@/components/ui/popover';

interface SearchResult {
  id: number;
  name: string;
  price: number;
  image_urls: string[] | null;
  category: string;
}

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const router = useRouter();

  const searchProducts = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    
    // We can use an RPC function in Supabase to search across multiple tables
    // For now, we'll do it on the client side for simplicity
    const tables = [
      { name: 'eyeglasses', category: 'eyeglasses' },
      { name: 'sunglasses', category: 'sunglasses' },
      { name: 'screen_glasses', category: 'screen-glasses' },
      { name: 'contact_lenses', category: 'contact-lenses' },
    ];

    const allResults: SearchResult[] = [];

    for (const table of tables) {
      const { data, error } = await supabase
        .from(table.name)
        .select('id, name, price, image_urls')
        .ilike('name', `%${searchQuery}%`)
        .limit(5);
        
      if (data) {
        allResults.push(...data.map(item => ({ ...item, category: table.category })));
      }
    }
    
    setResults(allResults);
    setIsLoading(false);
    if(allResults.length > 0) {
        setIsPopoverOpen(true);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      searchProducts(query);
    }, 300); // Debounce search

    return () => {
      clearTimeout(handler);
    };
  }, [query, searchProducts]);

  const handleSelect = (category: string, id: number) => {
    setQuery('');
    setResults([]);
    setIsPopoverOpen(false);
    router.push(`/products/${category}/${id}`);
  };

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverAnchor asChild>
            <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search for products..."
                    className="w-full pl-10"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => { if (results.length > 0) setIsPopoverOpen(true); }}
                />
                {isLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />}
            </div>
        </PopoverAnchor>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            {results.length > 0 ? (
                <div className="max-h-[50vh] overflow-y-auto">
                {results.map((item) => (
                    <div
                    key={`${item.category}-${item.id}`}
                    className="flex items-center gap-4 p-3 hover:bg-accent cursor-pointer"
                    onClick={() => handleSelect(item.category, item.id)}
                    >
                    <div className="relative h-16 w-16 rounded-md overflow-hidden bg-secondary shrink-0">
                        {item.image_urls && item.image_urls[0] ? (
                        <Image src={item.image_urls[0]} alt={item.name} fill className="object-cover" />
                        ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground"><Package/></div>
                        )}
                    </div>
                    <div className="flex-1">
                        <p className="font-medium truncate">{item.name}</p>
                        <p className="text-sm text-primary">₹{item.price.toFixed(2)}</p>
                    </div>
                    </div>
                ))}
                </div>
            ) : !isLoading && query.length >= 2 ? (
                <p className="p-4 text-center text-sm text-muted-foreground">No results found for "{query}"</p>
            ) : null}
        </PopoverContent>
    </Popover>
  );
}
