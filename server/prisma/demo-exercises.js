// A starter exercise library (4 per muscle group). Added or refreshed by the demo seed and
// kept afterwards: it is library content, and workout plans will refer to it.
export const DEMO_EXERCISES = [
  // Chest
  { name: 'Bench press', muscleGroup: 'CHEST', equipment: 'BARBELL', description: 'Lie on the bench, lower the bar to the middle of your chest, then press it straight up until your arms are straight.' },
  { name: 'Incline dumbbell press', muscleGroup: 'CHEST', equipment: 'DUMBBELL', description: 'On a bench set to about 30 degrees, press the dumbbells up over your upper chest and lower them slowly.' },
  { name: 'Push-up', muscleGroup: 'CHEST', equipment: 'BODYWEIGHT', description: 'Hands under your shoulders, body in one straight line. Lower your chest to the floor and push back up.' },
  { name: 'Cable fly', muscleGroup: 'CHEST', equipment: 'CABLE', description: 'With slightly bent arms, bring the cable handles together in front of your chest in a wide arc.' },
  // Back
  { name: 'Deadlift', muscleGroup: 'BACK', equipment: 'BARBELL', description: 'Bar over the middle of your feet, flat back. Push the floor away and stand up tall, then lower the bar the same way.' },
  { name: 'Pull-up', muscleGroup: 'BACK', equipment: 'BODYWEIGHT', description: 'Hang from the bar, pull your chest towards it until your chin is over the bar, then lower with control.' },
  { name: 'Lat pulldown', muscleGroup: 'BACK', equipment: 'CABLE', description: 'Pull the bar down to your upper chest while leaning back slightly, then let it rise slowly.' },
  { name: 'Seated cable row', muscleGroup: 'BACK', equipment: 'CABLE', description: 'Sit tall and pull the handle to your belly, squeezing your shoulder blades together.' },
  // Legs
  { name: 'Back squat', muscleGroup: 'LEGS', equipment: 'BARBELL', description: 'Bar on your upper back, sit down between your heels with a straight back, then stand up again.' },
  { name: 'Leg press', muscleGroup: 'LEGS', equipment: 'MACHINE', description: 'Feet shoulder-wide on the platform. Lower the sled until your knees are bent about 90 degrees, then press back up.' },
  { name: 'Walking lunge', muscleGroup: 'LEGS', equipment: 'DUMBBELL', description: 'Take a long step forward and lower your back knee towards the floor. Push up and step through with the other leg.' },
  { name: 'Romanian deadlift', muscleGroup: 'LEGS', equipment: 'BARBELL', description: 'Slightly bent knees, push your hips back and lower the bar along your legs until you feel a stretch, then stand up.' },
  // Shoulders
  { name: 'Overhead press', muscleGroup: 'SHOULDERS', equipment: 'BARBELL', description: 'Standing, press the bar from your shoulders straight over your head. Keep your belly tight.' },
  { name: 'Dumbbell lateral raise', muscleGroup: 'SHOULDERS', equipment: 'DUMBBELL', description: 'Raise the dumbbells out to the sides until your arms are level with your shoulders, then lower slowly.' },
  { name: 'Face pull', muscleGroup: 'SHOULDERS', equipment: 'CABLE', description: 'Pull the rope towards your face with elbows high, pulling the ends apart at the end.' },
  { name: 'Arnold press', muscleGroup: 'SHOULDERS', equipment: 'DUMBBELL', description: 'Start with palms facing you, turn them outwards while pressing the dumbbells overhead.' },
  // Arms
  { name: 'Barbell curl', muscleGroup: 'ARMS', equipment: 'BARBELL', description: 'Elbows at your sides, curl the bar up to your shoulders and lower it slowly.' },
  { name: 'Hammer curl', muscleGroup: 'ARMS', equipment: 'DUMBBELL', description: 'Palms facing each other, curl the dumbbells up without swinging your body.' },
  { name: 'Triceps pushdown', muscleGroup: 'ARMS', equipment: 'CABLE', description: 'Elbows close to your body, push the bar or rope down until your arms are straight.' },
  { name: 'Bench dip', muscleGroup: 'ARMS', equipment: 'BODYWEIGHT', description: 'Hands on a bench behind you, lower your body by bending your elbows, then push back up.' },
  // Core
  { name: 'Plank', muscleGroup: 'CORE', equipment: 'BODYWEIGHT', description: 'On your forearms and toes, keep your body in one straight line and hold. Do not let your hips sag.' },
  { name: 'Hanging knee raise', muscleGroup: 'CORE', equipment: 'BODYWEIGHT', description: 'Hang from a bar and lift your knees towards your chest without swinging.' },
  { name: 'Cable crunch', muscleGroup: 'CORE', equipment: 'CABLE', description: 'Kneel below the cable, hold the rope at your head and curl your chest down towards your knees.' },
  { name: 'Russian twist', muscleGroup: 'CORE', equipment: 'KETTLEBELL', description: 'Sit leaning back slightly, feet off the floor, and turn the kettlebell from one side to the other.' },
  // Full body
  { name: 'Kettlebell swing', muscleGroup: 'FULL_BODY', equipment: 'KETTLEBELL', description: 'Hinge at the hips and swing the kettlebell up to chest height with a strong hip drive.' },
  { name: 'Burpee', muscleGroup: 'FULL_BODY', equipment: 'BODYWEIGHT', description: 'Squat down, jump your feet back into a push-up position, jump them forward again and jump up.' },
  { name: 'Thruster', muscleGroup: 'FULL_BODY', equipment: 'DUMBBELL', description: 'Squat with the dumbbells at your shoulders and press them overhead as you stand up.' },
  { name: 'Resistance band row', muscleGroup: 'FULL_BODY', equipment: 'BAND', description: 'Anchor the band in front of you, step back into a slight squat and row the band to your belly.' },
  // Cardio
  { name: 'Treadmill run', muscleGroup: 'CARDIO', equipment: 'CARDIO_MACHINE', description: 'Run at a steady pace you can still talk at. Use a 1% incline to feel like running outside.' },
  { name: 'Rowing machine', muscleGroup: 'CARDIO', equipment: 'CARDIO_MACHINE', description: 'Push with your legs first, then lean back and pull the handle to your lower ribs.' },
  { name: 'Stationary bike', muscleGroup: 'CARDIO', equipment: 'CARDIO_MACHINE', description: 'Set the seat so your knee is slightly bent at the bottom, and keep an even cadence.' },
  { name: 'Jump rope', muscleGroup: 'CARDIO', equipment: 'BODYWEIGHT', description: 'Small jumps on the balls of your feet, turning the rope with your wrists, not your arms.' },
];

export async function seedDemoExercises(prisma) {
  // Side by side instead of one after another: each upsert touches a different exercise.
  await Promise.all(DEMO_EXERCISES.map((exercise) => prisma.exercise.upsert({ where: { name: exercise.name }, update: exercise, create: exercise })));
  return DEMO_EXERCISES.length;
}
