/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Container,
  Hr,
  Img,
  Link,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

// MeasureWise brand tokens (audit-ready, calm, enterprise)
export const BRAND = {
  primary: '#0F4C5C', // deep teal
  secondary: '#334155', // slate
  accent: '#C9A96E', // soft gold
  ivory: '#FAF8F4',
  white: '#ffffff',
  muted: '#6B7280',
  hairline: '#E7E2D6',
  font: 'Arial, "Inter", Calibri, "Aptos", sans-serif',
  logoUrl:
    'https://eeyigxcwewdqfeidqbxk.supabase.co/storage/v1/object/public/email-assets/measurewise-logo.png',
  siteUrl: 'https://measurewise.org',
  contactEmail: 'jessica@measurewise.org',
}

export const styles = {
  main: {
    backgroundColor: BRAND.white,
    fontFamily: BRAND.font,
    margin: 0,
    padding: '32px 0',
  },
  container: {
    backgroundColor: BRAND.white,
    border: `1px solid ${BRAND.hairline}`,
    borderTop: `3px solid ${BRAND.primary}`,
    borderRadius: '6px',
    maxWidth: '560px',
    margin: '0 auto',
    padding: '32px 36px',
  },
  logo: { display: 'block', marginBottom: '24px' },
  h1: {
    fontSize: '22px',
    fontWeight: 'bold' as const,
    color: BRAND.primary,
    margin: '0 0 16px',
    lineHeight: '1.3',
  },
  text: {
    fontSize: '15px',
    color: BRAND.secondary,
    lineHeight: '1.6',
    margin: '0 0 18px',
  },
  link: { color: BRAND.primary, textDecoration: 'underline' },
  button: {
    backgroundColor: BRAND.primary,
    color: BRAND.white,
    fontSize: '14px',
    fontWeight: 'bold' as const,
    borderRadius: '4px',
    padding: '12px 22px',
    textDecoration: 'none',
    display: 'inline-block',
  },
  fallback: {
    fontSize: '13px',
    color: BRAND.muted,
    lineHeight: '1.5',
    margin: '20px 0 0',
    wordBreak: 'break-all' as const,
  },
  footerText: {
    fontSize: '12px',
    color: BRAND.muted,
    margin: '24px 0 0',
    lineHeight: '1.5',
  },
  signatureWrap: {
    backgroundColor: BRAND.ivory,
    border: `1px solid ${BRAND.hairline}`,
    borderRadius: '4px',
    padding: '20px 22px',
    margin: '32px 0 0',
  },
  sigName: {
    fontSize: '15px',
    fontWeight: 'bold' as const,
    color: BRAND.primary,
    margin: '0',
    lineHeight: '1.4',
  },
  sigTitle: {
    fontSize: '13px',
    color: BRAND.secondary,
    margin: '2px 0 10px',
    lineHeight: '1.4',
  },
  sigContact: {
    fontSize: '13px',
    color: BRAND.secondary,
    margin: '0 0 10px',
    lineHeight: '1.5',
  },
  sigDivider: {
    color: BRAND.accent,
    fontWeight: 'bold' as const,
    padding: '0 8px',
  },
  sigTagline: {
    fontSize: '13px',
    color: BRAND.accent,
    fontStyle: 'italic' as const,
    margin: '0',
    borderLeft: `2px solid ${BRAND.accent}`,
    paddingLeft: '10px',
  },
  hairline: {
    borderColor: BRAND.hairline,
    borderTop: `1px solid ${BRAND.hairline}`,
    margin: '28px 0 0',
  },
}

export const BrandHeader = () => (
  <Img
    src={BRAND.logoUrl}
    width="170"
    alt="MeasureWise"
    style={styles.logo}
  />
)

export const Signature = () => (
  <Section style={styles.signatureWrap}>
    <Text style={styles.sigName}>Jessica Smith, RN</Text>
    <Text style={styles.sigTitle}>Founder, MeasureWise™</Text>
    <Text style={styles.sigContact}>
      Quality systems for FQHCs, CHCs, and PCMH teams
    </Text>
    <Text style={styles.sigContact}>
      <Link href={BRAND.siteUrl} style={styles.link}>
        MeasureWise.org
      </Link>
      <span style={styles.sigDivider}>│</span>
      <Link href={`mailto:${BRAND.contactEmail}`} style={styles.link}>
        {BRAND.contactEmail}
      </Link>
    </Text>
    <Text style={styles.sigTagline}>
      Build the paper trail before the audit.
    </Text>
  </Section>
)

export const FallbackLink = ({ url }: { url: string }) => (
  <Text style={styles.fallback}>
    Button not working? Copy and paste this link into your browser:
    <br />
    <Link href={url} style={styles.link}>
      {url}
    </Link>
  </Text>
)
