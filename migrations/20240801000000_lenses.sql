-- Create the lens_options table to store primary lens customizations
CREATE TABLE public.lens_options (
  id serial PRIMARY KEY,
  name text NOT NULL,
  description text,
  price numeric(10, 2) NOT NULL,
  features text[],
  power_availability text,
  category text NOT NULL -- e.g., 'screen-glasses', 'sunglasses'
);
COMMENT ON TABLE public.lens_options IS 'Stores primary lens customization options like Blue Ray Basic, Night Drive, etc.';

-- Create the lens_addons table to store add-on options
CREATE TABLE public.lens_addons (
  id serial PRIMARY KEY,
  name text NOT NULL,
  description text,
  price numeric(10, 2) NOT NULL
);
COMMENT ON TABLE public.lens_addons IS 'Stores lens add-ons like Photochromatic Coating, Polycarbonate, etc.';

-- Create a linking table for the many-to-many relationship between lens options and addons
CREATE TABLE public.lens_option_addons (
  lens_option_id integer REFERENCES public.lens_options(id) ON DELETE CASCADE,
  lens_addon_id integer REFERENCES public.lens_addons(id) ON DELETE CASCADE,
  PRIMARY KEY (lens_option_id, lens_addon_id)
);
COMMENT ON TABLE public.lens_option_addons IS 'Links lens options to their available add-ons.';

-- Seed data for lens_options
INSERT INTO public.lens_options (id, name, price, features, category) VALUES
(1, 'Blue Ray Basic', 139, '{"1.56 Index", "Screen Protection", "Scratch Resistance", "Antiglare Coating"}', 'screen-glasses'),
(2, 'Blue Ray Premium', 299, '{"1.60 Index", "Antiglare Coating (Blue Coating)", "Screen Protection", "UV Protection", "Scratch Resistance", "Smudge Resistance", "Super Hydrophobic Coating"}', 'screen-glasses'),
(3, 'Golden Coating', 599, '{"1.60 Index", "Special Golden coating Dual Side", "Screen Protection Dual Side", "UV protection Dual Side", "Scratch Resistance Dual Side", "Smudge Resistance Dual Side", "Super Hydrophobic coating", "Antiglarecoating"}', 'screen-glasses'),
(4, 'Blue Ray Dual Coating Basic', 499, '{"1.56 Index", "Blue Green Coating Dual Side", "Screen Protection", "UV Protection", "Scratch Resistance", "Smudge Resistance", "Hydrophobic Coating", "Antiglare Coating"}', 'screen-glasses'),
(5, 'Blue Ray Dual Coating Premium', 699, '{"1.60 Index", "Lemon Blue Coating dual side", "Screen protection Dual Side", "UV Protection Dual Side", "Scratch Resistance Dual Side", "Smudge Resistance Dual Side", "Super Hydrophobic Coating", "Antiglare Coating"}', 'screen-glasses'),
(6, 'Night Driving Basic', 799, '{"1.56 Index", "Reduce Headlights and Street Lights", "Violet Coating", "Screen protection", "UV Protection", "Scratch Resistance", "Smudge Resistance", "Hydrophobic coating", "Antiglare Coating"}', 'screen-glasses'),
(7, 'Night Drive Premium', 999, '{"1.60 Index", "Reduce Headlights and Street Lights", "Magenta Coating Dual Side", "Screen Protection Dual side", "UV Protection Dual Side", "Scratch Resistance Dual Side", "Smudge Resistance Dual Side", "Super Hydrophobic Coating Dual Side", "Antiglare Coating"}', 'screen-glasses');

-- Seed data for lens_addons
INSERT INTO public.lens_addons (id, name, price) VALUES
(1, 'Photochromatic Coating', 400),
(2, 'Polycarbonate Coating (unbreakable lens)', 350),
(3, 'Photochromatic + Polycarbonate (un-Breakable)', 1299),
(4, 'Magenta Coating', 200),
(5, 'Violet Coating', 200),
(6, 'Photochromatic Coating', 500),
(7, 'Polycarbonate (Unbreakable)', 400),
(8, 'Photochromatic + Polycarbonate (Un-breakable)', 1200),
(9, 'Invisible Coating', 230),
(10, 'Photochromatic Coating', 549),
(11, 'Polycarbonate (unbreakable)', 539),
(12, 'Photochromatic Coating', 599),
(13, 'Polycarbonate (Unbreakable)', 549),
(14, 'Photochromatic Coating', 1100),
(15, 'Polycarbonate (Unbreakable)', 749),
(16, 'Photochromatic Coating', 1200),
(17, 'Polycarbonate (unbreakable)', 799);

-- Seed data for lens_option_addons linking table
INSERT INTO public.lens_option_addons (lens_option_id, lens_addon_id) VALUES
(1, 1),
(1, 2),
(1, 3),
(1, 4),
(1, 5),
(2, 6),
(2, 7),
(2, 8),
(2, 9),
(4, 10),
(4, 11),
(5, 12),
(5, 13),
(6, 14),
(6, 15),
(7, 16),
(7, 17);

