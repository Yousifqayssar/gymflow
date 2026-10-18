// Example partner gyms around Istanbul for the home page map. Names, addresses and phone numbers
// are made up for the demo; the positions are real districts, so the map looks right.
const WEEKDAYS = (open, close) => [1, 2, 3, 4, 5].map((day) => ({ day, open, close }));

export const DEMO_PARTNER_GYMS = [
  {
    name: 'Besiktas Strength Studio',
    address: 'Example Street 5',
    district: 'Besiktas, Istanbul',
    phone: '+90 212 000 00 01',
    latitude: 41.0428,
    longitude: 29.0075,
    hours: [...WEEKDAYS('06:00', '23:00'), { day: 6, open: '08:00', close: '22:00' }, { day: 7, open: '09:00', close: '20:00' }],
  },
  {
    name: 'Sisli Active Club',
    address: 'Example Avenue 21',
    district: 'Sisli, Istanbul',
    phone: '+90 212 000 00 02',
    latitude: 41.0602,
    longitude: 28.9877,
    hours: [...WEEKDAYS('07:00', '22:00'), { day: 6, open: '09:00', close: '18:00' }],
  },
  {
    name: 'Atasehir Fitness Park',
    address: 'Example Boulevard 8',
    district: 'Atasehir, Istanbul',
    phone: '+90 216 000 00 03',
    latitude: 40.9923,
    longitude: 29.1244,
    // Open every day and long hours
    hours: [1, 2, 3, 4, 5, 6, 7].map((day) => ({ day, open: '05:00', close: '23:59' })),
  },
  {
    name: 'Bakirkoy Seaside Gym',
    address: 'Example Coast Road 3',
    district: 'Bakirkoy, Istanbul',
    phone: null,
    latitude: 40.9819,
    longitude: 28.8719,
    hours: [...WEEKDAYS('06:30', '22:30'), { day: 6, open: '08:00', close: '20:00' }, { day: 7, open: '10:00', close: '18:00' }],
  },
  {
    name: 'Uskudar Yoga & Pilates House',
    address: 'Example Lane 14',
    district: 'Uskudar, Istanbul',
    phone: '+90 216 000 00 05',
    latitude: 41.0255,
    longitude: 29.0154,
    hours: [...WEEKDAYS('08:00', '21:00')],
  },
];

// Creates the demo partner gyms, or refreshes them if they already exist (matched by name).
export async function seedDemoPartnerGyms(prisma) {
  for (const gym of DEMO_PARTNER_GYMS) {
    await prisma.partnerGym.upsert({ where: { name: gym.name }, update: gym, create: gym });
  }
  return DEMO_PARTNER_GYMS.length;
}

// Removes only the demo partner gyms (gyms an admin added stay).
export async function removeDemoPartnerGyms(prisma) {
  await prisma.partnerGym.deleteMany({ where: { name: { in: DEMO_PARTNER_GYMS.map((g) => g.name) } } });
}
