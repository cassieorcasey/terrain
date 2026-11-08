/** Empat pulau dengan satu titik hub di tengah, sama dengan favicon. */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="logo">
      <rect width="64" height="64" rx="14" fill="#16212b" />
      <path d="M14 22c4-6 12-7 16-3s-1 11-7 12-12-3-9-9z" fill="#8fc3a6" />
      <path d="M36 15c6-2 13 2 13 8s-6 8-11 6-8-12-2-14z" fill="#e4b97a" />
      <path d="M12 42c2-6 11-8 15-4s0 11-6 12-11-2-9-8z" fill="#9ab4e6" />
      <path d="M37 37c6-3 14 1 14 8s-8 9-13 6-7-11-1-14z" fill="#d79ab8" />
      <circle cx="32" cy="32" r="4.5" fill="#fff" />
    </svg>
  );
}
