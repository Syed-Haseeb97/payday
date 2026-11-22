import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('AddToHomeScreen Logic', () => {
  const store: Record<string, string> = {};
  const mockStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      for (const key of Object.keys(store)) delete store[key];
    },
  };

  beforeEach(() => {
    mockStorage.clear();
    vi.restoreAllMocks();
  });

  it('recognizes dismissed state from storage', () => {
    expect(mockStorage.getItem('payday_a2hs_dismissed')).toBeNull();
    mockStorage.setItem('payday_a2hs_dismissed', 'true');
    expect(mockStorage.getItem('payday_a2hs_dismissed')).toBe('true');
  });

  it('detects standalone mode from matchMedia or navigator.standalone', () => {
    const isStandalone = (mediaMatch: boolean, navStandalone?: boolean) => {
      return mediaMatch || navStandalone === true;
    };

    expect(isStandalone(false, undefined)).toBe(false);
    expect(isStandalone(true, undefined)).toBe(true);
    expect(isStandalone(false, true)).toBe(true);
  });

  it('detects mobile user agents accurately', () => {
    const isMobileUA = (ua: string) =>
      /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(ua);

    expect(isMobileUA('Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X)')).toBe(true);
    expect(isMobileUA('Mozilla/5.0 (Linux; Android 13; Pixel 7)')).toBe(true);
    expect(isMobileUA('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')).toBe(false);
    expect(isMobileUA('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe(false);
  });

  it('distinguishes iOS devices from generic mobile', () => {
    const isIOSDevice = (ua: string) => /iPhone|iPad|iPod/i.test(ua);

    expect(isIOSDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X)')).toBe(true);
    expect(isIOSDevice('Mozilla/5.0 (Linux; Android 13; Pixel 7)')).toBe(false);
  });
});
