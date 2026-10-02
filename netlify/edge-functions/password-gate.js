// netlify/edge-functions/password-gate.js
//
// Simple shared-password gate for a Netlify site.
// Set the password as an environment variable named SITE_PASSWORD
// in the Netlify dashboard (Site configuration > Environment variables)
// before deploying this.

export default async (request, context) => {
  const PASSWORD = Netlify.env.get("SITE_PASSWORD");
  const cookies = request.headers.get("cookie") || "";
  const isAuthed = cookies
    .split(";")
    .map((c) => c.trim())
    .includes(`site_auth=${PASSWORD}`);

  if (isAuthed) {
    // Password cookie already set and valid, let the real request through
    return context.next();
  }

  if (request.method === "POST") {
    const formData = await request.formData();
    const submitted = formData.get("password");

    if (submitted === PASSWORD) {
      // Correct password, set a cookie for 24 hours and redirect back to the site
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/",
          "Set-Cookie": `site_auth=${PASSWORD}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`,
        },
      });
    }
  }

  // No valid cookie, and no (or wrong) password submitted: show the gate
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Protected site</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="font-family: system-ui, sans-serif; display:flex; align-items:center; justify-content:center; height:100vh; margin:0; background:#f5f5f5;">
  <form method="POST" style="background:white; padding:32px; border-radius:8px; box-shadow:0 1px 6px rgba(0,0,0,0.1); text-align:center;">
    <h2 style="margin-top:0;">This site is password protected</h2>
    <input type="password" name="password" placeholder="Enter password"
           style="padding:10px; font-size:16px; width:220px; margin-bottom:12px; border:1px solid #ccc; border-radius:4px;" />
    <br />
    <button type="submit"
            style="padding:10px 20px; font-size:16px; background:#111; color:white; border:none; border-radius:4px; cursor:pointer;">
      Enter
    </button>
  </form>
</body>
</html>`;

  return new Response(html, {
    status: 401,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
};

export const config = { path: "/*" };
