
import { supabase } from '@/lib/supabase';

const URL = 'https://zenopurevision.com';

async function generateSitemap() {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  // Static pages
  const staticPages = [
    '', 
    '/about', 
    '/help', 
    '/privacy', 
    '/returns-policy', 
    '/tnc',
    '/products/eyeglasses',
    '/products/sunglasses',
    '/products/screen-glasses',
    '/products/contact-lenses',
    '/products/kids-glasses'
  ];

  staticPages.forEach(page => {
    xml += `
      <url>
        <loc>${URL}${page}</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>${page === '' ? '1.0' : '0.8'}</priority>
      </url>
    `;
  });

  // Dynamic product pages
  const productTables = [
      { name: 'eyeglasses', category: 'eyeglasses' },
      { name: 'sunglasses', category: 'sunglasses' },
      { name: 'screen_glasses', category: 'screen-glasses' },
      { name: 'contact_lenses', category: 'contact-lenses' }
  ];

  for (const table of productTables) {
    const { data: products } = await supabase.from(table.name).select('id, created_at');
    if (products) {
      products.forEach((product: { id: number; created_at: string }) => {
        xml += `
          <url>
            <loc>${URL}/products/${table.category}/${product.id}</loc>
            <lastmod>${new Date(product.created_at).toISOString()}</lastmod>
            <changefreq>monthly</changefreq>
            <priority>0.7</priority>
          </url>
        `;
      });
    }
  }

  xml += `</urlset>`;
  return xml;
}

export async function GET() {
  const sitemap = await generateSitemap();
  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
