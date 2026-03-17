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
<body style="margin:0;padding:0;background-color:#0e0c09;font-family:Georgia,'Times New Roman',Times,serif;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0e0c09;">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <!-- Outer card -->
        <table role="presentation" width="100%" style="max-width:540px;" cellpadding="0" cellspacing="0">

          <!-- Header band -->
          <tr>
            <td style="background-color:#1a1610;border:1px solid #5a4a2e;border-bottom:none;padding:32px 40px 24px;text-align:center;">
              <!-- Decorative rule -->
              <p style="margin:0 0 18px;font-size:11px;letter-spacing:0.25em;color:#6b5535;font-family:Georgia,'Times New Roman',Times,serif;text-transform:uppercase;">&#10022; &nbsp; DungeonMessage &nbsp; &#10022;</p>
              <!-- Wordmark -->
              <p style="margin:0;font-size:28px;color:#f0e6c8;font-family:Georgia,'Times New Roman',Times,serif;letter-spacing:0.06em;font-weight:normal;">Dungeon<span style="color:#c9a84c;">Message</span></p>
              <!-- Sub-rule -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
                <tr>
                  <td style="border-top:1px solid #3d2e18;">&nbsp;</td>
                  <td style="width:10px;text-align:center;color:#c9a84c;font-size:10px;padding:0 8px;">&#9670;</td>
                  <td style="border-top:1px solid #3d2e18;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#141209;border-left:1px solid #5a4a2e;border-right:1px solid #5a4a2e;padding:36px 40px;">

              <!-- Greeting -->
              <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#7a6440;font-family:Georgia,'Times New Roman',Times,serif;">Well met, Game Master</p>
              <h1 style="margin:0 0 24px;font-size:24px;color:#f0e6c8;font-weight:normal;font-family:Georgia,'Times New Roman',Times,serif;line-height:1.3;">Your table is open.</h1>

              <!-- Table name callout -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="border-left:3px solid #c9a84c;padding:10px 16px;background-color:#1e1a10;">
                    <p style="margin:0;font-size:13px;color:#7a6440;font-family:Georgia,'Times New Roman',Times,serif;font-style:italic;letter-spacing:0.04em;">Session</p>
                    <p style="margin:4px 0 0;font-size:17px;color:#e8dbb8;font-family:Georgia,'Times New Roman',Times,serif;">${tableName}</p>
                  </td>
                </tr>
              </table>

              <!-- Body copy -->
              <p style="margin:0 0 28px;font-size:15px;line-height:1.8;color:#a89878;font-family:Georgia,'Times New Roman',Times,serif;">
                Your GM dashboard link is below. Bookmark it — this is your permanent gateway to control your table, compose messages, and watch your players' reactions unfold in real time.
              </p>
              <p style="margin:0 0 28px;font-size:14px;line-height:1.7;color:#7a6440;font-family:Georgia,'Times New Roman',Times,serif;font-style:italic;">
                Keep this link secret. Anyone who holds it commands the table.
              </p>

              <!-- CTA button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="background-color:#2a2316;border:1px solid #c9a84c;box-shadow:0 0 18px rgba(201,168,76,0.15);">
                    <a href="${tableUrl}" style="display:inline-block;padding:15px 32px;font-size:15px;color:#f0e6c8;text-decoration:none;font-family:Georgia,'Times New Roman',Times,serif;letter-spacing:0.08em;">
                      &#9670;&nbsp;&nbsp;Open GM Dashboard&nbsp;&nbsp;&#9670;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback URL -->
              <p style="margin:0;font-size:11px;color:#4a3f2e;font-family:Georgia,'Times New Roman',Times,serif;line-height:1.7;word-break:break-all;">
                Or copy this link into your browser:<br />
                <span style="color:#6b5535;">${tableUrl}</span>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#0e0c09;border:1px solid #5a4a2e;border-top:none;padding:24px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-top:1px solid #2a2316;padding-top:20px;">
                    <p style="margin:0 0 6px;font-size:11px;color:#3d3020;font-family:Georgia,'Times New Roman',Times,serif;line-height:1.7;">
                      You received this because you created a table at dungeonmessage.com.<br />
                      Starfire Labs LLC &mdash; Pennsylvania, USA
                    </p>
                    <p style="margin:0;font-size:11px;font-family:Georgia,'Times New Roman',Times,serif;">
                      <a href="mailto:gm@dungeonmessage.com?subject=unsubscribe" style="color:#4a3f2e;text-decoration:underline;">Unsubscribe</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
        <!-- /Outer card -->

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
