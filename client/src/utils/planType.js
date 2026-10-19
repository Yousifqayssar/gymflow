// Membership types: a plan with 0 classes per month is Basic (gym only), otherwise Premium.
export function planType(classesPerMonth) {
  return classesPerMonth > 0
    ? { type: 'PREMIUM', label: 'Premium', detail: `${classesPerMonth} ${classesPerMonth === 1 ? 'class' : 'classes'} a month` }
    : { type: 'BASIC', label: 'Basic', detail: 'Gym only' };
}
