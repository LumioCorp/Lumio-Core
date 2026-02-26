"use client";

import { motion } from "framer-motion";
import { Shield, Coins, Eye, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Trustless Escrow",
    description:
      "Funds are secured in on-chain escrow contracts. No one can move them outside the agreed rules — not even Lumio.",
  },
  {
    icon: Coins,
    title: "Revenue Share Tokens",
    description:
      "Each token represents a real right to a share of event revenue. Not speculation — actual cashflow tied to event performance.",
  },
  {
    icon: Eye,
    title: "Transparent & Auditable",
    description:
      "Every transaction is recorded on Stellar. Revenue, distributions, and escrow rules are publicly verifiable by anyone.",
  },
  {
    icon: ShieldCheck,
    title: "All-or-Nothing Funding",
    description:
      "If the funding goal isn't met, all investors receive automatic refunds. Zero risk of partial deployment or stranded capital.",
  },
];

export default function Features() {
  return (
    <section className="bg-white py-24 px-6" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(1,2,33,0.03) 1px, transparent 0)", backgroundSize: "28px 28px" }}>
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <p className="mb-2 text-[10px] font-medium tracking-[0.14em] uppercase text-slate-400">
            Why Lumio
          </p>
          <h2 className="font-[family-name:var(--font-space-grotesk,var(--font-dm-sans))] text-3xl font-semibold tracking-[-0.03em] text-dominant sm:text-4xl">
            Built for Trust
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed tracking-[-0.01em] text-slate-400">
            Every feature of Lumio is designed to protect investors and give organizers the tools
            to run transparent, accountable campaigns.
          </p>
        </motion.div>

        {/* Feature cards — paleta unificada, sin color decorativo */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                className="group rounded-2xl border border-slate-200/50 bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-200 hover:-translate-y-px hover:border-slate-200 hover:shadow-[0_6px_24px_rgba(0,0,0,0.05)]"
              >
                {/* Ícono — tono neutro, strokeWidth fino */}
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
                  <Icon className="h-[18px] w-[18px] text-slate-500" strokeWidth={1.2} />
                </div>
                <h3 className="font-[family-name:var(--font-space-grotesk,var(--font-dm-sans))] mb-1.5 text-[15px] font-semibold tracking-[-0.02em] text-slate-900">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed tracking-[-0.01em] text-slate-400">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
