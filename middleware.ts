import { NextResponse, type NextRequest } from "next/server";
import { CURRENCY_COOKIE, isLocale, matchLocale } from "@/lib/i18n/config";

function defaultCurrency(country: string | null): "GBP" | "USD" | "EUR" {
  if (country === "GB" || country === "IM" || country === "JE" || country === "GG") return "GBP";
  if (country === "US" || country === "VG" || country === "VI" || country === "PR") return "USD";
  return "EUR";
}

// 1. Public pages live under /{locale}. Anything without a locale is redirected
//    to the visitor's preferred language.
// 2. The <html lang> comes from the x-nn-locale request header set here.
// 3. First visit: default display currency from the visitor's country
//    (GBP for the UK, USD for the US, EUR otherwise). Display only.
// 4. /admin requires a session cookie; the session itself is verified on the server.


export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (pathname !== "/admin/login" && !req.cookies.get("nn_admin")) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Video render stage for the MP4 workflow: no locale, no cookies.
  if (pathname.startsWith("/render/")) return NextResponse.next();

  const seg = pathname.split("/")[1];
  if (!isLocale(seg)) {
    const locale = matchLocale(req.headers.get("accept-language"));
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nn-locale", seg);
  const res = NextResponse.next({ request: { headers: requestHeaders } });
  if (!req.cookies.get(CURRENCY_COOKIE)) {
    res.cookies.set(CURRENCY_COOKIE, defaultCurrency(req.headers.get("cf-ipcountry")), {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }
  return res;
}

export const config = {
  // Skip API routes, Next internals and files with an extension.
  matcher: ["/((?!api|_next|.*\\.[a-zA-Z0-9]+$).*)"],
};

