// A member's journey in FOLK. Stored on users/{uid}.stage. Older profiles
// have a numeric `level` ('1'–'5'); stageOf() maps those onto the same scale.
export const STAGES = [
  { id: 'new', label: 'New', desc: 'Recently joined or attended a first program' },
  { id: 'regular', label: 'Regular', desc: 'Comes to weekly programs' },
  { id: 'practising', label: 'Practising', desc: 'Chants daily and follows the basics' },
  { id: 'committed', label: 'Committed', desc: 'Chants 16 rounds and serves regularly' },
  { id: 'resident', label: 'Resident', desc: 'Lives in the FOLK residency' },
];

export const stageOf = (user) => {
  if (user?.stage && STAGES.some((s) => s.id === user.stage)) return user.stage;
  const n = parseInt(user?.level, 10);
  return Number.isInteger(n) && n >= 1 && n <= STAGES.length ? STAGES[n - 1].id : 'new';
};

export const stageLabel = (id) => STAGES.find((s) => s.id === id)?.label || 'New';

// Daily chanting target most members work towards.
export const ROUNDS_TARGET = 16;
