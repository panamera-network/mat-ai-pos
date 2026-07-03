export function getJwtSecret() {
  const secret =
    process.env.JWT_SECRET ||
    (process.env.NODE_ENV === 'production' ? undefined : 'mat-ai-dev-secret-key');

  if (!secret) {
    throw new Error('JWT_SECRET must be set in production');
  }

  return secret;
}
