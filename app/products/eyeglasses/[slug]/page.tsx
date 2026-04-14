
import { supabase } from '@/lib/supabase';
import type { Metadata } from 'next';
import EyeglassClientPage from "./eyeglass-client-page";
import { Eyeglass } from '@/lib/types';
import { notFound } from 'next/navigation';

type Props = {
  params: { slug: string };
};

async function getProduct(slug: string): Promise<Eyeglass | null> {
    const { data, error } = await supabase
        .from("eyeglasses")
        .select("*")
        .eq("id", slug)
        .single();
    if (error || !data) {
        console.error("Error fetching eyeglass:", error);
        return null;
    }
    return data as Eyeglass;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct(params.slug);

  if (!product) {
    return {
      title: "Product Not Found",
      description: "The product you are looking for could not be found.",
    };
  }

  const title = `${product.name} | Eyeglasses | Zeno Pure Vision`;
  const description = product.description;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: product.image_urls ? [product.image_urls[0]] : [],
      url: `/products/eyeglasses/${params.slug}`,
    },
     twitter: {
      card: "summary_large_image",
      title,
      description,
      images: product.image_urls ? [product.image_urls[0]] : [],
    },
  };
}


export default async function EyeglassProductPage({ params }: Props) {
  const { slug } = params;
  
  const productPromise = getProduct(slug);
  const categoriesPromise = supabase.from("eyeglass_lens_categories").select("*").neq('name', 'Zero Power');
  const subcategoriesPromise = supabase.from("eyeglass_lens_subcategories").select("*");
  const packagesPromise = supabase.from("eyeglass_lens_packages").select("*, addon:eyeglass_addons(*)");
  const packageAddonsPromise = supabase.from("eyeglass_package_addons").select("*, addon:eyeglass_addons(*)");
  const prescriptionValuesPromise = supabase.from("eyeglass_prescription_values").select("*");
  const zeroPowerPackagesPromise = supabase.from('zero_power_packages').select('*');
  const contactInfoPromise = supabase.from('contact_info').select('phone_number').single();
  const sunglassesRxSphPromise = supabase.from('sunglasses_prescription_values').select('*').eq('type', 'sph');
  const sunglassesRxCylPromise = supabase.from('sunglasses_prescription_values').select('*').eq('type', 'cyl');
  const sunglassesRxAxisPromise = supabase.from('sunglasses_prescription_values').select('*').eq('type', 'axis');
  const sunglassesLensColorsPromise = supabase.from('sunglasses_lens_colors').select('*');

  const [
      product,
      { data: lensCategories },
      { data: lensSubcategories },
      { data: lensPackages },
      { data: packageAddons },
      { data: prescriptionValues },
      { data: zeroPowerPackages },
      { data: contactInfo },
      { data: sgSph },
      { data: sgCyl },
      { data: sgAxis },
      { data: tintColors },
  ] = await Promise.all([
      productPromise,
      categoriesPromise,
      subcategoriesPromise,
      packagesPromise,
      packageAddonsPromise,
      prescriptionValuesPromise,
      zeroPowerPackagesPromise,
      contactInfoPromise,
      sunglassesRxSphPromise,
      sunglassesRxCylPromise,
      sunglassesRxAxisPromise,
      sunglassesLensColorsPromise,
  ]);

  if (!product) {
    notFound();
  }
  
    const tintedLensCategoryId = lensCategories?.find(c => c.name === 'Tinted Lens')?.id;
    let finalPrescriptionValues = prescriptionValues || [];

    if (tintedLensCategoryId) {
        const sgRxValues = [
            ...(sgSph || []).map(v => ({ ...v, category_id: tintedLensCategoryId, id: `sg-sph-${v.id}`})),
            ...(sgCyl || []).map(v => ({ ...v, category_id: tintedLensCategoryId, id: `sg-cyl-${v.id}`})),
            ...(sgAxis || []).map(v => ({ ...v, category_id: tintedLensCategoryId, id: `sg-axis-${v.id}`}))
        ];
        finalPrescriptionValues = [...finalPrescriptionValues, ...sgRxValues];
    }
    
    const bifocalProgressiveCats = (lensCategories || []).filter(c => c.name.includes('Bifocal') || c.name.includes('Progressive'));
    if (bifocalProgressiveCats.length > 0) {
        const { data: addData } = await supabase.from('eyeglass_prescription_values').select('*').eq('type', 'add');
        if (addData) {
             bifocalProgressiveCats.forEach(cat => {
                const addValuesForCat = addData.map(v => ({...v, category_id: cat.id, id: `add-${cat.id}-${v.id}`}));
                finalPrescriptionValues.push(...addValuesForCat);
            });
        }
    }


  const configData = {
    lensCategories: lensCategories || [],
    lensSubcategories: lensSubcategories || [],
    lensPackages: lensPackages || [],
    packageAddons: packageAddons || [],
    prescriptionValues: finalPrescriptionValues,
    zeroPowerPackages: zeroPowerPackages || [],
    contactInfo: contactInfo || { phone_number: '' },
    tintColors: tintColors || [],
  };


  return (
    <EyeglassClientPage product={product} configData={configData} />
  );
}
