const DEFAULT_APP_URL = 'https://fudimenu.app';

export function getAppUrl() {
  return new URL(process.env.NEXT_PUBLIC_APP_URL ?? DEFAULT_APP_URL);
}

export function getAbsoluteUrl(pathname: string) {
  return new URL(pathname, getAppUrl()).toString();
}
