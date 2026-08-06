/** SaaS mode: show Institution Registration entry points. Default on. */
export function isSaasModeEnabled(): boolean {
  const value = process.env['NEXT_PUBLIC_SAAS_MODE'];
  if (value === undefined || value === '') return true;
  return value !== 'false' && value !== '0';
}
