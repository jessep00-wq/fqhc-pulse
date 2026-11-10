
import * as React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from '@react-email/components'
import { BrandHeader, Signature, FallbackLink, styles } from './brand'

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
