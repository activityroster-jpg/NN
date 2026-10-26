/**
 * Buttons. Sentence case labels ("Post a job", not "Post A Job").
 * One primary per view. Touch targets ≥44px: lg = 48px, md = 40px (+ spacing).
 */
import Link from 'next/link'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'on-dark'
type Size = 'md' | 'lg'

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-[8px] font-semibold whitespace-nowrap transition-colors ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300 ' +
  'disabled:cursor-not-allowed disabled:border disabled:border-border disabled:bg-bg disabled:text-text-secondary'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-teal text-white hover:bg-teal-800',
  secondary: 'border border-teal bg-white text-teal hover:bg-teal-50',
  ghost: 'text-teal hover:bg-teal-50',
  // Translucent white for secondary actions on navy / photo heroes
  'on-dark': 'border border-white/60 bg-white/10 text-white hover:bg-white/20',
}

const SIZES: Record<Size, string> = {
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-[22px] text-base',
}

export function buttonClasses(variant: Variant = 'primary', size: Size = 'lg', extra = '') {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${extra}`
}

export function Button({
  variant = 'primary',
  size = 'lg',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button type="button" className={buttonClasses(variant, size, className)} {...props} />
}

export function ButtonLink({
  href,
  variant = 'primary',
  size = 'lg',
  className = '',
  children,
}: {
  href: string
  variant?: Variant
  size?: Size
  className?: string
  children: ReactNode
}) {
  return (
    <Link href={href} className={buttonClasses(variant, size, className)}>
      {children}
    </Link>
  )
}
