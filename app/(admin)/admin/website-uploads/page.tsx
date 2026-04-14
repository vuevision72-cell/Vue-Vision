'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageUploader } from '@/components/admin/image-uploader';
import { Loader2, Link as LinkIcon, Monitor, Smartphone } from 'lucide-react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';

const imageSections = {
    hero: [
        { id: 'hero-1', label: 'Slide 1' },
        { id: 'hero-2', label: 'Slide 2' },
        { id: 'hero-3', label: 'Slide 3' },
        { id: 'hero-4', label: 'Slide 4' },
        { id: 'hero-5', label: 'Slide 5' },
        { id: 'hero-6', label: 'Slide 6' },
    ],
    categoryCircles: [
        { id: 'category-eyeglasses', label: 'Eyeglasses Circle', resolution: '200x200px' },
        { id: 'category-sunglasses', label: 'Sunglasses Circle', resolution: '200x200px' },
        { id: 'category-screen-glasses', label: 'Screen Glasses Circle', resolution: '200x200px' },
        { id: 'category-contact-lenses', label: 'Contact Lenses Circle', resolution: '200x200px' },
    ],
    genderShowcase: [
        { id: 'gender-men', label: 'Men Section Image', resolution: '300x400px' },
        { id: 'gender-women', label: 'Women Section Image', resolution: '300x400px' },
        { id: 'gender-kids', label: 'Kids Section Image', resolution: '300x400px' },
    ],
    banners: [
        { id: 'offer-banner-1', label: '"Upgrade Your Vision" Banner' },
        { id: 'offer-banner-2', label: '"Work Smarter, Not Harder" Banner' },
        { id: 'colored-lenses-banner', label: '"Colored & Cosmetic Lenses" Banner' },
    ],
    logos: [
        { id: 'brand-bausch', label: 'Bausch & Lomb Logo', resolution: '200x100px' },
        { id: 'brand-softlens', label: 'Softlens Logo', resolution: '200x100px' },
        { id: 'brand-acuvue', label: 'Acuvue Logo', resolution: '200x100px' },
        { id: 'brand-alcon', label: 'Alcon Logo', resolution: '200x100px' },
    ]
};

const allImageIds = [
    ...Object.values(imageSections).flat().map(s => s.id),
    ...imageSections.banners.map(s => `${s.id}-mobile`)
];

const allUrlIds = imageSections.hero.map(s => `${s.id}-url`);
const allContentIds = [...allImageIds, ...allUrlIds];

