
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

interface Blog {
    id: number;
    slug: string;
    title: string;
    description: string | null;
    desktop_image_url: string | null;
    created_at: string;
}

async function getBlogs(): Promise<Blog[]> {
    const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error fetching blogs:', error);
        return [];
    }
    return data;
}

export default async function BlogListPage() {
    const blogs = await getBlogs();

    return (
        <div className="container mx-auto px-4 py-16">
            <div className="text-center mb-12">
                <h1 className="font-headline text-4xl md:text-5xl">Zeno Pure Vision Blog</h1>
                <p className="mt-4 text-lg text-muted-foreground">
                    Insights and advice on eye care, eyewear, and vision health.
                </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {blogs.map(blog => (
                    <Link href={`/blog/${blog.slug}`} key={blog.id}>
                        <Card className="h-full flex flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm group">
                            <div className="relative aspect-video">
                                <Image
                                    src={blog.desktop_image_url || 'https://picsum.photos/seed/blog-list/400/225'}
                                    alt={blog.title}
                                    fill
                                    className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
                                />
                            </div>
                            <CardContent className="p-4 flex flex-col flex-1">
                                <h2 className="font-bold text-lg leading-tight flex-1 group-hover:text-primary transition-colors">
                                    {blog.title}
                                </h2>
                                <p className="text-sm text-muted-foreground mt-2">
                                    {new Date(blog.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
