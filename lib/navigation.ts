

export type NavItem = {
  label: string;
  href: string;
  submenu?: SubmenuGroup[];
};

export type SubmenuGroup = {
  title: string;
  items: SubmenuItem[];
};

export type SubmenuItem = {
  label: string;
  href: string;
  image?: string;
};

const frameTypes = ["Full Frame", "Rimless", "Half Rim"];
const frameShapes = ["Square", "Round", "Rectangle", "Geometric", "Cat Eye", "Aviator", "Oval"];
const genders = ["Men", "Women", "Unisex"];

const createEyewearSubmenu = (category: 'eyeglasses' | 'sunglasses' | 'screen-glasses'): SubmenuGroup[] => [
    {
        title: "Gender",
        items: [
            ...genders.map(g => ({ label: g, href: `/products/${category}?gender=${g}`})),
            { label: "Kids", href: "/products/kids-glasses"},
        ]
    },
    {
        title: "Frame Type",
        items: frameTypes.map(ft => ({ label: ft, href: `/products/${category}?frameType=${encodeURIComponent(ft)}`}))
    },
    {
        title: "Frame Shape",
        items: frameShapes.map(fs => ({ label: fs, href: `/products/${category}?frameShape=${encodeURIComponent(fs)}`}))
    },
]


export const mainNavLinks: NavItem[] = [
  {
    label: "Eyeglasses",
    href: "/products/eyeglasses",
    submenu: createEyewearSubmenu('eyeglasses'),
  },
  {
    label: "Screen Glasses",
    href: "/products/screen-glasses",
    submenu: createEyewearSubmenu('screen-glasses'),
  },
  {
    label: "Kids Glasses",
    href: "/products/kids-glasses",
  },
  {
    label: "Contact Lenses",
    href: "/products/contact-lenses",
    submenu: [
        {
            title: "Brand",
            items: [
                { label: "Bausch & Lomb", href: "/products/contact-lenses?brand=Bausch+%26+Lomb"},
                { label: "Cooper Vision", href: "/products/contact-lenses?brand=Cooper+Vision"},
                { label: "Alcon", href: "/products/contact-lenses?brand=Alcon"},
                { label: "Johnson & Johnson", href: "/products/contact-lenses?brand=Johnson+%26+Johnson"},
                { label: "Celebration", href: "/products/contact-lenses?brand=Celebration"},
            ]
        },
        {
            title: "Explore by Disposability",
            items: [
                { label: "Monthly", href: "/products/contact-lenses?disposability=Monthly"},
                { label: "Daily", href: "/products/contact-lenses?disposability=Daily"},
                { label: "Yearly", href: "/products/contact-lenses?disposability=Yearly"},
                { label: "Bi-Weekly", href: "/products/contact-lenses?disposability=Bi-weekly"},
            ]
        },
        {
            title: "Explore by Power",
            items: [
                { label: "Spherical Power", href: "/products/contact-lenses"},
                { label: "Cylindrical Power", href: "/products/contact-lenses"},
                { label: "Toric Power for Astigmatism", href: "/products/contact-lenses"},
            ]
        },
        {
            title: "Explore by Color",
            items: [
                { label: "Hazel", href: "/products/contact-lenses?color=Hazel"},
                { label: "Brown", href: "/products/contact-lenses?color=Brown"},
                { label: "Blue", href: "/products/contact-lenses?color=Blue"},
                { label: "Green", href: "/products/contact-lenses?color=Green"},
                { label: "Grey", href: "/products/contact-lenses?color=Grey"},
                { label: "View All", href: "/products/contact-lenses"},
            ]
        }
    ]
  },
  {
    label: "Sunglasses",
    href: "/products/sunglasses",
    submenu: createEyewearSubmenu('sunglasses'),
  },
  {
    label: "Blog",
    href: "/blog",
  },
];