export default function WebsiteUploadsPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imageFiles, setImageFiles] = useState<Record<string, File | null>>({});
    const [existingContent, setExistingContent] = useState<Record<string, string>>({});
    const [urlInputs, setUrlInputs] = useState<Record<string, string>>({});

    const fetchExistingContent = useCallback(async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('website_content')
            .select('id, content')
            .in('id', allContentIds);
        
        if (data) {
            const contentMap = data.reduce((acc, item) => {
                acc[item.id] = item.content;
                return acc;
            }, {} as Record<string, string>);
            setExistingContent(contentMap);
            
            const initialUrls = allUrlIds.reduce((acc, id) => {
                acc[id] = contentMap[id] || '';
                return acc;
            }, {} as Record<string, string>);
            setUrlInputs(initialUrls);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchExistingContent();
    }, [fetchExistingContent]);

    const handleFileChange = (id: string, files: File[]) => {
        setImageFiles(prev => ({ ...prev, [id]: files[0] || null }));
    };

    const handleUrlChange = (id: string, value: string) => {
        setUrlInputs(prev => ({...prev, [id]: value }));
    }

    const uploadImage = async (id: string, file: File): Promise<string> => {
        const filePath = `website/${id}-${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
            .from('public_uploads')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false,
            });

        if (uploadError) throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);

        const { data } = supabase.storage.from('public_uploads').getPublicUrl(filePath);
        return data.publicUrl;
    };

    async function onSubmit() {
        setIsSubmitting(true);
        
        const imageUpdates = Object.entries(imageFiles).filter(([_, file]) => file !== null);
        const urlUpdates = Object.entries(urlInputs).filter(([id, url]) => url !== (existingContent[id] || ''));
        
        if (imageUpdates.length === 0 && urlUpdates.length === 0) {
            toast({ title: 'No changes to submit.', variant: 'default' });
            setIsSubmitting(false);
            return;
        }

        try {
            const upsertPromises = [];

            for (const [id, file] of imageUpdates) {
                if (file) {
                    const newUrl = await uploadImage(id, file);
                    upsertPromises.push(supabase.from('website_content').upsert({ id, content: newUrl }, { onConflict: 'id' }));
                }
            }
            
            for (const [id, url] of urlUpdates) {
                upsertPromises.push(supabase.from('website_content').upsert({ id, content: url }, { onConflict: 'id' }));
            }

            const results = await Promise.all(upsertPromises);
            
            const failures = results.filter(res => res && res.error);

            if (failures.length > 0) {
                const errorMessages = failures.map(f => f.error?.message || 'Unknown error').join(', ');
                throw new Error(`Failed to update ${failures.length} database records: ${errorMessages}`);
            }
            
            toast({ title: 'Success', description: 'Website content has been updated.' });
            setImageFiles({});
            await fetchExistingContent();

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    const ImageUploadField = ({ id, label, isHero = false, isBanner = false }: { id: string, label: string, isHero?: boolean, isBanner?: boolean }) => {
        const desktopId = id;
        const mobileId = `${id}-mobile`;

        return (
            <div className="space-y-4 p-4 border rounded-lg bg-card">
                <h3 className="font-semibold text-center">{label}</h3>
                
                <div className="space-y-4">
                    {/* Desktop Uploader */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground"><Monitor className="h-4 w-4" /> {isHero ? 'Image' : 'Desktop Image'}</label>
                        {existingContent[desktopId] && !imageFiles[desktopId] && (
                            <div className="relative w-full aspect-video bg-secondary rounded-md overflow-hidden">
                                <Image src={existingContent[desktopId]} alt={`Current Desktop ${label}`} fill className="object-contain p-2"/>
                            </div>
                        )}
                        <ImageUploader
                            value={imageFiles[desktopId] ? [imageFiles[desktopId] as File] : []}
                            onChange={(files) => handleFileChange(desktopId, files)}
                            maxFiles={1}
                            resolution="1920x800px"
                        />
                    </div>

                    {/* Mobile Uploader (only for banners) */}
                    {isBanner && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground"><Smartphone className="h-4 w-4" /> Mobile Image</label>
                            {existingContent[mobileId] && !imageFiles[mobileId] && (
                                <div className="relative w-full aspect-[9/16] bg-secondary rounded-md overflow-hidden">
                                    <Image src={existingContent[mobileId]} alt={`Current Mobile ${label}`} fill className="object-contain p-2"/>
                                </div>
                            )}
                            <ImageUploader
                                value={imageFiles[mobileId] ? [imageFiles[mobileId] as File] : []}
                                onChange={(files) => handleFileChange(mobileId, files)}
                                maxFiles={1}
                                resolution="800x1200px"
                            />
                        </div>
                    )}
                </div>

                {isHero && (
                    <div className="space-y-2 pt-4 border-t">
                        <label htmlFor={`${id}-url`} className="text-sm font-medium flex items-center gap-2 text-muted-foreground"><LinkIcon className="h-4 w-4"/> Destination URL</label>
                        <Input 
                            id={`${id}-url`}
                            value={urlInputs[`${id}-url`] || ''}
                            onChange={(e) => handleUrlChange(`${id}-url`, e.target.value)}
                            placeholder="/products/eyeglasses"
                        />
                    </div>
                )}
            </div>
        );
    };


    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">Manage Website Images</CardTitle>
                    <CardDescription>
                        Update the key images and logos displayed across your homepage. Uploading separate mobile and desktop images for banners is recommended.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-8">
                            <Skeleton className="h-48 w-full" />
                            <Skeleton className="h-48 w-full" />
                        </div>
                    ) : (
                        <div className="space-y-12">
                            <section>
                                <h2 className="font-headline text-2xl mb-4">Hero Section Sliders</h2>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {imageSections.hero.map(field => <ImageUploadField key={field.id} {...field} isHero={true} />)}
                                </div>
                            </section>
                            
                            <section>
                                <h2 className="font-headline text-2xl mb-4">Top Category Circles</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    {imageSections.categoryCircles.map(field => <ImageUploadField key={field.id} {...field} />)}
                                </div>
                            </section>

                            <section>
                                <h2 className="font-headline text-2xl mb-4">Gender Showcase Section</h2>
                                <div className="grid md:grid-cols-3 gap-6">
                                    {imageSections.genderShowcase.map(field => <ImageUploadField key={field.id} {...field} />)}
                                </div>
                            </section>

                            <section>
                                <h2 className="font-headline text-2xl mb-4">Banner Images</h2>
                                <div className="grid md:grid-cols-3 gap-6">
                                    {imageSections.banners.map(field => <ImageUploadField key={field.id} {...field} isBanner={true} />)}
                                </div>
                            </section>

                             <section>
                                <h2 className="font-headline text-2xl mb-4">Brand Logos</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    {imageSections.logos.map(field => <ImageUploadField key={field.id} {...field} />)}
                                </div>
                            </section>

                            <div className="flex justify-end pt-8">
                                <Button onClick={onSubmit} disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    Save All Changes
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
