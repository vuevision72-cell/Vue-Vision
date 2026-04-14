

export type CategoryId = 'eyeglasses' | 'sunglasses' | 'kids-glasses' | 'contact-lenses' | 'screen-glasses' | 'all';

export type Category = {
  id: CategoryId;
  name: string;
  description: string;
  imageId: string;
};

export type Product = {
  id: string;
  slug: string;
  name:string;
  category: Category['id'];
  price: number;
  mrp?: number;
  description: string;
  imageId: string;
  images?: string[];
  frameType?: 'Full Frame' | 'Rimless' | 'Half Rim';
  frameShape?: 'Square' | 'Round' | 'Rectangle' | 'Geometric' | 'Cat Eye' | 'Aviator' | 'Oval';
  gender?: 'Men' | 'Women' | 'Unisex' | 'Kids';
  frameSize?: 'Narrow' | 'Medium' | 'Wide';
};

export type Eyeglass = {
    id: number;
    name: string;
    description: string;
    price: number;
    mrp?: number;
    frame_type: string;
    frame_shape: string[];
    gender: string[];
    frame_size: string;
    image_urls: string[] | null;
    created_at: string;
    product_specification?: string;
    return_policy?: string;
    warranty?: string;
    cod_available?: boolean;
    delivery_time?: string;
    video_url?: string;
    stock_quantity?: number | null;
};

// Types for the new eyeglass-specific configuration
export type EyeglassLensCategory = {
    id: number;
    name: string;
    description: string | null;
};

export type EyeglassLensSubcategory = {
    id: number;
    category_id: number;
    name: string;
};

export type EyeglassAddon = {
    id: number;
    name: string;
};

export type EyeglassLensPackage = {
    id: number;
    subcategory_id: number;
    name: string;
    price: number;
    features: string[];
    power_range_info: string | null;
};

export type EyeglassPackageAddon = {
    package_id: number;
    addon_id: number;
    price: number;
    addon: EyeglassAddon; // This will be joined
};

export type EyeglassPrescriptionValue = {
    id: number;
    category_id: number;
    type: 'sph' | 'cyl' | 'axis' | 'add';
    value: string;
};

// New type for the self-contained zero power packages
export type ZeroPowerAddon = {
    name: string;
    price: number;
};

export type ZeroPowerPackage = {
    id: number;
    name: string;
    price: number;
    features: string[];
    addons: ZeroPowerAddon[];
};


export type Sunglass = {
    id: number;
    name: string;
    description: string;
    price: number;
    mrp?: number;
    frame_type: string;
    frame_shape: string[];
    gender: string[];
    frame_size: string;
    image_urls: string[] | null;
    created_at: string;
    product_specification?: string;
    return_policy?: string;
    warranty?: string;
    cod_available?: boolean;
    delivery_time?: string;
    video_url?: string;
    stock_quantity?: number | null;
};

export type LensColor = {
    id: number;
    name: string;
    hex_code: string | null;
    price: number;
};

export type PrescriptionValue = {
    id: number;
    type: 'sph' | 'cyl' | 'axis';
    value: string;
};

// Renamed from prescription_values to avoid conflict
export type SunglassPrescriptionValue = {
    id: number;
    type: 'sph' | 'cyl' | 'axis';
    value: string;
};

export type ContactLens = {
    id: number;
    name: string;
    description: string;
    price: number;
    mrp?: number;
    image_urls: string[] | null;
    created_at: string;
    brand: string;
    disposability: string;
    power_type: string;
    colored_lens_power_type: string | null;
    color: string | null;
    has_spherical: boolean;
    has_cylindrical: boolean;
    has_axis: boolean;
    has_ap: boolean;
    product_specification?: string;
    return_policy?: string;
    warranty?: string;
    cod_available?: boolean;
    delivery_time?: string;
    video_url?: string;
    stock_quantity?: number | null;
}

export type WebsiteImage = {
    id: string;
    image_url: string;
    description: string;
}

export interface Blog {
    id: number;
    slug: string;
    title: string;
    description: string | null;
    desktop_image_url: string | null;
    mobile_image_url: string | null;
    created_at: string;
}
