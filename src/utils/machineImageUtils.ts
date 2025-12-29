export const getMachineImageUrl = (machineName: string): string => {
  const name = machineName.toLowerCase();
  
  // Map machine names to match WorkoutHub images exactly
  // Chest Machines
  if (name.includes('chest') && name.includes('press') && !name.includes('incline') && !name.includes('decline')) return '/lovable-uploads/72acfefe-3a0e-4d74-b92f-ce88b0a38d7e.png';
  if (name.includes('pec') && name.includes('deck')) return '/lovable-uploads/af389dea-9b59-4435-99bb-8c851f048940.png';
  if (name.includes('incline') && name.includes('chest')) return '/lovable-uploads/a0730c0a-c88b-43fa-b6d0-fad9941cc39b.png';
  if (name.includes('decline') && name.includes('chest')) return '/lovable-uploads/441054b5-1d0c-492c-8f79-e4a3eb26c822.png';
  if (name.includes('cable') && name.includes('crossover')) return '/lovable-uploads/ee18485a-269f-4a98-abe3-54fab538f201.png';
  if (name.includes('smith') && name.includes('machine')) return '/lovable-uploads/55d72a0c-1e5a-4d6f-abfa-edfe80701063.png';
  if (name.includes('seated') && name.includes('dip')) return '/lovable-uploads/2659df27-2ead-4acf-ace3-edd4b33cad78.png';
  if (name.includes('assisted') && name.includes('dip')) return '/lovable-uploads/0d9b2a95-f255-4a68-a040-7998a9ffb1cf.png';
  
  // Back Machines - CRITICAL: Check for "row" before other back exercises
  if (name.includes('seated') && (name.includes('row') || name.includes('cable row'))) return '/lovable-uploads/c38c89e5-0aa7-45e8-954a-109f4e471db7.png';
  if (name.includes('t-bar') && name.includes('row')) return '/lovable-uploads/29c29f8b-9b3a-4013-ac88-068a86133fae.png';
  if (name.includes('lat') && name.includes('pulldown')) return '/lovable-uploads/f42105be-a95d-44b0-8d72-a77b6cbffee1.png';
  
  // Shoulder Machines
  if (name.includes('shoulder') && name.includes('press')) return '/lovable-uploads/61f89507-de07-4a05-82a5-5114ac500e76.png';
  if (name.includes('lateral') && name.includes('raise')) return '/lovable-uploads/28009a8a-51b5-4196-bd00-c1ad68b67bc0.png';
  
  // Arm Machines
  if (name.includes('tricep') && name.includes('pushdown')) return '/lovable-uploads/triceps-pushdown-machine-red.png';
  if (name.includes('seated') && name.includes('dip')) return '/lovable-uploads/seated-dip-machine-red.png';
  if (name.includes('hoist') && name.includes('bicep')) return '/lovable-uploads/hoist-biceps-curl-machine-red.png';
  if (name.includes('bicep') && name.includes('curl') && !name.includes('preacher')) return '/lovable-uploads/461c8b1b-3cee-4b38-b257-23671d035d6d.png';
  if (name.includes('preacher') && name.includes('curl')) return '/lovable-uploads/9b6efa63-f917-4f9e-8b82-31076b66aff5.png';
  if (name.includes('tricep') && name.includes('dip')) return '/lovable-uploads/81dac889-b82f-4359-a3a6-a77b066d007c.png';
  
  // Core Machines
  if (name.includes('abdominal') || name.includes('ab crunch') || name.includes('crunch machine')) return '/lovable-uploads/abdominal-crunch-machine-hoist-red.png';
  
  // Leg Machines
  if (name.includes('leg') && name.includes('press')) return '/lovable-uploads/f62a3fb2-b5ea-4582-b7ff-550a03b3c767.png';
  if (name.includes('leg') && name.includes('extension')) return '/lovable-uploads/2bdee4e4-d58f-4a51-96fc-5d7e92eeced9.png';
  if (name.includes('leg') && name.includes('curl')) return '/lovable-uploads/8b855abd-c6fe-4cef-9549-7c3a6cd70fae.png';
  
  // Functional Machines
  if (name.includes('rope') && name.includes('trainer')) return '/assets/marpo-rope-trainer-red.png';
  if (name.includes('marpo')) return '/assets/marpo-rope-trainer-red.png';
  
  // Cardio Machines
  if (name.includes('treadmill')) return '/lovable-uploads/6630a6e4-06d7-48ce-9212-f4d4991f4b35.png';
  if (name.includes('rowing') && name.includes('machine')) return '/lovable-uploads/ac6dd467-37ab-4e6a-9ecc-d7e6ecb97913.png';
  if (name.includes('stairmaster')) return '/lovable-uploads/53858814-478c-431c-8c54-feecf0b00e19.png';
  
  // Default fallback image (Leg Press Machine)
  return '/lovable-uploads/f62a3fb2-b5ea-4582-b7ff-550a03b3c767.png';
};