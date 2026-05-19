/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'
import { BrandHeader, Signature, FallbackLink, styles } from './brand.tsx'

interface EmailChangeEmailProps {
  siteName: string
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  oldEmail,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your new MeasureWise email address</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <BrandHeader />
        <Heading style={styles.h1}>Confirm your new email</Heading>
        <Text style={styles.text}>
          You requested to change the email on your MeasureWise account from{' '}
          <Link href={`mailto:${oldEmail}`} style={styles.link}>
            {oldEmail}
          </Link>{' '}
          to{' '}
          <Link href={`mailto:${newEmail}`} style={styles.link}>
            {newEmail}
          </Link>
          .
        </Text>
        <Button style={styles.button} href={confirmationUrl}>
          Confirm change
        </Button>
        <FallbackLink url={confirmationUrl} />
        <Text style={styles.footerText}>
          If you didn't request this change, please secure your account
          immediately.
        </Text>
        <Signature />
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail
