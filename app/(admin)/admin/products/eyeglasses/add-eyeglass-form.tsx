
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
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ImageUploader } from '@/components/admin/image-uploader';
import type { Eyeglass } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

const frameTypes = ["Full Frame", "Rimless", "Half Rim"];
const frameShapes = ["Square", "Round", "Rectangle", "Geometric", "Cat Eye", "Aviator", "Oval"];
const genders = ["Men", "Women", "Unisex", "Kids"];
const frameSizes = ["Narrow", "Medium", "Wide"];

const eyeglassSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  mrp: z.coerce.number().min(0, 'MRP must be a positive number'),
  price: z.coerce.number().min(0, 'Price must be a positive number'),
  frame_type: z.string().min(1, 'Frame Type is required'),
  frame_shape: z.array(z.string()).refine(value => value.some(item => item), {
    message: "You have to select at least one frame shape.",
  }),
  gender: z.array(z.string()).refine(value => value.some(item => item), {
    message: "You have to select at least one gender.",
  }),
  frame_size: z.string().min(1, 'Frame Size is required'),
  images: z.any(),
  product_specification: z.string().optional(),
  return_policy: z.string().optional(),
  warranty: z.string().optional(),
  cod_available: z.boolean().default(true),
  delivery_time: z.string().optional(),
  video_url: z.string().optional(),
  track_quantity: z.boolean().default(false),
  stock_quantity: z.coerce.number().optional(),
});

type EyeglassFormValues = z.infer<typeof eyeglassSchema>;

interface AddEyeglassFormProps {
  onProductUpdated: () => void;
  existingProduct: Eyeglass | null;
}

export function AddEyeglassForm({ onProductUpdated, existingProduct }: AddEyeglassFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!existingProduct;

  const form = useForm<EyeglassFormValues>({
    resolver: zodResolver(eyeglassSchema),
    defaultValues: {
        name: '',
        description: '',
        mrp: 0,
        price: 0,
        images: [],
        gender: [],
        frame_shape: [],
        product_specification: '',
        return_policy: '',
        warranty: '',
        cod_available: true,
        delivery_time: '',
        video_url: '',
        track_quantity: false,
        stock_quantity: 0,
    }
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
            frame_type: existingProduct.frame_type,
            frame_shape: Array.isArray(existingProduct.frame_shape) ? existingProduct.frame_shape : [],
            gender: Array.isArray(existingProduct.gender) ? existingProduct.gender : [],
            frame_size: existingProduct.frame_size,
            images: [], // Images are handled separately
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
             name: '', description: '', mrp: 0, price: 0, images: [],
             frame_type: '', frame_shape: [], gender: [], frame_size: '',
             product_specification: '', return_policy: '', warranty: '',
             cod_available: true, delivery_time: '', video_url: '',
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


  async function onSubmit(values: EyeglassFormValues) {
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
        const { error } = await supabase.from('eyeglasses').update({
            ...valuesToInsert,
            image_urls: finalImageUrls,
        }).eq('id', existingProduct.id);
        if (error) throw error;
        toast({ title: 'Product Updated', description: `${values.name} has been updated.` });
      } else {
        const { error } = await supabase.from('eyeglasses').insert({
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pr-3">
         <FormField
          control={form.control}
          name="images"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Images</FormLabel>
              <FormControl>
                <ImageUploader
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
        />
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
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="frame_type" render={({ field }) => (
                <FormItem><FormLabel>Frame Type</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select frame type..." /></SelectTrigger></FormControl><SelectContent>{frameTypes.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="frame_size" render={({ field }) => (
                <FormItem><FormLabel>Frame Size</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select frame size..." /></SelectTrigger></FormControl><SelectContent>{frameSizes.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
            )}/>
        </div>
        
        <FormField
          control={form.control}
          name="gender"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Gender</FormLabel>
                <FormDescription>
                  Select all that apply.
                </FormDescription>
              </div>
              <div className="grid grid-cols-2 gap-4">
              {genders.map((item) => (
                <FormField
                  key={item}
                  control={form.control}
                  name="gender"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={item}
                        className="flex flex-row items-start space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(item)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...(field.value || []), item])
                                : field.onChange(
                                    field.value?.filter(
                                      (value) => value !== item
                                    )
                                  )
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {item}
                        </FormLabel>
                      </FormItem>
                    )
                  }}
                />
              ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="frame_shape"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Frame Shape</FormLabel>
                <FormDescription>
                  Select all that apply.
                </FormDescription>
              </div>
              <div className="grid grid-cols-3 gap-4">
              {frameShapes.map((item) => (
                <FormField
                  key={item}
                  control={form.control}
                  name="frame_shape"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={item}
                        className="flex flex-row items-start space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(item)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...(field.value || []), item])
                                : field.onChange(
                                    field.value?.filter(
                                      (value) => value !== item
                                    )
                                  )
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {item}
                        </FormLabel>
                      </FormItem>
                    )
                  }}
                />
              ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

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
                <FormItem><FormLabel>Product Specification</FormLabel><FormControl><Textarea {...field} placeholder="e.g. Material: Acetate, Lens Width: 52mm, Bridge: 18mm..." /></FormControl><FormMessage /></FormItem>
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
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Please wait...
            </>
          ) : (
            isEditMode ? 'Save Changes' : 'Save Product'
          )}
        </Button>
      </form>
    </Form>
  );
}
