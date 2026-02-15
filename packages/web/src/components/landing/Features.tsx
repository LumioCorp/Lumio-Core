"use client";

import { motion } from "framer-motion";
import { Shield, Coins, Eye, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Trustless Escrow",
    description: "Funds are secured in Soroban smart contracts. No one can move them outside the rules.",
  },
  {
    icon: Coins,
    title: "Revenue Share Tokens",
    description: "Each token represents a real right to a share of event revenue. Not speculation — real cashflow.",
  },
  {
    icon: Eye,
    title: "Transparent & Auditable",
    description: "Every transaction on Stellar. Revenue, distributions, and rules are publicly verifiable.",
  },
  {
    icon: ShieldCheck,
    title: "All-or-Nothing Funding",
    description: "If the funding goal isn't met, all investors get automatic refunds. Zero risk of partial deployment.",
  },
];

export default function Features() {
  return (
    <section className="bg-bg-primary py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-bold text-text-primary text-center mb-12"
        >
          Key Features
        </motion.h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="rounded-[var(--radius-card)] border border-border bg-bg-card p-6 shadow-card"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                  <Icon className="h-5 w-5 text-accent-blue" />
                </div>
                <h3 className="text-base font-bold text-text-primary mb-1">{feature.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
