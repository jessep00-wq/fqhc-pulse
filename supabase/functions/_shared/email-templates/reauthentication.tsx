/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'
import { BrandHeader, Signature, styles, BRAND } from './brand.tsx'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your MeasureWise verification code</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <BrandHeader />
        <Heading style={styles.h1}>Verify it's you</Heading>
        <Text style={styles.text}>
          Use the code below to confirm your identity on MeasureWise.
        </Text>
        <Text
          style={{
            fontFamily: 'Courier, monospace',
            fontSize: '28px',
            fontWeight: 'bold',
            letterSpacing: '6px',
            color: BRAND.primary,
            backgroundColor: BRAND.ivory,
            border: `1px solid ${BRAND.hairline}`,
            borderRadius: '4px',
            padding: '16px 20px',
            textAlign: 'center',
            margin: '0 0 20px',
          }}
        >
          {token}
        </Text>
        <Text style={styles.footerText}>
          This code expires shortly. If you didn't request it, you can safely
          ignore this email.
        </Text>
        <Signature />
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail
