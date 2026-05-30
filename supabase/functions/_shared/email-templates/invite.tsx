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
import { BrandHeader, Signature, FallbackLink, styles, BRAND } from './brand.tsx'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({ siteUrl, confirmationUrl }: InviteEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You've been invited to MeasureWise</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <BrandHeader />
        <Heading style={styles.h1}>You've been invited to MeasureWise</Heading>
        <Text style={styles.text}>
          You've been invited to join{' '}
          <Link href={siteUrl || BRAND.siteUrl} style={styles.link}>
            <strong>MeasureWise</strong>
          </Link>
          . Accept the invitation below to create your account and join your
          team's quality workspace.
        </Text>
        <Button style={styles.button} href={confirmationUrl}>
          Accept invite
        </Button>
        <FallbackLink url={confirmationUrl} />
        <Text style={styles.footerText}>
          If you weren't expecting this invitation, you can safely ignore this
          email.
        </Text>
        <Signature />
      </Container>
    </Body>
  </Html>
)

export default InviteEmail
