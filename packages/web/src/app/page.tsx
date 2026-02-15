import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import Features from "@/components/landing/Features";
import LiveEventsPreview from "@/components/landing/LiveEventsPreview";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <Features />
      <LiveEventsPreview />
      <Footer />
    </>
  );
}
