// Build-time settings. Set VITE_ANALYTICS_URL in Netlify (Site settings > Environment variables), e.g.
//   https://al-falahmarketing.com/afel-collector/collect.php
// Empty = analytics fully disabled: no consent screen, no network calls.
export const ANALYTICS_URL = import.meta.env.VITE_ANALYTICS_URL || '';
export const APP_VERSION = '8.1';
// Sales contact shown in the "Become a sponsor" house ad (digits only, with country code).
export const SPONSOR_WHATSAPP = '224611351302';
// Public privacy notice (website-snippet/privacy.html uploaded to the main site).
export const PRIVACY_URL = 'https://al-falahmarketing.com/privacy.html';
