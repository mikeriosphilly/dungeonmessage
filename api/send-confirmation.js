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
    subject: `Your table is ready — open this link on any device`,
    headers: {
      "List-Unsubscribe": "<mailto:gm@dungeonmessage.com?subject=unsubscribe>",
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your table is ready</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0907;">
  <!-- Preheader: visible in inbox preview only, hidden in email body -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">Your table is ready, Game Master. Here&rsquo;s your dashboard link for safekeeping.&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0907;">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;">

          <!-- HEADER -->
          <tr>
            <td style="background-color:#0f0d0a;border:1px solid #5c4e38;border-bottom:none;padding:32px 40px 28px;text-align:center;">
              <img src="https://dungeonmessage.com/Logo-horizontal.png" alt="DungeonMessage" width="200" style="display:block;margin:0 auto;height:auto;filter:drop-shadow(0 2px 8px rgba(151,130,98,0.3));" />
              <!-- Decorative divider -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                <tr>
                  <td style="border-top:1px solid #5c4e38;">&nbsp;</td>
                  <td style="width:24px;text-align:center;color:#978262;font-size:9px;padding:0 8px;vertical-align:middle;">&#9670;</td>
                  <td style="border-top:1px solid #5c4e38;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background-color:#141209;border-left:1px solid #5c4e38;border-right:1px solid #5c4e38;padding:36px 40px;">

              <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#978262;font-family:Georgia,'Times New Roman',Times,serif;">Well met, Game Master</p>
              <h1 style="margin:0 0 24px;font-size:24px;color:#F5ECCD;font-weight:normal;font-family:Georgia,'Times New Roman',Times,serif;line-height:1.3;">Your table is open.</h1>

              <!-- Session callout -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="border-left:3px solid #978262;background-color:#0D1013;padding:12px 16px;">
                    <p style="margin:0 0 4px;font-size:12px;color:#8A9BA8;font-family:Georgia,'Times New Roman',Times,serif;font-style:italic;">Session</p>
                    <p style="margin:0;font-size:17px;color:#D5CDBE;font-family:Georgia,'Times New Roman',Times,serif;">${tableName}</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 16px;font-size:15px;line-height:1.8;color:#8A9BA8;font-family:Georgia,'Times New Roman',Times,serif;">
                Your GM dashboard link is below. Bookmark it &mdash; this is your permanent gateway to control your table, compose messages, and watch your players unfold in real time.
              </p>
              <p style="margin:0 0 28px;font-size:14px;line-height:1.7;color:#6A7984;font-family:Georgia,'Times New Roman',Times,serif;font-style:italic;">
                Keep this link secret. Anyone who holds it commands the table.
              </p>

              <!-- CTA button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="background-color:#434135;border:1px solid #978262;">
                    <a href="${tableUrl}" style="display:inline-block;padding:15px 32px;font-size:15px;color:#F5ECCD;text-decoration:none;font-family:Georgia,'Times New Roman',Times,serif;letter-spacing:0.06em;">&#9670;&nbsp;&nbsp;Open GM Dashboard&nbsp;&nbsp;&#9670;</a>
                  </td>
                </tr>
              </table>

              <!-- Cross-device note -->
              <p style="margin:0 0 24px;font-size:13px;line-height:1.7;color:#6A7984;font-family:Georgia,'Times New Roman',Times,serif;font-style:italic;">
                This link is your key to your GM dashboard &mdash; works on laptop, phone, or tablet. Keep this email handy.
              </p>

              <!-- Fallback URL -->
              <p style="margin:0;font-size:11px;color:#5c4e38;font-family:Helvetica,Arial,sans-serif;line-height:1.7;word-break:break-all;">
                Or copy this link into your browser:<br />${tableUrl}
              </p>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color:#0a0907;border:1px solid #5c4e38;border-top:none;padding:20px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-top:1px solid #2a2316;padding-top:18px;">
                    <p style="margin:0 0 6px;font-size:11px;color:#4a3f2e;font-family:Helvetica,Arial,sans-serif;line-height:1.7;">
                      You received this because you created a table at dungeonmessage.com.<br />
                      Starfire Labs LLC &mdash; Pennsylvania, USA
                    </p>
                    <p style="margin:0;font-size:11px;font-family:Helvetica,Arial,sans-serif;">
                      <a href="mailto:gm@dungeonmessage.com?subject=unsubscribe" style="color:#6b5535;text-decoration:underline;">Unsubscribe</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>`,
  });

  if (emailError) {
    console.error("Resend error:", emailError);
    // Don't block — table is already created, email is best-effort
    return res.status(200).json({ ok: true, emailSent: false });
  }

  return res.status(200).json({ ok: true, emailSent: true });
}
