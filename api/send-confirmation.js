import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, tableName, tableUrl, gmSecret, marketingOptIn } = req.body;

  if (!email || !gmSecret) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Save email to Supabase
  const { error: dbError } = await supabase
    .from("gm_emails")
    .insert({ email, gm_secret: gmSecret, marketing_opt_in: marketingOptIn === true });

  if (dbError) {
    console.error("Supabase insert error:", dbError);
    return res.status(500).json({ error: "Failed to save email" });
  }

  // Send confirmation email via Resend
  const { error: emailError } = await resend.emails.send({
    from: "DungeonMessage <noreply@dungeonmessage.com>",
    to: email,
    subject: `Your table "${tableName}" is ready`,
    html: `
      <div style="background:#0D1013;color:#D5CDBE;font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:40px 32px;">
        <h1 style="font-size:28px;color:#F5ECCD;margin:0 0 8px;">Your table is open.</h1>
        <p style="color:#8A9BA8;font-size:14px;margin:0 0 32px;font-style:italic;">${tableName}</p>
        <p style="line-height:1.7;margin:0 0 24px;">
          Your GM link is below. Keep it secret — anyone with this link can control your table.
        </p>
        <a href="${tableUrl}" style="display:inline-block;background:#434135;border:1px solid #978262;color:#F5ECCD;text-decoration:none;padding:14px 24px;font-size:16px;letter-spacing:0.04em;">
          Open GM Dashboard →
        </a>
        <p style="margin:32px 0 0;font-size:12px;color:#4A5568;line-height:1.6;">
          If you didn't create this table, you can safely ignore this email.
        </p>
      </div>
    `,
  });

  if (emailError) {
    console.error("Resend error:", emailError);
    // Don't block — table is already created, email is best-effort
    return res.status(200).json({ ok: true, emailSent: false });
  }

  return res.status(200).json({ ok: true, emailSent: true });
}
