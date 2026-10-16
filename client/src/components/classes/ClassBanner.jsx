import { CATEGORY_DISPLAY } from '../../utils/classDisplay.js';

// The colourful header of a class: the category's gradient, a large icon in the
// background like a watermark, and decorative circles. Content is placed on top.
//   size="card"   → header of a schedule card
//   size="banner" → big banner on the class detail page
function ClassBanner({ category, size = 'card', className = '', children }) {
  const { icon: Icon, gradient } = CATEGORY_DISPLAY[category];
  const isBanner = size === 'banner';

  return (
    <div className={`relative isolate overflow-hidden bg-gradient-to-br text-white ${gradient} ${className}`}>
      {/* Decorative shapes; aria-hidden because they carry no information. */}
      <div aria-hidden="true" className="absolute -top-10 -left-10 -z-10 size-40 rounded-full bg-white/10" />
      <Icon
        aria-hidden="true"
        strokeWidth={1.5}
        className={`absolute -z-10 -rotate-12 text-white/25 ${
          isBanner ? '-right-6 -bottom-10 size-64' : '-right-5 -bottom-8 size-36'
        }`}
      />
      {children}
    </div>
  );
}

export default ClassBanner;
