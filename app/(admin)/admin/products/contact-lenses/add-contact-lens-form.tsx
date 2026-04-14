
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ImageUploader } from '@/components/admin/image-uploader';
import type { ContactLens } from '@/lib/types';
import { Switch } from '@/components/ui/switch';


const contactLensSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  mrp: z.coerce.number().min(0, 'MRP must be a positive number'),
  price: z.coerce.number().min(0, 'Price must be a positive number'),
  images: z.any(),
  brand: z.string().min(1, 'Brand is required'),
  disposability: z.string().min(1, 'Disposability is required'),
  power_type: z.string().min(1, 'Power type is required'),
  colored_lens_power_type: z.string().optional(),
  color: z.string().optional(),
  has_spherical: z.boolean().default(false),
  has_cylindrical: z.boolean().default(false),
  has_axis: z.boolean().default(false),
  has_ap: z.boolean().default(false),
  product_specification: z.string().optional(),
  return_policy: z.string().optional(),
  warranty: z.string().optional(),
  cod_available: z.boolean().default(true),
  delivery_time: z.string().optional(),
  video_url: z.string().optional(),
  track_quantity: z.boolean().default(false),
  stock_quantity: z.coerce.number().optional(),
});

type ContactLensFormValues = z.infer<typeof contactLensSchema>;

interface AddContactLensFormProps {
  onProductUpdated: () => void;
  existingProduct: ContactLens | null;
}

const brands = ["Bausch & Lomb", "Cooper Vision", "Alcon", "Johnson & Johnson", "Celebration"];
const disposabilityOptions = ["Monthly", "Day & Night", "Daily", "Yearly", "Bi-weekly"];
const powerTypes = ["Spherical", "Cylindrical/Toric", "Multifocal/Bifocal", "Colored"];
const colorOptions = ["Green", "Blue", "Brown", "Turquoise", "Hazel", "Grey"];


