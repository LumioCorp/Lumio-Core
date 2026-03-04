"use client";

import { useState, useEffect } from "react";
import * as api from "@/lib/api";
import { events as mockEvents } from "@/data/mock";
import type { LumioEvent } from "@/types";
import EventCard from "@/components/dashboard/EventCard";
import FilterBar from "@/components/investor/FilterBar";

export default function ExploreEvents() {
  const [events, setEvents] = useState<LumioEvent[]>(mockEvents);
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    api
      .getEvents()
      .then((data) => setEvents(data as unknown as LumioEvent[]))
      .catch(() => {
        // API unavailable — keep mock data as fallback
      });
  }, []);

  const filtered = events.filter((e) => {
    if (category !== "all" && e.category !== category) return false;
    if (status !== "all" && e.status !== status) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <FilterBar
        activeCategory={category}
        activeStatus={status}
        onCategoryChange={setCategory}
        onStatusChange={setStatus}
      />

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-text-secondary">No events match your filters.</p>
          <button
            onClick={() => { setCategory("all"); setStatus("all"); }}
            className="mt-2 text-sm text-accent-blue hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-[var(--spacing-gap)] md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((event, i) => (
            <EventCard key={event.id} event={event} href={`/dashboard/investor/event/${event.id}`} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
