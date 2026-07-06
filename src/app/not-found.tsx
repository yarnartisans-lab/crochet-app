import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col items-center justify-center text-center px-6">
      <h1 className="text-9xl font-extrabold text-gray-200 tracking-tighter">404</h1>
      <h2 className="text-2xl font-bold text-[#2D2D2D] mt-4">Page not found</h2>
      <p className="text-gray-500 mt-2 max-w-md">
        Sorry, we couldn't find the pattern or profile you're looking for. It might have been deleted or moved.
      </p>
      <Link href="/explore" className="mt-8 rounded-full bg-[#D97757] px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#C26243] transition-colors">
        Explore Patterns
      </Link>
    </div>
  );
}