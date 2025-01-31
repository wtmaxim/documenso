/* eslint-disable turbo/no-undeclared-env-vars */
import { NEXT_PUBLIC_WEBAPP_URL } from '../constants/app';
import { env } from '../utils/env';

export const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return '';
  }

  if (env('VERCEL_URL')) {
    return `https://${env('VERCEL_URL')}`;
  }

  const webAppUrl = NEXT_PUBLIC_WEBAPP_URL();

  if (webAppUrl) {
    return webAppUrl;
  }

  return `http://localhost:${env('PORT') ?? 3000}`;
};
