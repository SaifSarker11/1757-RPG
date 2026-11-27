/** The 1757 crest: an ornamental gold seal with a "17/57" monogram, in the spirit of the Tabletales mark. */
export function Seal({ className = "h-12 w-12" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" stroke="currentColor" aria-hidden="true">
      <circle cx="32" cy="32" r="19" strokeWidth="1.4" />
      <circle cx="32" cy="32" r="15.5" strokeWidth=".7" />
      {Array.from({ length: 8 }).map((_, i) => (
        <g key={i} transform={`rotate(${i * 45} 32 32)`}>
          <path d="M32 3.5c2.2 3 2.2 5.6 0 8.5-2.2-2.9-2.2-5.5 0-8.5Z" fill="currentColor" stroke="none" />
          <path d="M27.5 9.5c1.5 1.6 3 2 4.5 2s3-.4 4.5-2" strokeWidth=".9" strokeLinecap="round" />
        </g>
      ))}
      <text x="32" y="30" textAnchor="middle" fill="currentColor" stroke="none" fontFamily="var(--font-display)" fontWeight="700" fontSize="10.5">17</text>
      <path d="M24 32.5h16" strokeWidth=".7" />
      <text x="32" y="42.5" textAnchor="middle" fill="currentColor" stroke="none" fontFamily="var(--font-display)" fontWeight="700" fontSize="10.5">57</text>
    </svg>
  );
}
