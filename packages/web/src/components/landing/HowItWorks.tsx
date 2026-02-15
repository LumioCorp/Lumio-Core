"use client";

import { motion } from "framer-motion";
import { Calendar, CircleDollarSign, ArrowRightLeft } from "lucide-react";

const steps = [
  {
    icon: Calendar,
    title: "Organizer Creates Event",
    description: "An event organizer lists their event, defines funding goal and revenue share, and deposits collateral.",
  },
  {
    icon: CircleDollarSign,
    title: "Investors Buy Tokens",
    description: "Anyone can buy tokens with USDC. Each token = proportional right to event revenue.",
  },
  {
    icon: ArrowRightLeft,
    title: "Revenue is Distributed",
    description: "After the event, revenue is automatically distributed to token holders via smart escrow.",
  },
];

export default function HowItWorks() {
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
          How It Works
        </motion.h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50">
                  <Icon className="h-7 w-7 text-accent-blue" />
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-2">{step.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{step.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
