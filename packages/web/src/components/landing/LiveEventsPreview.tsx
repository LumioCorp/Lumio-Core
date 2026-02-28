"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, ArrowRight } from "lucide-react";
import { events } from "@/data/mock";
import EventCard from "@/components/dashboard/EventCard";

export default function LiveEventsPreview() {
  const fundingOpen = events.filter((e) => e.status === "funding_open").slice(0, 3);

  return (
    <section className="bg-[#1E1820]/60 py-24 px-6">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end"
        >
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#5A6068]">
              Currently Funding
            </p>
            <h2 className="font-[family-name:var(--font-space-grotesk,var(--font-dm-sans))] text-3xl font-semibold tracking-[-0.03em] text-[#FBFBFC] sm:text-4xl">
              Live Events
            </h2>
          </div>
          <Link
            href="/dashboard/investor/explore"
            className="inline-flex items-center gap-1 text-sm font-semibold text-accent-blue transition-colors hover:text-blue-400"
          >
            View all events
            <ChevronRight className="h-4 w-4" />
          </Link>
        </motion.div>

        {/* Event cards grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {fundingOpen.map((event, i) => (
            <EventCard
              key={event.id}
              event={event}
              href={`/dashboard/investor/event/${event.id}`}
              index={i}
            />
          ))}
        </div>

        {/* CTA bottom */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 overflow-hidden rounded-3xl border border-[#2E2832] bg-[#1E1820] px-8 py-10 text-center shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
        >
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#5A6068]">
            Ready to start?
          </p>
          <h3 className="font-[family-name:var(--font-space-grotesk,var(--font-dm-sans))] mb-3 text-2xl font-semibold tracking-[-0.02em] text-[#FBFBFC]">
            Fund your next event. Or invest in one.
          </h3>
          <p className="mx-auto mb-8 max-w-md text-sm leading-relaxed tracking-[-0.01em] text-[#8B9298]">
            Whether you&apos;re an investor looking for real yield or an organizer ready to
            unlock on-chain crowdfunding — Lumio is for you.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/dashboard/investor"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-dominant to-blue-400 px-6 py-3 text-sm font-semibold tracking-[-0.01em] text-white shadow-md shadow-dominant/20 transition-opacity hover:opacity-90"
            >
              <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent"
                animate={{ x: ["-130%", "230%"] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "linear", repeatDelay: 2.5 }}
              />
              <span className="relative">Start Investing</span>
              <ArrowRight className="relative h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.5} />
            </Link>
            <Link
              href="/dashboard/organizer/create"
              className="inline-flex items-center gap-2 rounded-full border border-[#2E2832] bg-[#1E1820] px-6 py-3 text-sm font-semibold tracking-[-0.01em] text-[#E8EDEE] shadow-sm transition-all hover:border-[#444F55] hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
            >
              Create an Event
              <ArrowRight className="h-4 w-4 text-[#5A6068]" strokeWidth={1.5} />
            </Link>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
