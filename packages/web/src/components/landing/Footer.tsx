export default function Footer() {
  return (
    <footer className="border-t border-border bg-bg-card py-8 px-4">
      <div className="max-w-5xl mx-auto flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-sm text-text-secondary">Lumio &copy; 2026 &bull; Built on Stellar</p>
        <div className="flex gap-6 text-sm text-text-secondary">
          <a href="#" className="hover:text-text-primary transition-colors">Documentation</a>
          <a href="#" className="hover:text-text-primary transition-colors">GitHub</a>
          <a href="#" className="hover:text-text-primary transition-colors">Twitter</a>
        </div>
      </div>
    </footer>
  );
}
