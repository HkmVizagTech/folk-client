// A short Bhagavad-gita thought for each day, shown on the member home.
// Same verse for everyone all day (picked by the date in IST), so members
// see one shared sloka to reflect on — like the verse board at the temple.
// Renderings are our own short paraphrases.

export const MAHA_MANTRA =
  'Hare Krishna Hare Krishna Krishna Krishna Hare Hare · Hare Rama Hare Rama Rama Rama Hare Hare';

export const VERSES = [
  { text: 'You have a right to your work, but never to its fruits. Act well, without attachment to the result.', ref: 'Bhagavad-gītā 2.47' },
  { text: 'As a lamp in a windless place does not flicker, so stands the mind of a devotee absorbed in the Lord.', ref: 'Bhagavad-gītā 6.19' },
  { text: 'Those who always think of Me with devotion — I carry what they lack, and I preserve what they have.', ref: 'Bhagavad-gītā 9.22' },
  { text: 'Offer Me a leaf, a flower, a fruit or water with love, and I will accept it.', ref: 'Bhagavad-gītā 9.26' },
  { text: 'Happiness and distress come and go like winter and summer. Learn to tolerate them, and stay steady.', ref: 'Bhagavad-gītā 2.14' },
  { text: 'Lift yourself by your own mind. The mind can be the best of friends — or the worst of enemies.', ref: 'Bhagavad-gītā 6.5' },
  { text: 'Whenever righteousness declines and unrighteousness rises, I descend Myself, age after age.', ref: 'Bhagavad-gītā 4.7' },
  { text: 'To those who serve Me with love, I give the understanding by which they can come to Me.', ref: 'Bhagavad-gītā 10.10' },
  { text: 'There is no truth superior to Me. Everything rests upon Me, as pearls are strung on a thread.', ref: 'Bhagavad-gītā 7.7' },
  { text: 'Remember Me at every moment and carry on with your duty. With mind fixed on Me, you will surely reach Me.', ref: 'Bhagavad-gītā 8.7' },
  { text: 'Whatever a great person does, common people follow. The whole world pursues the standard they set.', ref: 'Bhagavad-gītā 3.21' },
  { text: 'One who neither disturbs the world nor is disturbed by it is very dear to Me.', ref: 'Bhagavad-gītā 12.15' },
  { text: 'Surrender unto Me alone, and I shall deliver you from all reactions. Do not fear.', ref: 'Bhagavad-gītā 18.66' },
  { text: 'For one who has conquered the mind, the mind is the best of friends; the Supersoul is already reached.', ref: 'Bhagavad-gītā 6.6–7' },
];

/** The verse for a given day (IST), same for every member. */
export const verseOfTheDay = (d = new Date()) => {
  const key = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  const dayNumber = Math.floor(Date.parse(`${key}T00:00:00Z`) / 86400000);
  return VERSES[((dayNumber % VERSES.length) + VERSES.length) % VERSES.length];
};
