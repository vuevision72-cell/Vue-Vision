
import { supabase } from '@/lib/supabase';
import type { Metadata } from 'next';
import SunglassesClientPage from "./sunglasses-client-page";
import type { Sunglass, LensColor, PrescriptionValue } from "@/lib/types";
import { notFound } from 'next/navigation';

type Props = {
  params: { slug: string };
};

async function getProduct(slug: string): Promise<Sunglass | null> {
    const { data, error } = await supabase
        .from("sunglasses")
        .select("*")
        .eq("id", slug)
        .single();

    if (error || !data) {
        console.error("Error fetching sunglass:", error);
        return null;
    }
    return data as Sunglass;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct(params.slug);

  if (!product) {
    return {
      title: "Product Not Found",
      description: "The product you are looking for could not be found.",
    };
  }

  const title = `${product.name} | Sunglasses | Zeno Pure Vision`;
  const description = product.description;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: product.image_urls ? [product.image_urls[0]] : [],
      url: `/products/sunglasses/${params.slug}`,
    },
     twitter: {
      card: "summary_large_image",
      title,
      description,
      images: product.image_urls ? [product.image_urls[0]] : [],
    },
  };
}

export default async function SunglassProductPage({ params }: Props) {
    const productPromise = getProduct(params.slug);
    
    const colorsPromise = supabase.from("sunglasses_lens_colors").select("*");
    const sphPromise = supabase.from('sunglasses_prescription_values').select('*').eq('type', 'sph');
    const cylPromise = supabase.from('sunglasses_prescription_values').select('*').eq('type', 'cyl');
    const axisPromise = supabase.from('sunglasses_prescription_values').select('*').eq('type', 'axis');
    const contactInfoPromise = supabase.from('contact_info').select('phone_number').single();
    
    const [
        product,
        { data: colorsData },
        { data: sphData },
        { data: cylData },
        { data: axisData },
        { data: contactInfo }
    ] = await Promise.all([productPromise, colorsPromise, sphPromise, cylPromise, axisPromise, contactInfoPromise]);

  if (!product) {
    notFound();
  }
  
  const prescriptionValues = {
      sph: (sphData || []) as PrescriptionValue[],
      cyl: (cylData || []) as PrescriptionValue[],
      axis: (axisData || []) as PrescriptionValue[],
  }

  return (
    <SunglassesClientPage 
        product={product} 
        colors={(colorsData || []) as LensColor[]} 
        prescriptionValues={prescriptionValues}
        contactInfo={contactInfo || { phone_number: '' }}
    />
  );
}
