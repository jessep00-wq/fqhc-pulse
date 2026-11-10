
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

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset your MeasureWise password</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <BrandHeader />
        <Heading style={styles.h1}>Reset your password</Heading>
        <Text style={styles.text}>
          We received a request to reset the password on your MeasureWise
          account. Click below to choose a new one.
        </Text>
        <Button style={styles.button} href={confirmationUrl}>
          Reset password
        </Button>
        <FallbackLink url={confirmationUrl} />
        <Text style={styles.footerText}>
          This link is single use and expires after a short time. If it says the
          link is invalid or expired, just request a new one from MeasureWise.
        </Text>
        <Text style={styles.footerText}>
          If you didn't request a password reset, you can safely ignore this
          email. Your password will not be changed.
        </Text>
        <Signature />
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail
