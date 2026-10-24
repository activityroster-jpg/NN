import type { Metadata } from "next";
import Link from "next/link";
import { IconArrowRight, IconChat, IconMail, IconPin, SocialIcon } from "@/components/Icons";
import { COMPANY, SOCIAL_LINKS } from "@/lib/brand";
import { getDb } from "@/lib/db";
import { getDictionary } from "@/lib/i18n";
import { requireLocale } from "@/lib/request";
import { getSettings } from "@/lib/settings";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const t = getDictionary(await requireLocale(params));
  return { title: t.contact.title, description: t.contact.sub };
}

export default async function Contact({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await requireLocale(params);
  const t = getDictionary(locale);
  const s = await getSettings(await getDb());
  const social = SOCIAL_LINKS.filter((x) => x.href);
  const wa = s.contact.whatsapp.replace(/\D/g, "");
  return (
    <div className="container-page max-w-4xl py-14">
      <div className="text-center">
        <p className="text-sm font-semibold tracking-wider text-sea uppercase">{t.contact.kicker}</p>
        <h1 className="h-display mt-1 text-5xl">{t.contact.title}</h1>
        <p className="mx-auto mt-3 max-w-xl text-ink/75">{t.contact.sub}</p>
      </div>

      <div className="card mt-10 overflow-hidden border-brand/40 shadow-sm">
        <div className="grid md:grid-cols-[1.3fr_1fr]">
          <div className="p-7">
            <div className="flex items-center gap-2 text-brand"><IconChat className="h-5 w-5" /><p className="text-sm font-semibold tracking-wider uppercase">{t.nav.enquire}</p></div>
            <h2 className="h-display mt-1 text-3xl">{t.contact.primaryTitle}</h2>
            <p className="mt-2 text-ink/75">{t.contact.primaryText}</p>
          </div>
          <div className="flex flex-col justify-center border-t border-brand/20 bg-brand-soft/60 p-7 text-center md:border-t-0 md:border-l">
            <Link href={`/${locale}/enquire`} className="btn-primary w-full">{t.contact.primaryCta} <IconArrowRight className="h-4 w-4" /></Link>
            <p className="mt-2 text-xs text-muted">{t.contact.primaryNote}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <div className="card p-6">
          <div className="flex items-center gap-2"><IconMail className="h-5 w-5 text-sea" /><h2 className="font-semibold">{t.contact.emailTitle}</h2></div>
          <p className="mt-2 text-sm text-ink/75">{t.contact.emailText}</p>
          <a href={`mailto:${s.contact.email}`} className="mt-3 inline-block font-semibold text-brand hover:underline">{s.contact.email}</a>
        </div>
        {(wa || s.contact.phone) && (
          <div className="card p-6">
            <div className="flex items-center gap-2"><IconChat className="h-5 w-5 text-sea" /><h2 className="font-semibold">{t.contact.whatsappTitle}</h2></div>
            <p className="mt-2 text-sm text-ink/75">{t.contact.whatsappText}</p>
            {wa && <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="mt-3 block font-semibold text-brand hover:underline">WhatsApp →</a>}
            {s.contact.phone && <a href={`tel:${s.contact.phone.replace(/\s+/g, "")}`} className="mt-1 block font-semibold text-brand hover:underline">{s.contact.phone}</a>}
          </div>
        )}
        <div className="card p-6">
          <div className="flex items-center gap-2"><SocialIcon name="instagram" className="h-5 w-5 text-sea" /><h2 className="font-semibold">{t.contact.socialTitle}</h2></div>
          <p className="mt-2 text-sm text-ink/75">{t.contact.socialText}</p>
          <div className="mt-3 space-y-1">
            {social.map((x) => (
              <a key={x.label} href={x.href!} target="_blank" rel="noopener noreferrer" className="block font-semibold text-brand hover:underline">{x.label} →</a>
            ))}
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-2"><IconPin className="h-5 w-5 text-sea" /><h2 className="font-semibold">{t.contact.postTitle}</h2></div>
          <p className="mt-2 text-sm text-ink/75">{COMPANY.tradingName} · {COMPANY.legalName}</p>
          <address className="mt-1 text-sm text-ink/75 not-italic">{COMPANY.address}</address>
          <p className="mt-2 text-xs text-muted">{COMPANY.jurisdiction} · No. {COMPANY.number}</p>
        </div>
      </div>
      <p className="mt-10 text-center text-sm text-muted">{t.contact.footerNote}</p>
    </div>
  );
}
