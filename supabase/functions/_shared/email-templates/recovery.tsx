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
          If you didn't request a password reset, you can safely ignore this
          email — your password will not be changed.
        </Text>
        <Signature />
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail
