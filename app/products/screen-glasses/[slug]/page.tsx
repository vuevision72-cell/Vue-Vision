import { supabase } from '@/lib/supabase';
import type { Metadata } from 'next';
import ScreenGlassesClientPage from "./screen-glasses-client-page";
import type { Product } from '@/lib/types';

type Props = {
  params: { slug: string };
};

async function getProduct(slug: string): Promise<(Product & { video_url?: string; stock_quantity?: number | null }) | null> {
    const { data, error } = await supabase
        .from('screen_glasses')
        .select('*')
        .eq('id', slug)
        .single();
    
    if (error || !data) {
        console.error("Error fetching screen glass:", error);
        return null;
    }
    
    return {
        id: data.id.toString(),
        slug: data.id.toString(),
        name: data.name,
        category: 'screen-glasses',
        price: data.price,
        mrp: data.mrp,
        description: data.description,
        images: data.image_urls || [],
        imageId: 'product-13', // fallback
        frameType: data.frame_type,
        frameShape: data.frame_shape,
        gender: data.gender,
        frameSize: data.frame_size,
        video_url: data.video_url,
        stock_quantity: data.stock_quantity,
    };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct(params.slug);

  if (!product) {
    return {
      title: "Product Not Found",
      description: "The product you are looking for could not be found.",
    };
  }

  const title = `${product.name} | Screen Glasses | Zeno Pure Vision`;
  const description = product.description;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: product.images ? [product.images[0]] : [],
      url: `/products/screen-glasses/${params.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: product.images ? [product.images[0]] : [],
    },
  };
}

export default async function ScreenGlassProductPage({ params }: Props) {
    const product = await getProduct(params.slug);

    if (!product) {
        // You can render a not-found component here or Next.js will handle it
        return null;
    }

    return <ScreenGlassesClientPage product={product} />;
}
