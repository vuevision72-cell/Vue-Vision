
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from 'next/link';

interface Blog {
    id: number;
    slug: string;
    title: string;
    description: string | null;
    desktop_image_url: string | null;
    mobile_image_url: string | null;
    created_at: string;
}

// Generate static paths for all blogs at build time
export async function generateStaticParams() {
    const { data: blogs } = await supabase.from('blogs').select('slug');
    return blogs?.map(({ slug }) => ({ slug })) || [];
}

async function getBlog(slug: string): Promise<Blog | null> {
    const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('slug', slug)
        .single();
    
    if (error) {
        console.error('Error fetching blog:', error);
        return null;
    }
    return data;
}

export default async function BlogPage({ params }: { params: { slug: string } }) {
    const blog = await getBlog(params.slug);

    if (!blog) {
        notFound();
    }

    // The content from the DB is now HTML, so we just use it directly.
    const contentHtml = blog.description || '';

    return (
        <div className="bg-background">
            <section className="relative h-[50vh] w-full flex items-center justify-center text-center text-white">
                <picture>
                    {blog.mobile_image_url && (
                        <source media="(max-width: 767px)" srcSet={blog.mobile_image_url} />
                    )}
                    {blog.desktop_image_url && (
                        <source media="(min-width: 768px)" srcSet={blog.desktop_image_url} />
                    )}
                     <Image
                        src={blog.desktop_image_url || 'https://picsum.photos/seed/blog-hero/1200/600'}
                        alt={blog.title}
                        fill
                        className="object-cover brightness-50"
                        priority
                    />
                </picture>
                <div className="relative z-10 p-4 space-y-4 max-w-4xl mx-auto">
                    <h1 className="font-headline text-4xl md:text-6xl drop-shadow-lg">
                        {blog.title}
                    </h1>
                </div>
            </section>

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
                        <BreadcrumbLink asChild>
                        <Link href="/blog">Blog</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>{blog.title}</BreadcrumbPage>
                    </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <article className="prose prose-lg max-w-4xl mx-auto dark:prose-invert prose-headings:font-headline prose-h2:text-3xl prose-h3:text-2xl">
                    <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
                </article>
            </div>
        </div>
    );
}
