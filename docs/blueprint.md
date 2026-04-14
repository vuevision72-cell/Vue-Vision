# **App Name**: Zeno Pure Vision

## Core Features:

- Product Catalog: Display eyeglasses, sunglasses, kids glasses and contact lenses. Uses data fetched from the Supabase database.
- Lens Configurator: Modal for configuring lenses with various options, Rx entry, add-ons, and compatibility checks.
- Prescription Validation: Implement server-side validation for prescription values using a Supabase Edge Function to check if the provided data is within an acceptable range.
- Unboxing Video Validation: The return requests that rely on damage will be rejected without the mandatory unboxing video.
- Payment Processing: Integrate Razorpay for payment processing.
- Admin Dashboard: Admin panel to manage orders, returns, prescriptions, and process refunds. Secured by Supabase Auth with admin roles.

## Style Guidelines:

- Primary color: A desaturated teal (#70A1AF) evokes clarity and sophistication, while avoiding common e-commerce cliches.
- Background color: A very light, desaturated teal (#F0F8FA), lighter than the primary color to keep things airy.
- Accent color: A muted lavender (#B19CD9), set 30 degrees from teal, and a distinctly different tone that draws the eye.
- Headline font: 'Belleza' (sans-serif) will be used for its fashionable and artistic qualities.
- Body font: 'Alegreya' (serif) provides a highly-readable font suitable for extended passages, with a contemporary feel.
- Code font: 'Source Code Pro' for displaying code snippets.
- Clean, line-based icons for key navigation and interactive elements.
- Clean and minimal layout with clear hierarchy and intuitive navigation. Focus on product imagery and readability.
- Subtle transitions and animations to enhance user experience without being distracting.