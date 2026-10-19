// Small brand marks for the two cards we accept (drawn by us, not the official artwork).
//   <CardBrandLogo brand="VISA" />   <CardBrandLogo brand="MASTERCARD" onCard />
// `onCard` = drawn on the dark card preview (white Visa text); otherwise for light/dark page backgrounds.
function CardBrandLogo({ brand, onCard = false, className = '' }) {
  if (brand === 'VISA') {
    return (
      <span
        className={`font-sans text-[1.35em] leading-none font-black tracking-tight italic ${onCard ? 'text-white' : 'text-[#1a1f71] dark:text-white'} ${className}`}
        aria-label="Visa"
        role="img"
      >
        VISA
      </span>
    );
  }
  if (brand === 'MASTERCARD') {
    return (
      <svg viewBox="0 0 38 24" className={`h-[1.5em] w-auto ${className}`} role="img" aria-label="Mastercard">
        <circle cx="13" cy="12" r="10" fill="#eb001b" />
        <circle cx="25" cy="12" r="10" fill="#f79e1b" />
        <path d="M19 4a10 10 0 0 1 0 16a10 10 0 0 1 0-16z" fill="#ff5f00" />
      </svg>
    );
  }
  return null;
}

export default CardBrandLogo;
