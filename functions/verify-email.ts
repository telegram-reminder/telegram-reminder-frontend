export const onRequestGet: PagesFunction = async ({ env, request }) => {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return new Response("Token non valido", { status: 400 });
  }

  const user = await env.DB
    .prepare("SELECT id FROM users WHERE email_verify_token = ?")
    .bind(token)
    .first();

  if (!user) {
    return new Response("Token non valido o già usato", { status: 400 });
  }

  await env.DB
    .prepare(`
      UPDATE users
      SET email_status = 'verified', email_verify_token = NULL
      WHERE id = ?
    `)
    .bind(user.id)
    .run();

  return new Response(
    `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Email verificata</title>
  </head>
  <body style="font-family: Arial, sans-serif; text-align:center; padding:40px">
    <h2>✅ Email verificata con successo</h2>
    <p>Ora puoi tornare su Telegram.</p>
    <p>Puoi chiudere questa pagina.</p>
  </body>
</html>`,
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store"
      }
    }
  );
};
