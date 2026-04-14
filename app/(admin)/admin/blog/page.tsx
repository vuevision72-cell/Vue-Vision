
'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageUploader } from '@/components/admin/image-uploader';
import { Loader2, Monitor, Smartphone, CheckCircle } from 'lucide-react';
import Image from 'next/image';

interface Blog {
    id: number;
    title: string;
    slug: string;
    desktop_image_url?: string | null;
    mobile_image_url?: string | null;
}

export default function BlogManagementPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState<number | null>(null);
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [imageFiles, setImageFiles] = useState<Record<string, { desktop?: File | null, mobile?: File | null }>>({});

    const fetchBlogs = useCallback(async () => {
        setIsLoading(true);
        const { data, error } = await supabase.from('blogs').select('*').order('created_at', { ascending: false });
        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch blog posts.' });
        } else {
            setBlogs(data || []);
        }
        setIsLoading(false);
    }, [toast]);

    useEffect(() => {
        fetchBlogs();
    }, [fetchBlogs]);

    const handleFileChange = (blogId: number, type: 'desktop' | 'mobile', files: File[]) => {
        setImageFiles(prev => ({
            ...prev,
            [blogId]: {
                ...prev[blogId],
                [type]: files[0] || null,
            },
        }));
    };
    
    const uploadImage = async (file: File, path: string): Promise<string> => {
        const { error: uploadError } = await supabase.storage.from('public_uploads').upload(path, file, {
            cacheControl: '3600',
            upsert: false, // This is the fix: Changed from true to false
        });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('public_uploads').getPublicUrl(path);
        return data.publicUrl;
    };

    const handleSaveChanges = async (blog: Blog) => {
        setIsSubmitting(blog.id);
        
        const filesToUpload = imageFiles[blog.id];
        if (!filesToUpload || (!filesToUpload.desktop && !filesToUpload.mobile)) {
            toast({ title: 'No Changes', description: 'No new images were selected to upload.' });
            setIsSubmitting(null);
            return;
        }

        try {
            const updates: { desktop_image_url?: string; mobile_image_url?: string } = {};

            if (filesToUpload.desktop) {
                const desktopPath = `blogs/${blog.slug}-desktop-${Date.now()}.jpg`;
                updates.desktop_image_url = await uploadImage(filesToUpload.desktop, desktopPath);
            }
            if (filesToUpload.mobile) {
                const mobilePath = `blogs/${blog.slug}-mobile-${Date.now()}.jpg`;
                updates.mobile_image_url = await uploadImage(filesToUpload.mobile, mobilePath);
            }

            if (Object.keys(updates).length > 0) {
                const { error: dbError } = await supabase.from('blogs').update(updates).eq('id', blog.id);
                if (dbError) throw dbError;
            }

            toast({ title: 'Success', description: `Images for "${blog.title}" have been updated.` });
            await fetchBlogs(); // Refresh data to show new images
            setImageFiles(prev => ({ ...prev, [blog.id]: { desktop: null, mobile: null } })); // Clear staged files

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Upload Failed', description: error.message });
        } finally {
            setIsSubmitting(null);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-3xl">Manage Blog Banners</CardTitle>
                <CardDescription>
                    Upload desktop and mobile banner images for your blog posts.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-6">
                        <Skeleton className="h-64 w-full" />
                        <Skeleton className="h-64 w-full" />
                    </div>
                ) : (
                    <div className="space-y-8">
                        {blogs.map(blog => (
                            <Card key={blog.id} className="p-4">
                                <CardTitle className="text-xl mb-4">{blog.title}</CardTitle>
                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Desktop Uploader */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                                            <Monitor className="h-4 w-4" /> Desktop Banner (1200x630px)
                                        </label>
                                        {blog.desktop_image_url && !imageFiles[blog.id]?.desktop && (
                                            <div className="relative w-full aspect-[1.9/1] bg-secondary rounded-md overflow-hidden">
                                                <Image src={blog.desktop_image_url} alt={`Current Desktop Banner for ${blog.title}`} fill className="object-cover" />
                                            </div>
                                        )}
                                        <ImageUploader
                                            value={imageFiles[blog.id]?.desktop ? [imageFiles[blog.id]!.desktop!] : []}
                                            onChange={(files) => handleFileChange(blog.id, 'desktop', files)}
                                            maxFiles={1}
                                            resolution="1200x630px"
                                        />
                                    </div>
                                    {/* Mobile Uploader */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                                            <Smartphone className="h-4 w-4" /> Mobile Banner (800x1000px)
                                        </label>
                                        {blog.mobile_image_url && !imageFiles[blog.id]?.mobile && (
                                            <div className="relative w-full aspect-[4/5] bg-secondary rounded-md overflow-hidden">
                                                <Image src={blog.mobile_image_url} alt={`Current Mobile Banner for ${blog.title}`} fill className="object-cover" />
                                            </div>
                                        )}
                                        <ImageUploader
                                            value={imageFiles[blog.id]?.mobile ? [imageFiles[blog.id]!.mobile!] : []}
                                            onChange={(files) => handleFileChange(blog.id, 'mobile', files)}
                                            maxFiles={1}
                                            resolution="800x1000px"
                                        />
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <Button onClick={() => handleSaveChanges(blog)} disabled={isSubmitting === blog.id}>
                                        {isSubmitting === blog.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4" />}
                                        Save Changes for this Blog
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
