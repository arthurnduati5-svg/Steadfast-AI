'use server';

export async function getDailyObjectives(
  studentPerformance: string,
  curriculum: string,
  loggedMisconceptions: string
) {
  const perf = String(studentPerformance || '').replace(/\s+/g, ' ').trim();
  const topic = String(curriculum || '').replace(/\s+/g, ' ').trim();
  const misconceptions = String(loggedMisconceptions || '').replace(/\s+/g, ' ').trim();

  return [
    topic
      ? `Summarize the main idea of today: ${topic.slice(0, 120)}.`
      : "Summarize the main idea of today's lesson in your own words.",
    misconceptions
      ? `Solve one example that targets this challenge: ${misconceptions.slice(0, 120)}.`
      : 'Solve one worked example and explain each step clearly.',
    perf
      ? `Do a quick self-check based on your progress: ${perf.slice(0, 120)}.`
      : 'Complete a short self-check and mark what still feels unclear.',
  ];
}
