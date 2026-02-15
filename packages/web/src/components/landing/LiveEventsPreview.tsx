"use client";

import { motion } from "framer-motion";
import { events } from "@/data/mock";
import EventCard from "@/components/dashboard/EventCard";

export default function LiveEventsPreview() {
  const fundingOpen = events.filter((e) => e.status === "funding_open").slice(0, 3);

  return (
    <section className="bg-white py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-bold text-text-primary text-center mb-12"
        >
          Live Events
        </motion.h2>
        <div className="grid grid-cols-1 gap-[var(--spacing-gap)] md:grid-cols-3">
          {fundingOpen.map((event, i) => (
            <EventCard key={event.id} event={event} href={`/dashboard/investor/event/${event.id}`} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
