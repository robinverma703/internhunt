// lib/match-score.ts
// Compares a user's resume skills against a job listing and returns
// a 0–100 match score. Pure keyword/overlap logic — no API calls,
// so this can run instantly for every job in the feed.

export type MatchResult = {
  score: number;
  matchedSkills: string[];
};

// Common words we never want counted as "skills"
const STOPWORDS = new Set([
  "and", "the", "for", "with", "you", "your", "our", "will", "are",
  "have", "this", "that", "from", "who", "have", "can", "not", "any",
  "job", "role", "work", "team", "company", "internship", "intern",
]);

function normalize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s+.#]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
}

export function calculateMatchScore(
  resumeSkills: string[],
  job: { title: string; description: string; category?: string }
): MatchResult {
  if (!resumeSkills || resumeSkills.length === 0) {
    return { score: 0, matchedSkills: [] };
  }

  const skillSet = resumeSkills.map((s) => s.toLowerCase().trim());

  const titleWords = new Set(normalize(job.title));
  const descWords = new Set(normalize(job.description ?? ""));
  const categoryWords = new Set(normalize(job.category ?? ""));

  const matched: string[] = [];
  let weightedHits = 0;

  for (const skill of skillSet) {
    // handle multi-word skills like "machine learning"
    const skillTokens = normalize(skill);
    const skillPhrase = skillTokens.join(" ");

    const inTitle = job.title.toLowerCase().includes(skillPhrase);
    const inCategory = categoryWords.has(skillPhrase) || Array.from(categoryWords).some((w) => skillTokens.includes(w));
    const inDesc = job.description?.toLowerCase().includes(skillPhrase);

    if (inTitle || inCategory || inDesc) {
      matched.push(skill);
    }

    if (inTitle) weightedHits += 3;
    else if (inCategory) weightedHits += 2;
    else if (inDesc) weightedHits += 1;
  }

  // Normalize against resume size so a 5-skill resume isn't unfairly
  // penalized compared to a 20-skill resume.
  const maxPossible = skillSet.length * 3;
  const rawScore = maxPossible > 0 ? (weightedHits / maxPossible) * 100 : 0;

  // Slight curve so decent partial matches don't feel too low
  const score = Math.min(100, Math.round(Math.sqrt(rawScore / 100) * 100));

  return { score, matchedSkills: Array.from(new Set(matched)) };
}