
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Mail, Phone } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

const WhatsAppIcon = () => (
  <div className="relative h-6 w-6 inline-block ml-1 align-middle">
      <Image 
        src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
        alt="WhatsApp Icon"
        fill
        className="object-contain"
      />
  </div>
);

export default function HelpPage() {
  const [contactInfo, setContactInfo] = useState({ phone_number: '', email: '' });

  useEffect(() => {
    const fetchContactInfo = async () => {
      const { data } = await supabase
        .from('contact_info')
        .select('*')
        .eq('id', 1)
        .single();
      if (data) {
        setContactInfo(data);
      }
    };
    fetchContactInfo();
  }, []);

  const whatsappLink = `https://wa.me/${contactInfo.phone_number?.replace(/\D/g, '')}`;

  const faqs = [
    {
      question: "I want to provide/change 'my power' for this order",
      answer: (
        <span>
          Upload power on WhatsApp.
          <Link href={whatsappLink} target="_blank" rel="noopener noreferrer">
            <Button variant="link" className="p-0 h-auto text-base text-primary inline-flex items-center">
              Connect on WhatsApp <WhatsAppIcon />
            </Button>
          </Link>
        </span>
      ),
    },
    {
      question: "I want to cancel/return my order",
      answer: (
        <span>
          Please connect with us on WhatsApp for cancellations or returns.
           <Link href={whatsappLink} target="_blank" rel="noopener noreferrer">
            <Button variant="link" className="p-0 h-auto text-base text-primary inline-flex items-center">
              Connect on WhatsApp <WhatsAppIcon />
            </Button>
          </Link>
        </span>
      ),
    },
    {
      question: "Where is my order?",
      answer: (
         <span>
          Our motive is to deliver your order tomorrow or the day after. Sometimes a product fails our quality check, which can delay the order by 1-2 days. For updates, please
           <Link href={whatsappLink} target="_blank" rel="noopener noreferrer">
            <Button variant="link" className="p-0 h-auto text-base text-primary inline-flex items-center">
              Connect on WhatsApp <WhatsAppIcon />
            </Button>
          </Link>
        </span>
      ),
    },
    {
      question: "I want to modify an item in my order",
       answer: (
        <span>
          To modify an item in your order, please
           <Link href={whatsappLink} target="_blank" rel="noopener noreferrer">
            <Button variant="link" className="p-0 h-auto text-base text-primary inline-flex items-center">
              Connect on WhatsApp <WhatsAppIcon />
            </Button>
          </Link>
        </span>
      ),
    },
    {
      question: "I have return and refund related queries",
      answer: (
        <Button asChild variant="link" className="p-0 h-auto text-base">
          <Link href="/returns-policy">
            View Policy
          </Link>
        </Button>
      ),
    },
    {
      question: "I have points related queries",
      answer: (
        <span>
          Please chat with us for any points-related queries.
        </span>
      )
    },
    {
      question: "I have other issues",
      answer: (
        <span>
          Please visit our contact page for more ways to get in touch.
        </span>
      )
    }
  ];

  return (
    <div className="bg-background py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-headline text-4xl md:text-5xl">Help & FAQ</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Have questions? We're here to help. Find answers to common queries below.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem value={`item-${index}`} key={index}>
                <AccordionTrigger className="text-lg text-left">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-16 text-center border-t pt-12">
            <h2 className="font-headline text-3xl">Still Need Help?</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              If you can't find the answer you're looking for, please don't hesitate to contact us.
            </p>
            <div className="mt-8 flex flex-col md:flex-row justify-center items-center gap-8">
              <div className="flex items-center gap-3">
                <Phone className="h-6 w-6 text-primary" />
                <span className="text-lg">{contactInfo.phone_number || 'Loading...'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-6 w-6 text-primary" />
                <span className="text-lg">{contactInfo.email || 'Loading...'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
