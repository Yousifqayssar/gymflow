import { CATEGORY_DISPLAY } from '../../utils/classDisplay.js';

// The header of a class: a photo of the activity, tinted in the category's colours,
// with a dark fade at the bottom so white text on top is always readable.
//   size="card"   → header of a schedule card (photo loads lazily, when scrolled into view)
//   size="banner" → big banner on the class detail page
function ClassBanner({ category, size = 'card', className = '', children }) {
  const { photo, gradient } = CATEGORY_DISPLAY[category];

  return (
    <div className={`relative isolate overflow-hidden bg-gradient-to-br text-white ${gradient} ${className}`}>
      {/* The photo is decorative (the title says what the class is), so alt="" */}
      <img
        src={photo}
        alt=""
        loading={size === 'card' ? 'lazy' : 'eager'}
        className="absolute inset-0 -z-30 size-full object-cover"
      />
      {/* Colour tint in the category's colours: every class keeps its own colour identity */}
      <div aria-hidden="true" className={`absolute inset-0 -z-20 bg-gradient-to-br opacity-50 mix-blend-multiply ${gradient}`} />
      {/* Dark fade at the bottom for readable text */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-black/75 via-black/25 to-black/10" />
      {children}
    </div>
  );
}

export default ClassBanner;
