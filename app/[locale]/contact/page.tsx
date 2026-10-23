import type { Metadata } from "next";
import Link from "next/link";
import { IconMail } from "@/components/Icons";
import { getDb } from "@/lib/db";
import { getDictionary } from "@/lib/i18n";
import { requireLocale } from "@/lib/request";
import { getSettings } from "@/lib/settings";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const t = getDictionary(await requireLocale(params));
  return { title: t.contact.title };
}

export default async function Contact({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await requireLocale(params);
  const t = getDictionary(locale);
  const s = await getSettings(await getDb());
  return (
    <div className="container-page max-w-2xl py-12">
      <h1 className="h-display text-5xl">{t.contact.title}</h1>
      <p className="mt-4 text-lg text-ink/80">{t.contact.text}</p>
      <div className="card mt-8 space-y-3 p-6">
        <p className="flex items-center gap-3"><IconMail className="h-5 w-5 text-sea" /><span className="text-muted">{t.contact.emailLabel}</span><a className="font-semibold text-brand underline" href={`mailto:${s.contact.email}`}>{s.contact.email}</a></p>
        {s.contact.phone && <p className="text-sm">{s.contact.phone}</p>}
        {s.contact.whatsapp && <p className="text-sm"><a className="text-brand underline" href={`https://wa.me/${s.contact.whatsapp.replace(/\D/g, "")}`}>WhatsApp</a></p>}
      </div>
      <Link href={`/${locale}/enquire`} className="btn-primary mt-8">{t.contact.formCta}</Link>
    </div>
  );
}
