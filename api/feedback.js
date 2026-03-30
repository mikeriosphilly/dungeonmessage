import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, email } = req.body || {};

  if (!message || !message.trim()) {
    return res.status(400).json({ error: "Message is required" });
  }

  const fromLine = email && email.trim()
    ? `From: ${email.trim()}`
    : "No email provided";

  const { error } = await resend.emails.send({
    from: "DungeonMessage <noreply@dungeonmessage.com>",
    to: "gm@dungeonmessage.com", // TODO: replace with your internal email address
    subject: "DungeonMessage Feedback",
    text: `${fromLine}\n\n${message.trim()}`,
  });

  if (error) {
    console.error("Resend error:", error);
    return res.status(500).json({ error: "Failed to send feedback" });
  }

  return res.status(200).json({ ok: true });
}
