type NewJob = {
  title: string;
  company: string;
};

export async function notifyNewJobs(jobs: NewJob[]) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId || jobs.length === 0) return;

  const preview = jobs
    .slice(0, 5)
    .map((j) => `• ${j.title} — ${j.company}`)
    .join("\n");
  const more = jobs.length > 5 ? `\n...and ${jobs.length - 5} more` : "";

  const text =
    `🟢 InternHunt: ${jobs.length} new job${jobs.length > 1 ? "s" : ""} waiting for approval\n\n` +
    `${preview}${more}\n\n` +
    `Check the admin panel to approve/reject.`;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  } catch {
    // Never let a notification failure break the cron job.
  }
}