import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('logger', () => {
  let errSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let infoSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    delete process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;
    delete process.env.APPINSIGHTS_CONNECTION_STRING;
    delete process.env.APPINSIGHTS_INSTRUMENTATIONKEY;
    vi.resetModules();
    errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    errSpy.mockRestore();
    warnSpy.mockRestore();
    infoSpy.mockRestore();
  });

  it('falls back to structured JSON on stdout when no AppInsights env is set', async () => {
    const { logger } = await import('../lib/logger');
    logger.error('auth.login.failed', { email: 'x@y.com', attempt: 3 });

    expect(errSpy).toHaveBeenCalledTimes(1);
    const line = errSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(line);
    expect(parsed.level).toBe('error');
    expect(parsed.message).toBe('auth.login.failed');
    expect(parsed.email).toBe('x@y.com');
    expect(parsed.attempt).toBe(3);
    expect(typeof parsed.timestamp).toBe('string');
  });

  it('serializes Error instances into {message, name, stack}', async () => {
    const { logger } = await import('../lib/logger');
    const err = new Error('DB timeout');
    logger.error('email.send.failed', { error: err, tenantId: 't1' });

    const parsed = JSON.parse(errSpy.mock.calls[0][0] as string);
    expect(parsed.error.message).toBe('DB timeout');
    expect(parsed.error.name).toBe('Error');
    expect(typeof parsed.error.stack).toBe('string');
    expect(parsed.tenantId).toBe('t1');
  });

  it('warn routes to console.warn', async () => {
    const { logger } = await import('../lib/logger');
    logger.warn('soft failure', { foo: 1 });
    expect(warnSpy).toHaveBeenCalledTimes(1);
    const parsed = JSON.parse(warnSpy.mock.calls[0][0] as string);
    expect(parsed.level).toBe('warn');
    expect(parsed.foo).toBe(1);
  });

  it('info and event route to console.info', async () => {
    const { logger } = await import('../lib/logger');
    logger.info('heartbeat', { n: 1 });
    logger.event('goal.completed', { goalId: 'g1' });
    expect(infoSpy).toHaveBeenCalledTimes(2);
    const first = JSON.parse(infoSpy.mock.calls[0][0] as string);
    const second = JSON.parse(infoSpy.mock.calls[1][0] as string);
    expect(first.message).toBe('heartbeat');
    expect(second.message).toBe('event:goal.completed');
    expect(second.goalId).toBe('g1');
  });

  it('drops undefined context values', async () => {
    const { logger } = await import('../lib/logger');
    logger.error('x', { a: 1, b: undefined, c: null });
    const parsed = JSON.parse(errSpy.mock.calls[0][0] as string);
    expect(parsed.a).toBe(1);
    expect('b' in parsed).toBe(false);
    expect(parsed.c).toBe(null);
  });

  it('handles undefined context without crashing', async () => {
    const { logger } = await import('../lib/logger');
    logger.error('no_ctx');
    const parsed = JSON.parse(errSpy.mock.calls[0][0] as string);
    expect(parsed.message).toBe('no_ctx');
    expect(parsed.level).toBe('error');
  });
});