export function AddContactLensForm({ onProductUpdated, existingProduct }: AddContactLensFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!existingProduct;

  const form = useForm<ContactLensFormValues>({
    resolver: zodResolver(contactLensSchema),
    defaultValues: {
      name: '',
      description: '',
      mrp: 0,
      price: 0,
      images: [],
      brand: '',
      disposability: '',
      power_type: '',
      has_spherical: false,
      has_cylindrical: false,
      has_axis: false,
      has_ap: false,
      product_specification: '',
      return_policy: '',
      warranty: '',
      cod_available: true,
      delivery_time: '',
      video_url: '',
      track_quantity: false,
      stock_quantity: 0,
    },
  });

  const trackQuantity = form.watch('track_quantity');

  useEffect(() => {
    if (existingProduct) {
        const hasStock = existingProduct.stock_quantity !== null && existingProduct.stock_quantity !== undefined;
        form.reset({
            name: existingProduct.name,
            description: existingProduct.description,
            mrp: existingProduct.mrp,
            price: existingProduct.price,
            brand: existingProduct.brand,
            disposability: existingProduct.disposability,
            power_type: existingProduct.power_type,
            colored_lens_power_type: existingProduct.colored_lens_power_type || undefined,
            color: existingProduct.color || undefined,
            has_spherical: existingProduct.has_spherical,
            has_cylindrical: existingProduct.has_cylindrical,
            has_axis: existingProduct.has_axis,
            has_ap: existingProduct.has_ap,
            images: [], // Images handled separately
            product_specification: existingProduct.product_specification || '',
            return_policy: existingProduct.return_policy || '',
            warranty: existingProduct.warranty || '',
            cod_available: existingProduct.cod_available !== false,
            delivery_time: existingProduct.delivery_time || '',
            video_url: existingProduct.video_url || '',
            track_quantity: hasStock,
            stock_quantity: hasStock ? existingProduct.stock_quantity : 0,
        });
    } else {
        form.reset({
            name: '', description: '', mrp: 0, price: 0, images: [], brand: '', disposability: '', power_type: '',
            has_spherical: false, has_cylindrical: false, has_axis: false, has_ap: false, color: undefined, colored_lens_power_type: undefined,
            product_specification: '', return_policy: '', warranty: '', cod_available: true, delivery_time: '', video_url: '',
            track_quantity: false, stock_quantity: 0,
        });
    }
  }, [existingProduct, form]);

  const uploadImages = async (files: File[]): Promise<string[]> => {
    const uploadedImageUrls: string[] = [];

    for (const file of files) {
      const filePath = `products/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('public_uploads')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
      }

      const { data } = supabase.storage
        .from('public_uploads')
        .getPublicUrl(filePath);
      
      if (data.publicUrl) {
        uploadedImageUrls.push(data.publicUrl);
      }
    }
    return uploadedImageUrls;
  };

  async function onSubmit(values: ContactLensFormValues) {
    setIsSubmitting(true);
    try {
      let finalImageUrls = existingProduct?.image_urls || [];
      if (values.images && Array.isArray(values.images) && values.images.length > 0) {
          const uploadedUrls = await uploadImages(values.images);
          finalImageUrls = [...finalImageUrls, ...uploadedUrls];
      }
      
      const { images, track_quantity, ...rest } = values;

      const valuesToInsert = {
        ...rest,
        stock_quantity: track_quantity ? values.stock_quantity : null,
      };

      if (isEditMode) {
         const { error } = await supabase.from('contact_lenses').update({
            ...valuesToInsert,
            image_urls: finalImageUrls,
        }).eq('id', existingProduct.id);
        if (error) throw error;
        toast({ title: 'Product Updated', description: `${values.name} has been updated.` });
      } else {
         const { error } = await supabase.from('contact_lenses').insert({
            ...valuesToInsert,
            image_urls: finalImageUrls,
        });
        if (error) throw error;
        toast({ title: 'Product Created', description: `${values.name} has been added.` });
      }
      
      onProductUpdated();
      form.reset();
      
    } catch (error: any) {
       toast({
        variant: 'destructive',
        title: 'Error saving product',
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pr-3">
         <FormField
          control={form.control}
          name="images"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Images</FormLabel>
              <FormControl>
                <ImageUploader value={field.value} onChange={field.onChange}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem><FormLabel>Product Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="mrp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>MRP (INR)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Selling Price (INR)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="brand" render={({ field }) => (
                <FormItem><FormLabel>Brand</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select brand..." /></SelectTrigger></FormControl><SelectContent>{brands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="disposability" render={({ field }) => (
                <FormItem><FormLabel>Disposability</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select disposability..." /></SelectTrigger></FormControl><SelectContent>{disposabilityOptions.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
            )}/>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="power_type" render={({ field }) => (
                <FormItem><FormLabel>Power Type</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select power type..." /></SelectTrigger></FormControl><SelectContent>{powerTypes.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="color" render={({ field }) => (
                <FormItem><FormLabel>Color</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select color (optional)..." /></SelectTrigger></FormControl><SelectContent>{colorOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
            )}/>
        </div>
        <div>
          <FormLabel>Available Prescription Fields</FormLabel>
          <FormDescription>Select which fields users can fill out for this lens.</FormDescription>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <FormField control={form.control} name="has_spherical" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">Spherical (SPH)</FormLabel></FormItem>)}/>
            <FormField control={form.control} name="has_cylindrical" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">Cylindrical (CYL)</FormLabel></FormItem>)}/>
            <FormField control={form.control} name="has_axis" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">Axis</FormLabel></FormItem>)}/>
            <FormField control={form.control} name="has_ap" render={({ field }) => (<FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">Addition Power (AP)</FormLabel></FormItem>)}/>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-medium">Inventory</h3>
            <FormField
                control={form.control}
                name="track_quantity"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                        <FormLabel>Track stock quantity</FormLabel>
                        <FormDescription>
                        Enable to manage inventory for this product.
                        </FormDescription>
                    </div>
                    <FormControl>
                        <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        />
                    </FormControl>
                    </FormItem>
                )}
            />
             {trackQuantity && (
                <FormField
                    control={form.control}
                    name="stock_quantity"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Quantity in stock</FormLabel>
                        <FormControl>
                        <Input
                            type="number"
                            placeholder="e.g., 100"
                            {...field}
                            onChange={event => field.onChange(+event.target.value)}
                        />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            )}
        </div>

        <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-medium">Product Specifications & Details</h3>
            <FormField control={form.control} name="product_specification" render={({ field }) => (
                <FormItem><FormLabel>Product Specification</FormLabel><FormControl><Textarea {...field} placeholder="e.g. Base Curve: 8.6mm, Diameter: 14.2mm..." /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="return_policy" render={({ field }) => (
                <FormItem><FormLabel>Return Policy</FormLabel><FormControl><Input {...field} placeholder="e.g. 14 Days Return" /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="warranty" render={({ field }) => (
                <FormItem><FormLabel>Warranty</FormLabel><FormControl><Input {...field} placeholder="e.g. 1 Year Warranty" /></FormControl><FormMessage /></FormItem>
            )}/>
             <FormField control={form.control} name="delivery_time" render={({ field }) => (
                <FormItem><FormLabel>Estimated Delivery Time</FormLabel><FormControl><Input {...field} placeholder="e.g. 3-5 Business Days" /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField
                control={form.control}
                name="video_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>YouTube Video URL</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., https://www.youtube.com/watch?v=..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="cod_available"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                        <FormLabel>Cash on Delivery (COD)</FormLabel>
                        <FormDescription>
                        Is COD available for this product?
                        </FormDescription>
                    </div>
                    <FormControl>
                        <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        />
                    </FormControl>
                    </FormItem>
                )}
            />
        </div>

        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? ( <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait...</> ) : ( isEditMode ? 'Save Changes' : 'Save Product' )}
        </Button>
      </form>
    </Form>
  );
}
