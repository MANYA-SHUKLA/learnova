/** SaaS mode: public institution self-registration. Default off — only institution sign-in is public. */
export function isSaasModeEnabled(): boolean {
  const value = process.env['NEXT_PUBLIC_SAAS_MODE'];
  if (value === undefined || value === '') return false;
  return value === 'true' || value === '1';
}
