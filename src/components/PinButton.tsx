'use client';

interface PinButtonProps {
  slug: string;
  title: string;
  imageUrl: string;
  designerName?: string;
  className?: string;
}

export default function PinButton({
  slug,
  title,
  imageUrl,
  designerName,
  className = '',
}: PinButtonProps) {
  const handlePin = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (typeof window === 'undefined') return;

    const pageUrl = `${window.location.origin}/pattern/${slug}`;
    const designerCredit = designerName ? ` by @${designerName}` : '';
    const pinDescription = `Free ${title} crochet pattern${designerCredit} with interactive row tracking on Crpapo!`;
    const pinUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(
      pageUrl
    )}&media=${encodeURIComponent(imageUrl)}&description=${encodeURIComponent(pinDescription)}`;

    window.open(pinUrl, '_blank', 'noopener,noreferrer,width=750,height=600');
  };

  return (
    <button
      type="button"
      onClick={handlePin}
      title="Save to Pinterest"
      aria-label={`Save ${title} to Pinterest`}
      className={`bg-[#E60023] hover:bg-[#ad081b] text-white p-2 rounded-full shadow-md transition-all flex items-center gap-1.5 text-xs font-bold hover:scale-105 active:scale-95 z-20 ${className}`}
    >
      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
      </svg>
      <span className="hidden sm:inline font-semibold">Pin</span>
    </button>
  );
}