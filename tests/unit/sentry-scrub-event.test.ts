import { describe, expect, it } from 'vitest';

import { scrubSentryEvent } from '@/lib/sentry/scrub-event';

describe('scrubSentryEvent', () => {
  it('removes PII from user, contexts, cookies, and headers', () => {
    const event = scrubSentryEvent({
      user: {
        id: 'validation-user',
        email: 'owner@example.com',
        ip_address: '2806:290:880a:d695:1fd:e061:30e9:f700',
        ip: '127.0.0.1',
      },
      contexts: {
        user: {
          id: 'validation-user',
          email: 'owner@example.com',
          ip_address: '2806:290:880a:d695:1fd:e061:30e9:f700',
        },
      },
      request: {
        cookies: { session: 'secret' },
        headers: {
          Authorization: 'Bearer secret',
          Cookie: 'session=secret',
          'X-Forwarded-For': '203.0.113.9',
          'x-real-ip': '203.0.113.10',
          'user-agent': 'Mozilla/5.0',
        },
      },
    });

    expect(event.user).toEqual({ id: 'validation-user' });
    expect(event.contexts?.user).toEqual({ id: 'validation-user' });
    expect(event.request?.cookies).toBeUndefined();
    expect(event.request?.headers).toEqual({ 'user-agent': 'Mozilla/5.0' });
  });
});
