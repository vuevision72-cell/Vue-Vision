
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MoreHorizontal, Trash2, Pencil } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { Eyeglass as ScreenGlass } from '@/lib/types';


interface ScreenGlassesTableProps {
  dataVersion: number;
  onProductDeleted: () => void;
  onEditProduct: (product: ScreenGlass) => void;
  filters: {
    searchTerm: string;
    gender: string;
    frameType: string;
    frameShape: string;
  }
}

export function ScreenGlassesTable({ dataVersion, onProductDeleted, onEditProduct, filters }: ScreenGlassesTableProps) {
  const [allScreenGlasses, setAllScreenGlasses] = useState<ScreenGlass[]>([]);
  const [filteredScreenGlasses, setFilteredScreenGlasses] = useState<ScreenGlass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchScreenGlasses = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('screen_glasses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching screen glasses:', error);
        setAllScreenGlasses([]);
      } else {
        setAllScreenGlasses(data || []);
      }
      setIsLoading(false);
    };

    fetchScreenGlasses();
  }, [dataVersion]); 

  useEffect(() => {
    const lowercasedFilter = filters.searchTerm.toLowerCase();
    const filteredData = allScreenGlasses.filter(item => {
      const searchTermMatch =
        item.name.toLowerCase().includes(lowercasedFilter) ||
        item.id.toString().includes(lowercasedFilter);
      
      const genderMatch = filters.gender === 'all' || (Array.isArray(item.gender) && item.gender.includes(filters.gender));
      const frameTypeMatch = filters.frameType === 'all' || item.frame_type === filters.frameType;
      const frameShapeMatch = filters.frameShape === 'all' || (Array.isArray(item.frame_shape) && item.frame_shape.includes(filters.frameShape));
      
      return searchTermMatch && genderMatch && frameTypeMatch && frameShapeMatch;
    });
    setFilteredScreenGlasses(filteredData);
  }, [filters, allScreenGlasses]);

  const handleDelete = async (productId: number, productName: string) => {
    try {
        const { error } = await supabase
            .from('screen_glasses')
            .delete()
            .eq('id', productId);
        
        if (error) throw error;

        toast({
            title: 'Product Deleted',
            description: `${productName} has been removed from the catalog.`,
        });
        onProductDeleted();

    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Error deleting product',
            description: error.message,
        });
    }
  };

  const ActionsMenu = ({ product }: { product: ScreenGlass }) => (
    <AlertDialog>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button aria-haspopup="true" size="icon" variant="ghost">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Toggle menu</span>
            </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => onEditProduct(product)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <AlertDialogTrigger asChild>
                <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
            </AlertDialogTrigger>
            </DropdownMenuContent>
        </DropdownMenu>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the product "{product.name}" from your catalog.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDelete(product.id, product.name)}>Continue</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
  );

  return (
    <div className="rounded-md border">
        {/* Desktop Table */}
        <div className="hidden md:block">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                    <span className="sr-only">Image</span>
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="hidden md:table-cell text-right">Price</TableHead>
                <TableHead className="text-right">
                    <span className="sr-only">Actions</span>
                </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                    <TableCell className="hidden sm:table-cell">
                        <Skeleton className="h-16 w-16 rounded-md" />
                    </TableCell>
                    <TableCell>
                        <Skeleton className="h-5 w-32" />
                    </TableCell>
                    <TableCell>
                        <div className="flex gap-1">
                            <Skeleton className="h-5 w-16 rounded-full" />
                            <Skeleton className="h-5 w-20 rounded-full" />
                        </div>
                    </TableCell>
                    <TableCell>
                        <Skeleton className="h-5 w-12" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-right">
                        <Skeleton className="h-5 w-12 ml-auto" />
                    </TableCell>
                    <TableCell>
                        <Skeleton className="h-8 w-8 ml-auto" />
                    </TableCell>
                    </TableRow>
                ))}
                {!isLoading && filteredScreenGlasses.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                            No products found for the current filters.
                        </TableCell>
                    </TableRow>
                )}
                {!isLoading && filteredScreenGlasses.map((product) => (
                <TableRow key={product.id}>
                    <TableCell className="hidden sm:table-cell">
                    <div className="relative h-16 w-16 rounded-md overflow-hidden bg-secondary">
                    {product.image_urls && product.image_urls[0] ? (
                        <Image
                        alt={product.name}
                        className="object-cover"
                        fill
                        src={product.image_urls[0]}
                        />
                    ) : <div className="h-full w-full bg-secondary"/>}
                    </div>
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                        <div className="flex flex-wrap gap-1">
                            {Array.isArray(product.frame_shape) && product.frame_shape.map(shape => <Badge key={shape} variant="outline">{shape}</Badge>)}
                            <Badge variant="outline">{product.frame_type}</Badge>
                            {Array.isArray(product.gender) && product.gender.map(g => <Badge key={g} variant="outline">{g}</Badge>)}
                            <Badge variant="outline">{product.frame_size}</Badge>
                        </div>
                    </TableCell>
                    <TableCell>
                      {product.stock_quantity !== null && product.stock_quantity !== undefined ? (
                        <Badge variant={product.stock_quantity > 10 ? 'default' : 'destructive'}>{product.stock_quantity}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not tracked</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-right">
                        {product.mrp && product.mrp > product.price && (
                            <span className="text-sm text-muted-foreground line-through mr-2">₹{product.mrp.toFixed(2)}</span>
                        )}
                        ₹{product.price.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                        <ActionsMenu product={product} />
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </div>

        {/* Mobile Accordion */}
        <div className="md:hidden">
            <Accordion type="single" collapsible>
            {isLoading && Array.from({length: 5}).map((_, i) => <Skeleton key={i} className="h-20 w-full my-2"/>)}
            {!isLoading && filteredScreenGlasses.map(product => (
                <AccordionItem value={product.id.toString()} key={product.id}>
                    <AccordionTrigger className="p-4">
                        <div className="flex items-center gap-4">
                            <div className="relative h-16 w-16 rounded-md overflow-hidden bg-secondary shrink-0">
                                {product.image_urls && product.image_urls[0] ? (
                                    <Image alt={product.name} className="object-cover" fill src={product.image_urls[0]}/>
                                ) : <div className="h-full w-full bg-secondary"/>}
                            </div>
                            <div className="flex-1 text-left">
                                <p className="font-semibold truncate">{product.name}</p>
                                <p className="text-sm font-medium text-primary">
                                    {product.mrp && product.mrp > product.price && (
                                        <span className="text-xs text-muted-foreground line-through mr-2">₹{product.mrp.toFixed(2)}</span>
                                    )}
                                    ₹{product.price.toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 pt-0 bg-secondary/30 space-y-4">
                        <div>
                            <h4 className="font-semibold mb-2">Details</h4>
                            <div className="flex flex-wrap gap-1">
                                {Array.isArray(product.frame_shape) && product.frame_shape.map(shape => <Badge key={shape} variant="outline">{shape}</Badge>)}
                                <Badge variant="outline">{product.frame_type}</Badge>
                                {Array.isArray(product.gender) && product.gender.map(g => <Badge key={g} variant="outline">{g}</Badge>)}
                                <Badge variant="outline">{product.frame_size}</Badge>
                            </div>
                        </div>
                         <div>
                            <h4 className="font-semibold mb-2">Stock</h4>
                            {product.stock_quantity !== null && product.stock_quantity !== undefined ? (
                                <Badge variant={product.stock_quantity > 10 ? 'default' : 'destructive'}>{product.stock_quantity}</Badge>
                            ) : (
                                <span className="text-xs text-muted-foreground">Not tracked</span>
                            )}
                        </div>
                        <div className="flex justify-end">
                            <ActionsMenu product={product} />
                        </div>
                    </AccordionContent>
                </AccordionItem>
            ))}
            {!isLoading && filteredScreenGlasses.length === 0 && (
                <div className="text-center p-8 text-muted-foreground">No products found.</div>
            )}
            </Accordion>
        </div>
    </div>
  );
}
