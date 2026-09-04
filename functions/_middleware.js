const COOKIE_NAME = "resume_session";
const SESSION_AGE_SECONDS = 60 * 60 * 24 * 14;
const RESUME_PUBLIC = true;
const encoder = new TextEncoder();

function securityHeaders(headers = new Headers()) {
    headers.set("Cache-Control", "private, no-store, max-age=0");
    headers.set("Pragma", "no-cache");
    headers.set("Referrer-Policy", "no-referrer");
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("X-Frame-Options", "DENY");
    headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet, noimageindex");
    headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
    headers.set(
        "Content-Security-Policy",
        "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' https://static.cloudflareinsights.com; connect-src 'self' https://cloudflareinsights.com; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"
    );
    headers.append("Vary", "Cookie");
    return headers;
}

function parseCookies(request) {
    const cookies = {};
    for (const pair of (request.headers.get("Cookie") || "").split(";")) {
        const separator = pair.indexOf("=");
        if (separator === -1) continue;
        const key = pair.slice(0, separator).trim();
        const value = pair.slice(separator + 1).trim();
        if (key) cookies[key] = value;
    }
    return cookies;
}

function bytesToBase64Url(bytes) {
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

function base64UrlToBytes(value) {
    try {
        const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
        const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
        return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
    } catch {
        return new Uint8Array();
    }
}

function equalBytes(left, right) {
    if (left.length !== right.length) return false;
    let difference = 0;
    for (let index = 0; index < left.length; index += 1) {
        difference |= left[index] ^ right[index];
    }
    return difference === 0;
}

async function digest(value) {
    return new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}

async function sign(value, secret) {
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );
    return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}

async function codesMatch(received, expected) {
    if (!received || !expected) return false;
    return equalBytes(await digest(received), await digest(expected));
}

async function createSession(secret) {
    const expiresAt = Math.floor(Date.now() / 1000) + SESSION_AGE_SECONDS;
    const signature = await sign(String(expiresAt), secret);
    return `${expiresAt}.${bytesToBase64Url(signature)}`;
}

async function sessionIsValid(value, secret) {
    if (!value || !secret) return false;
    const [expiresAtRaw, signatureRaw, extra] = value.split(".");
    if (!expiresAtRaw || !signatureRaw || extra) return false;

    const expiresAt = Number(expiresAtRaw);
    if (!Number.isInteger(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) return false;

    const receivedSignature = base64UrlToBytes(signatureRaw);
    const expectedSignature = await sign(expiresAtRaw, secret);
    return equalBytes(receivedSignature, expectedSignature);
}

function accessPage({ invalid = false, unavailable = false } = {}) {
    const title = unavailable ? "简历暂不可用" : "查看私人简历";
    const message = unavailable
        ? "访问服务尚未完成配置，请稍后再试。"
        : invalid
          ? "访问码不正确，请检查链接或重新输入。"
          : "这是一份仅面向受邀访客开放的简历。";

    return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="robots" content="noindex,nofollow,noarchive,nosnippet">
  <meta name="referrer" content="no-referrer">
  <title>${title}｜赵宜哲</title>
  <style>
    :root{color-scheme:light;font-family:"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC","Source Han Sans SC",-apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif;background:#fbfaf7;color:#1b1b19}
    *{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:#fbfaf7}
    main{width:min(100%,420px)}p{margin:0;color:#62635f;font-size:15px;line-height:1.75}h1{margin:0 0 12px;font-size:24px;line-height:1.35;letter-spacing:0}
    .eyebrow{margin-bottom:36px;color:#6f706c;font-size:12px;letter-spacing:0}.message{margin-bottom:26px}
    form{display:flex;gap:10px}input,button{height:46px;border:1px solid #d9d7d0;border-radius:0;background:#fff;font:inherit}
    input{min-width:0;flex:1;padding:0 14px;color:#1b1b19}input:focus{outline:2px solid #43677e;outline-offset:2px}
    button{padding:0 20px;background:#1b1b19;color:#fff;cursor:pointer}button:hover{background:#43677e}
    .error{margin-top:12px;color:#9c3e33;font-size:13px}.foot{margin-top:52px;padding-top:18px;border-top:1px solid #dfded8;color:#969792;font-size:12px}
    @media(max-width:460px){form{display:block}input,button{width:100%}button{margin-top:10px}}
  </style>
</head>
<body>
  <main>
    <p class="eyebrow">PRIVATE RESUME · 仅受邀访问</p>
    <h1>${title}</h1>
    <p class="message">${message}</p>
    ${unavailable ? "" : `<form method="get" action="/resume"><input name="code" type="password" autocomplete="off" placeholder="输入访问码" aria-label="访问码" required autofocus><button type="submit">进入</button></form>`}
    ${invalid ? `<p class="error" role="alert">如果链接由宜哲发送，请确认复制了完整地址。</p>` : ""}
    <p class="foot">赵宜哲 · 企业 AI 产品与解决方案</p>
  </main>
</body>
</html>`;
}

export async function onRequest(context) {
    const url = new URL(context.request.url);
    const isProtected = url.pathname === "/resume" || url.pathname.startsWith("/resume/");
    if (!isProtected) return context.next();

    if (RESUME_PUBLIC) {
        const response = await context.next();
        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: securityHeaders(new Headers(response.headers))
        });
    }

    const secret = context.env.RESUME_ACCESS_CODE;
    if (!secret) {
        return new Response(accessPage({ unavailable: true }), {
            status: 503,
            headers: securityHeaders(new Headers({ "Content-Type": "text/html; charset=utf-8" }))
        });
    }

    const suppliedCode = url.searchParams.get("code");
    if (suppliedCode !== null) {
        if (await codesMatch(suppliedCode, secret)) {
            const session = await createSession(secret);
            const headers = securityHeaders(new Headers({ Location: "/resume" }));
            headers.append(
                "Set-Cookie",
                `${COOKIE_NAME}=${session}; Path=/; Max-Age=${SESSION_AGE_SECONDS}; HttpOnly; Secure; SameSite=Lax`
            );
            return new Response(null, { status: 303, headers });
        }

        return new Response(accessPage({ invalid: true }), {
            status: 401,
            headers: securityHeaders(new Headers({ "Content-Type": "text/html; charset=utf-8" }))
        });
    }

    const session = parseCookies(context.request)[COOKIE_NAME];
    if (!(await sessionIsValid(session, secret))) {
        return new Response(accessPage(), {
            status: 401,
            headers: securityHeaders(new Headers({ "Content-Type": "text/html; charset=utf-8" }))
        });
    }

    const response = await context.next();
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: securityHeaders(new Headers(response.headers))
    });
}
