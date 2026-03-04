"use client";

import { TrustlessWorkConfig, development } from "@trustless-work/escrow";
import type { ReactNode } from "react";

const TW_API_KEY = process.env.NEXT_PUBLIC_TW_API_KEY || "";

export function TrustlessWorkProvider({ children }: { children: ReactNode }) {
  return (
    <TrustlessWorkConfig baseURL={development} apiKey={TW_API_KEY}>
      {children}
    </TrustlessWorkConfig>
  );
}
