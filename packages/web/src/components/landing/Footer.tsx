import Link from "next/link";
import LumioLogo from "@/components/ui/LumioLogo";

const NAV_LINKS = {
  Platform: [
    { label: "Explore Events",  href: "/dashboard/investor/explore" },
    { label: "My Portfolio",    href: "/dashboard/investor/portfolio" },
    { label: "Create Event",    href: "/dashboard/organizer/create" },
    { label: "My Events",       href: "/dashboard/organizer/events" },
  ],
  Resources: [
    { label: "How it works",    href: "#" },
    { label: "Documentation",   href: "#" },
    { label: "GitHub",          href: "#" },
    { label: "Twitter",         href: "#" },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-[#2E2832] bg-[#18121A] px-6 py-14">
      <div className="mx-auto max-w-5xl">

        {/* Top row: brand + links */}
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">

          {/* Brand column */}
          <div className="max-w-xs">
            <LumioLogo size="sm" />
            <p className="mt-4 text-sm leading-relaxed tracking-[-0.01em] text-[#8B9298]">
              Lumio tokenizes real-world events so anyone can invest and share the revenue.
              Transparent, on-chain, and powered by Stellar.
            </p>
            {/* Stellar badge */}
            <p className="mt-5 text-[10px] font-medium tracking-[0.04em] text-[#444F55]">
              ⬡ Built on Stellar Network · USDC · Testnet
            </p>
          </div>

          {/* Nav columns */}
          <div className="flex gap-14">
            {Object.entries(NAV_LINKS).map(([section, links]) => (
              <div key={section}>
                <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.12em] text-[#5A6068]">
                  {section}
                </p>
                <ul className="space-y-2.5">
                  {links.map(({ label, href }) => (
                    <li key={label}>
                      <Link
                        href={href}
                        className="text-sm font-medium tracking-[-0.01em] text-[#8B9298] transition-colors hover:text-[#FBFBFC]"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="my-8 border-t border-[#2E2832]" />

        {/* Bottom row */}
        <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="text-sm tracking-[-0.01em] text-[#8B9298]">
            Lumio &copy; 2026 &bull; Built on Stellar
          </p>
          <div className="flex items-center gap-1.5">
            {["Trustless", "USDC", "Open Source"].map((tag, i) => (
              <span key={tag} className="flex items-center gap-1.5">
                {i > 0 && <span className="h-1 w-1 rounded-full bg-[#2E2832]" />}
                <span className="text-[11px] font-medium tracking-[0.02em] text-[#5A6068]">{tag}</span>
              </span>
            ))}
          </div>
        </div>

      </div>
    </footer>
  );
}
