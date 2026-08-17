/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'
import { BrandHeader, Signature, FallbackLink, styles } from './brand.tsx'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({ confirmationUrl }: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your MeasureWise sign-in link</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <BrandHeader />
        <Heading style={styles.h1}>Your sign-in link</Heading>
        <Text style={styles.text}>
          Use the button below to sign in to MeasureWise. This link expires
          shortly for your security.
        </Text>
        <Button style={styles.button} href={confirmationUrl}>
          Sign in
        </Button>
        <FallbackLink url={confirmationUrl} />
        <Text style={styles.footerText}>
          This link is single use and expires after a short time. If it says the
          link is invalid or expired, just request a new one from MeasureWise.
        </Text>
        <Text style={styles.footerText}>
          If you didn't request this link, you can safely ignore this email.
        </Text>
        <Signature />
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail
