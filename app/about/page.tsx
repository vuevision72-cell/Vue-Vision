import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Lightbulb, Target, Eye, Users } from "lucide-react";

export default function AboutPage() {
  const aboutHeroImage = PlaceHolderImages.find((p) => p.id === "about-us-hero");

  const values = [
    {
      icon: <Lightbulb className="h-10 w-10 text-primary" />,
      title: "Innovation",
      description: "We are driven by technology and innovation to create better, more accessible eyewear solutions for everyone."
    },
    {
      icon: <Target className="h-10 w-10 text-primary" />,
      title: "Accessibility",
      description: "We believe that clear vision is a fundamental right, not a luxury. We strive to make quality eyewear affordable."
    },
    {
      icon: <Eye className="h-10 w-10 text-primary" />,
      title: "Quality",
      description: "From design to delivery, we ensure the highest standards of quality in our products and services."
    },
    {
      icon: <Users className="h-10 w-10 text-primary" />,
      title: "Community",
      description: "We are committed to building a community focused on well-being and personal development through clear vision."
    }
  ];

  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="relative h-[40vh] md:h-[50vh] w-full flex items-center justify-center text-center text-white">
        {aboutHeroImage && (
          <Image
            src={aboutHeroImage.imageUrl}
            alt={aboutHeroImage.description}
            fill
            className="object-cover brightness-50"
            data-ai-hint={aboutHeroImage.imageHint}
            priority
          />
        )}
        <div className="relative z-10 p-4 space-y-4">
          <h1 className="font-headline text-4xl md:text-6xl drop-shadow-lg">
            About Zeno Pure Vision
          </h1>
          <p className="text-lg md:text-xl max-w-3xl mx-auto drop-shadow-md">
            Revolutionizing eyewear with technology, for a clearer tomorrow.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-headline text-3xl md:text-4xl">Our Mission</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-4xl mx-auto">
            ZENO PURE VISION is a technology-driven eyewear company, with a belief that clear vision is fundamental to personal development and well-being. Our aim is to build tech-enabled supply and distribution solutions that improve access to affordable and quality Eyewear for All. We sell a wide range of eyewear products including prescription eyeglasses, sunglasses, and other products such as contact lenses and eyewear accessories. Our brands are designed to be aspirational and appeal to a wide range of customer segments.
          </p>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="bg-secondary py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="font-headline text-3xl md:text-4xl text-center mb-12">
            Our Core Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value) => (
              <div key={value.title} className="text-center p-6 bg-background rounded-lg shadow-sm">
                <div className="flex justify-center mb-4">{value.icon}</div>
                <h3 className="font-headline text-xl font-semibold mb-2">{value.title}</h3>
                <p className="text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-headline text-3xl md:text-4xl">Find Your Perfect Pair</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Ready to see the world more clearly? Explore our collections and find the eyewear that fits your life and style.
          </p>
          <Button size="lg" asChild className="mt-8">
            <Link href="/products/all">
              Shop The Collection
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}