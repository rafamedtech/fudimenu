'use client';

import { useEffect } from 'react';

const CHANNEL_NAME = 'fudi:auth';
const SIGNED_IN_MESSAGE = 'fudi:signed-in';

export function useBroadcastSignIn() {
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;

    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({ type: SIGNED_IN_MESSAGE });
    channel.close();
  }, []);
}

export function useListenForSignIn(onSignIn: () => void) {
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;

    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (event) => {
      if (event.data?.type === SIGNED_IN_MESSAGE) onSignIn();
    };

    return () => channel.close();
  }, [onSignIn]);
}
