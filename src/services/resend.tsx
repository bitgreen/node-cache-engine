import React from "react";
import {Resend} from "resend";

import {VerifyEmail} from '@repo/transactional/emails/auth/verify-email';
import {sign} from "jsonwebtoken";
import Buffer from "buffer";
import logger from "@/utils/logger";

const resend = new Resend(process.env.RESEND_API_KEY || '');

export function sendActivationEmail({
  address,
  email,
  name
}: {
  address: string,
  email: string,
  name: string,
}) {
  const token = sign(
    {
      email: email,
      address: address,
    },
    Buffer.Buffer.from(process.env.JWT_SECRET_KEY || '').toString('base64'),
    {
      expiresIn: '7d',
    }
  );

  resend.emails.send({
    from: 'noreply@bitgreen.org',
    to: email,
    subject: 'Verify your email',
    react: <VerifyEmail url={`${process.env.FRONTEND_URL}/verify-email?token=${token}`} email={email} name={name} />
  }).catch(err => {
    logger.error('Error sending email:', err)
  });
}