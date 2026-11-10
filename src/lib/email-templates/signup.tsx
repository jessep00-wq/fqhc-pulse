
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

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({ recipient, confirmationUrl }: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your MeasureWise account</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <BrandHeader />
        <Heading style={styles.h1}>Confirm your MeasureWise account</Heading>
        <Text style={styles.text}>
          Welcome to MeasureWise. Please confirm <strong>{recipient}</strong> so
          we can finish setting up your workspace.
        </Text>
        <Button style={styles.button} href={confirmationUrl}>
          Confirm email
        </Button>
        <FallbackLink url={confirmationUrl} />
        <Text style={styles.footerText}>
          This link is single use and expires after a short time. If it says the
          link is invalid or expired, just request a new one from MeasureWise.
        </Text>
        <Text style={styles.footerText}>
          If you didn't create a MeasureWise account, you can safely ignore this
          email.
        </Text>
        <Signature />
      </Container>
    </Body>
  </Html>
)

export default SignupEmail
