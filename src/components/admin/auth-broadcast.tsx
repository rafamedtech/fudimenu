'use client';

import { useBroadcastSignIn } from '@/hooks/use-auth-broadcast';

export function AuthBroadcast() {
  useBroadcastSignIn();
  return null;
}
