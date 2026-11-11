import React from "react";
import { ScrollReelTestimonials } from "@/components/ui/scroll-reel-testimonials";

const TESTIMONIALS = [
  {
    quote: "Big effort - high quality. Best Framer content out there.",
    author: "Jan Dittrich",
    image:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    alt: "Portrait of Jan Dittrich",
  },
  {
    quote:
      "I'm building a new website and it's absolutely ridiculous how valuable your content has been.",
    author: "Michael Riddering",
    image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80",
    alt: "Portrait of Michael Riddering",
  },
  {
    quote: "Way too much value for free to be honest.",
    author: "James Traf",
    image:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
    alt: "Portrait of James Traf",
  },
];

export default function DemoOne() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <ScrollReelTestimonials testimonials={TESTIMONIALS} />
    </div>
  );
}
