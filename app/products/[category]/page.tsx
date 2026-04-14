
import { supabase } from "@/lib/supabase";
import type { Metadata } from 'next';
import CategoryClientPage from "./category-client-page";
import { categories as allCategories } from "@/lib/placeholder-data";
import type { Category } from "@/lib/types";

export async function generateMetadata({ params }: { params: { category: string } }): Promise<Metadata> {
  const categoryId = params.category as Category['id'];
  const category = allCategories.find(c => c.id === categoryId) || {
    id: 'all',
    name: 'All Products',
    description: 'Browse all our premium eyewear including eyeglasses, sunglasses, and contact lenses.'
  };

  const title = `${category.name} | Zeno Pure Vision`;
  const description = category.description;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/products/${categoryId}`,
      images: [
        {
          url: `https://zenopurevision.com/og-image.png`, // Replace with a relevant category image if available
          width: 1200,
          height: 630,
        },
      ],
    },
     twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}


export default function CategoryPage({ params }: { params: { category: string } }) {
  // This is now a Server Component.
  // We can fetch initial data here if needed and pass it to the client component.
  // For this fix, we will let the client component handle its own data fetching as it was before.
  const categoryId = params.category as Category['id'];
  
  return <CategoryClientPage categoryId={categoryId} />;
}
