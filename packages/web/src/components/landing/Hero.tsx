"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden bg-gradient-to-b from-[#010221] via-[#010221] to-bg-primary px-4">
      <div className="text-center max-w-3xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl"
        >
          Invest in Real Events.{" "}
          <span className="text-accent-blue">Earn Real Returns.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-6 text-lg text-gray-300 max-w-xl mx-auto"
        >
          Lumio tokenizes real-world events so anyone can invest in them and share the revenue. Powered by Stellar.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8"
        >
          <Link
            href="/dashboard/investor"
            className="inline-flex items-center rounded-[var(--radius-btn)] bg-accent-blue px-8 py-3.5 text-base font-bold text-white transition-colors hover:bg-blue-600"
          >
            Connect Wallet
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="mt-4 text-sm text-gray-500"
        >
          Built on Stellar &bull; Trustless &bull; USDC
        </motion.p>
      </div>
    </section>
  );
}
