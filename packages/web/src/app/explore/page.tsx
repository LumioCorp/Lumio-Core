"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wallet } from "lucide-react";
import LumioLogo from "@/components/ui/LumioLogo";
import FilterBar from "@/components/investor/FilterBar";
import EventCard from "@/components/dashboard/EventCard";
import { events } from "@/data/mock";
import { useWallet } from "@/components/ui/WalletProvider";

function ConnectWalletButton() {
  const { isConnected, isLoading, displayAddress, connect } = useWallet();
  const router = useRouter();

  const handleClick = async () => {
    if (isConnected) {
      router.push("/dashboard/investor");
      return;
    }
    const addr = await connect();
    if (addr) {
      router.push("/dashboard/investor");
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className="flex items-center gap-2 rounded-full border border-[#2E2832] bg-[#1E1820] px-3.5 py-2 shadow-sm transition-all hover:border-[#444F55] hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)] disabled:opacity-60"
    >
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#252028]">
        <Wallet className="h-3.5 w-3.5 text-[#5A6068]" strokeWidth={1.2} />
      </div>
      <span className="hidden text-sm font-medium tracking-[-0.01em] text-[#E8EDEE] sm:block">
        {isLoading ? "Connecting..." : isConnected ? displayAddress : "Connect Wallet"}
      </span>
    </button>
  );
}

export default function ExplorePage() {
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");

  const filtered = events.filter((e) => {
    if (category !== "all" && e.category !== category) return false;
    if (status !== "all" && e.status !== status) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#18121A]">
      {/* Header */}
      <nav className="sticky top-0 z-50 border-b border-[#2E2832]/80 bg-[#18121A]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/">
            <LumioLogo size="md" />
          </Link>
          <ConnectWalletButton />
        </div>
      </nav>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[#FBFBFC]">
          Explore Events
        </h1>
        <p className="mt-1 text-sm text-[#8B9298]">
          Discover events to invest in and share the revenue.
        </p>

        <div className="mt-6">
          <FilterBar
            activeCategory={category}
            activeStatus={status}
            onCategoryChange={setCategory}
            onStatusChange={setStatus}
          />
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-[#8B9298]">No events match your filters.</p>
            <button
              onClick={() => { setCategory("all"); setStatus("all"); }}
              className="mt-2 text-sm text-[#3B82F6] hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((event, i) => (
              <EventCard
                key={event.id}
                event={event}
                href={`/dashboard/investor/event/${event.id}`}
                index={i}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
