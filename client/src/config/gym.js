// Information about the gym shown on the home page and in the footer.
// Everything here is example content for the demo – replace it with the real gym's details.

export const GYM = {
  name: 'GymFlow Fitness',
  tagline: 'Train smarter. Feel stronger. Every day.',
  founded: 2024,
  about:
    'GymFlow is a modern neighbourhood gym in the heart of Kadıköy. We combine a fully equipped training floor ' +
    'with small group classes and friendly, certified trainers – so beginners feel welcome and experienced athletes keep improving.',
  address: ['Example Street 12', 'Kadıköy, Istanbul'],
  phone: '+90 212 000 00 00',
  email: 'hello@gymflow.example',
};

// Opening hours in the gym's time zone. `days`: 1 = Monday … 7 = Sunday.
export const OPENING_HOURS = [
  { label: 'Monday – Friday', days: [1, 2, 3, 4, 5], open: '06:00', close: '23:00' },
  { label: 'Saturday', days: [6], open: '08:00', close: '22:00' },
  { label: 'Sunday', days: [7], open: '09:00', close: '20:00' },
];

// What makes the gym special (icons are chosen in AboutSection.jsx).
export const HIGHLIGHTS = [
  { key: 'equipment', title: 'Modern equipment', text: 'Free weights, racks, cardio machines and a cycling room – all maintained every week.' },
  { key: 'trainers', title: 'Certified trainers', text: 'Every class is led by a qualified trainer who adapts the workout to your level.' },
  { key: 'classes', title: 'Classes for everyone', text: 'From calm yoga to HIIT and boxing – book your spot in seconds in the app.' },
  { key: 'flexible', title: 'Flexible plans', text: 'Monthly, 3-month or yearly memberships. Check in with your QR code, no card needed.' },
];

// Social media accounts. Example links to the platforms – replace them with the gym's own pages.
export const SOCIAL_LINKS = [
  { platform: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/' },
  { platform: 'facebook', label: 'Facebook', url: 'https://www.facebook.com/' },
  { platform: 'x', label: 'X (Twitter)', url: 'https://x.com/' },
  { platform: 'youtube', label: 'YouTube', url: 'https://www.youtube.com/' },
];
