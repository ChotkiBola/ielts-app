// Standard published raw-score -> band conversion tables for IELTS Reading
// and Listening (Academic). IELTS does not publish one universal fixed
// table (it varies slightly test to test), so these are the commonly-used
// approximate tables — good enough for a practice estimate, same spirit as
// the AI-estimated Writing/Speaking bands elsewhere in this app.

export function readingBand(rawOutOf40) {
  const n = rawOutOf40;
  if (n >= 39) return 9.0;
  if (n >= 37) return 8.5;
  if (n >= 35) return 8.0;
  if (n >= 32) return 7.5;
  if (n >= 30) return 7.0;
  if (n >= 27) return 6.5;
  if (n >= 23) return 6.0;
  if (n >= 19) return 5.5;
  if (n >= 15) return 5.0;
  if (n >= 13) return 4.5;
  if (n >= 10) return 4.0;
  return 3.5;
}

export function listeningBand(rawOutOf40) {
  const n = rawOutOf40;
  if (n >= 39) return 9.0;
  if (n >= 37) return 8.5;
  if (n >= 35) return 8.0;
  if (n >= 32) return 7.5;
  if (n >= 30) return 7.0;
  if (n >= 26) return 6.5;
  if (n >= 23) return 6.0;
  if (n >= 18) return 5.5;
  if (n >= 16) return 5.0;
  if (n >= 13) return 4.5;
  if (n >= 10) return 4.0;
  return 3.5;
}

// Scales a raw score out of `total` questions (e.g. 13 for one passage) up
// to an equivalent out-of-40 score, the way a single-passage/part mock has
// to approximate a full test.
export function scaleTo40(raw, total) {
  return Math.round((raw / total) * 40);
}