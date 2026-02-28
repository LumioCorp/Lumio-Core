"use client";

import { motion } from "framer-motion";
import { Calendar, CircleDollarSign, ArrowRightLeft } from "lucide-react";

const steps = [
  {
    icon: Calendar,
    title: "Organizer Creates Event",
    description:
      "An event organizer lists their event, defines a funding goal and revenue share, and deposits collateral on-chain as a trust guarantee.",
  },
  {
    icon: CircleDollarSign,
    title: "Investors Buy Tokens",
    description:
      "Anyone can buy tokens with USDC. Each token grants a proportional right to a share of real event revenue, paid out automatically after the event.",
  },
  {
    icon: ArrowRightLeft,
    title: "Revenue is Distributed",
    description:
      "After the event, revenue flows automatically to token holders through trustless escrow. No intermediaries, no delays, no surprises.",
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-[#1E1820]/50 py-24 px-6">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-[#5A6068]">
            Simple by Design
          </p>
          <h2 className="font-[family-name:var(--font-space-grotesk,var(--font-dm-sans))] text-3xl font-semibold tracking-[-0.03em] text-[#FBFBFC] sm:text-4xl">
            How It Works
          </h2>
        </motion.div>

        {/* Step cards */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="relative rounded-2xl border border-[#2E2832] bg-[#1E1820] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.2)] transition-all duration-200 hover:-translate-y-px hover:border-[#444F55] hover:shadow-[0_6px_24px_rgba(0,0,0,0.3)]"
              >
                {/* Número de paso */}
                <div className="absolute right-5 top-5 font-[family-name:var(--font-space-grotesk,var(--font-dm-sans))] text-[2.5rem] font-semibold leading-none text-[#252028] select-none">
                  {i + 1}
                </div>

                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-[#252028]">
                  <Icon className="h-5 w-5 text-[#8B9298]" strokeWidth={1.2} />
                </div>

                <h3 className="font-[family-name:var(--font-space-grotesk,var(--font-dm-sans))] mb-2 text-[15px] font-semibold tracking-[-0.02em] text-[#FBFBFC]">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed tracking-[-0.01em] text-[#8B9298]">
                  {step.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
