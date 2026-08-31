/**
 * phronesislabs.net edge worker
 *
 * Fronts the GitHub Pages origin (groundtruthindex26.github.io/phronesislabs.net/)
 * and adds:
 *   - 301s for the legacy the-lab./about. subdomains onto canonical apex paths
 *   - POST /api/contact, which stores contact submissions in D1 and (when a
 *     RESEND_API_KEY secret is present) emails them to contact@phronesislabs.net
 *
 * Source of truth for this Worker lives in the repo. Deploy with:
 *   wrangler versions upload -c worker/wrangler.toml
 *   wrangler versions deploy -c worker/wrangler.toml
 * (versions commands are used so routes/custom domains are never touched).
 */

const ORIGIN_BASE = "https://groundtruthindex26.github.io/phronesislabs.net/";
const CONTACT_TO = "contact@phronesislabs.net";

/* Legacy hostnames that used to serve duplicates of these pages. They are now
   301'd to the canonical apex path instead of rendering the same content twice. */
const LEGACY_HOSTS = {
  "the-lab.phronesislabs.net": "/the-lab/",
  "about.phronesislabs.net": "/about/",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX = { name: 200, email: 320, message: 5000, help: 300 };
const MAX_BODY_BYTES = 32 * 1024;

const str = (body, key) =>
  typeof body?.[key] === "string" ? body[key].trim() : "";

const json = (data, status) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

function legacyRedirect(url) {
  const target = LEGACY_HOSTS[url.hostname.toLowerCase()];
  if (!target) return null;
  const rest = url.pathname.replace(/^\/+/, "");
  const to = new URL(target + rest + url.search, "https://phronesislabs.net");
  return Response.redirect(to.toString(), 301);
}

async function storeSubmission(env, row) {
  if (!env.CONTACT_DB) return { ok: false, reason: "no-binding" };
  try {
    await env.CONTACT_DB.prepare(
      `INSERT INTO contact_messages (name, email, message, help, source, user_agent, ip, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(row.name, row.email, row.message, row.help || null, row.source,
            row.userAgent || null, row.ip || null, new Date().toISOString())
      .run();
    return { ok: true };
  } catch (err) {
    console.error("D1 insert failed", err);
    return { ok: false, reason: "db-error" };
  }
}

async function emailSubmission(env, row) {
  if (!env.RESEND_API_KEY) return { ok: false, reason: "not-configured" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        /* Resend only allows a custom From once a domain is verified with DNS
           records. onboarding@resend.dev works immediately and can deliver to the
           address the Resend account was created with, so the form works on day
           one; set RESEND_FROM later to send from phronesislabs.net. */
        from: env.RESEND_FROM || "Phronesis Labs <onboarding@resend.dev>",
        to: [CONTACT_TO],
        reply_to: row.email,
        subject: `Idea for the lab - ${row.name}`,
        text:
          `${row.message}\n\n---\nName: ${row.name}\nEmail: ${row.email}` +
          (row.help ? `\nHelp needed: ${row.help}` : "") +
          `\nSource: ${row.source}\n`,
      }),
    });
    if (!res.ok) {
      console.error("Resend failed", res.status, await res.text());
      return { ok: false, reason: "provider-error" };
    }
    return { ok: true };
  } catch (err) {
    console.error("Resend request failed", err);
    return { ok: false, reason: "provider-error" };
  }
}

async function handleContact(request, env) {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    return json({ error: "That message is too long." }, 413);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "We could not read that submission." }, 400);
  }

  /* honeypot: real people leave this empty; bots fill it in */
  if (str(body, "website")) return json({ ok: true }, 201);

  const name = str(body, "name");
  const email = str(body, "email").toLowerCase();
  const message = str(body, "message");
  const help = str(body, "help");

  if (!message || message.length > MAX.message) {
    return json({ error: "Please tell us what you're working on." }, 400);
  }
  if (!name || name.length > MAX.name) {
    return json({ error: "Please add your name." }, 400);
  }
  if (!EMAIL_RE.test(email) || email.length > MAX.email) {
    return json({ error: "Please enter a valid email address." }, 400);
  }
  if (help.length > MAX.help) {
    return json({ error: "That last field is a little too long." }, 400);
  }

  const row = {
    name, email, message, help,
    source: str(body, "source") || "contact",
    userAgent: request.headers.get("user-agent"),
    ip: request.headers.get("cf-connecting-ip"),
  };

  const stored = await storeSubmission(env, row);
  const emailed = await emailSubmission(env, row);

  /* Only a total failure is reported to the visitor. If the message is safely
     in D1 we accept it even when email delivery is not configured yet. */
  if (!stored.ok && !emailed.ok) {
    return json({ error: "We could not save your message. Please email " + CONTACT_TO + "." }, 502);
  }
  return json({ ok: true }, 201);
}

function cacheControlFor(pathname) {
  if (pathname.startsWith("/assets/fonts/")) return "public, max-age=31536000, immutable";
  if (pathname.startsWith("/assets/")) return "public, max-age=604800";
  if (/\.(?:xml|txt)$/.test(pathname)) return "public, max-age=3600";
  return "no-store";
}

async function handle(request, env) {
  const url = new URL(request.url);

  const redirect = legacyRedirect(url);
  if (redirect) return redirect;

  if (url.pathname === "/api/contact") {
    if (request.method === "OPTIONS") return new Response(null, { status: 204 });
    if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
    return handleContact(request, env);
  }

  const path = url.pathname.replace(/^\/+/, "");
  const originResponse = await fetch(new URL(path + url.search, ORIGIN_BASE), {
    method: request.method,
    headers: (() => {
      const h = new Headers();
      const accept = request.headers.get("accept");
      if (accept) h.set("accept", accept);
      return h;
    })(),
  });

  const wantsHtml = (request.headers.get("accept") || "").includes("text/html");
  let response = originResponse;
  if (wantsHtml && originResponse.status === 404) {
    response = await fetch(new URL("404.html", ORIGIN_BASE));
  }

  const contentType = response.headers.get("content-type") || "";
  const isText =
    contentType.startsWith("text/") ||
    contentType.includes("javascript") ||
    contentType.includes("json");

  const headers = new Headers(response.headers);
  headers.set("cache-control", cacheControlFor(url.pathname));

  /* A missing page must keep its 404 status, or search engines index the
     error page as real content. */
  const status = originResponse.status === 404 ? 404 : response.status;

  if (!isText) return new Response(response.body, { status, headers });

  const text = await response.text();
  const body = text.split('"/phronesislabs.net/').join('"/');
  headers.delete("content-length");
  headers.delete("content-encoding");
  return new Response(body, { status, headers });
}

export default {
  fetch: (request, env) => handle(request, env),
};
