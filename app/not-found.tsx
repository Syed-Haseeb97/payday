import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="max-w-md w-full p-8 rounded-2xl bg-white border border-[#C8C2B5] shadow-xs space-y-4">
        <span className="font-mono text-xs uppercase tracking-wider text-[#86560D] font-semibold bg-[#F6ECD9] px-3 py-1 rounded-full border border-[#86560D]/20">
          404 Not Found
        </span>
        <h1 className="font-serif text-3xl text-[#16181D]">Page Not Found</h1>
        <p className="text-sm text-[#5F626A]">
          The page or payment link you requested could not be found or has expired.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-[#16181D] text-[#F5F3EE] text-sm font-medium hover:bg-[#2A2D34] transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
