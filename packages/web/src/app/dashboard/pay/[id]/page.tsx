"use client";

import { use, useState } from "react";
import Link from "next/link";
import { Minus, Plus } from "lucide-react";
import { events } from "@/data/mock";
import { formatUSDC, formatDate } from "@/lib/utils";
import { ToastProvider, useToast } from "@/components/ui/Toast";

function PayContent({ id }: { id: string }) {
  const event = events.find((e) => e.id === id);
  const { showToast } = useToast();
  const [quantity, setQuantity] = useState(1);

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary">
        <div className="text-center">
          <p className="text-text-secondary">Event not found.</p>
          <Link href="/" className="mt-2 text-sm text-accent-blue hover:underline block">Go home</Link>
        </div>
      </div>
    );
  }

  const total = quantity * event.ticketPrice;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-primary px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 block text-2xl font-bold tracking-wide text-dominant">
          Lumio
        </Link>

        <div className="rounded-[var(--radius-card)] border border-border bg-bg-card p-8 shadow-card">
          <h1 className="text-xl font-bold text-text-primary">{event.name}</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {formatDate(event.eventDate)} &middot; {event.location}
          </p>

          <div className="mt-6 space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Ticket Price</span>
              <span className="font-medium">{event.ticketPrice} USDC</span>
            </div>

            <div>
              <label className="text-sm text-text-secondary mb-1.5 block">Quantity</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-bg-primary"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center text-lg font-bold">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-bg-primary"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex justify-between rounded-lg bg-bg-primary p-3 text-sm">
              <span className="text-text-secondary">Total</span>
              <span className="font-bold text-text-primary">{formatUSDC(total)} USDC</span>
            </div>

            <button
              onClick={() => showToast(`Payment of ${formatUSDC(total)} USDC confirmed!`)}
              className="w-full rounded-[var(--radius-btn)] bg-dominant py-3 text-sm font-bold text-white hover:bg-dominant-hover transition-colors"
            >
              Pay with USDC
            </button>

            <p className="text-xs text-text-tertiary text-center">Payment processed on Stellar network</p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-text-tertiary">Powered by Lumio</p>
      </div>
    </div>
  );
}

export default function LumioPayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <ToastProvider>
      <PayContent id={id} />
    </ToastProvider>
  );
}
