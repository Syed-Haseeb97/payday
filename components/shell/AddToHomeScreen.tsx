'use client';

import React, { useEffect, useState } from 'react';
import { Share, PlusSquare, Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function AddToHomeScreen() {
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Only execute on client
    if (typeof window === 'undefined') return;

    // 0. Skip automated test runners unless explicitly forced
    if (
      typeof navigator !== 'undefined' &&
      navigator.webdriver &&
      !(window as unknown as { __PAYDAY_FORCE_A2HS__?: boolean }).__PAYDAY_FORCE_A2HS__
    ) {
      return;
    }

    // 1. Check if already installed or standalone
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) return;

    // 2. Check if previously dismissed on this device
    const dismissed = localStorage.getItem('payday_a2hs_dismissed');
    if (dismissed === 'true') return;

    // 3. Detect mobile device
    const ua = navigator.userAgent || '';
    const isMobileUA = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(ua);
    const isNarrowScreen = window.innerWidth < 768;

    if (!isMobileUA && !isNarrowScreen) return;

    // Detect iOS Safari
    const isIOSDevice = /iPhone|iPad|iPod/i.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(isIOSDevice);

    // Listen for Chromium beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Show popup on first mobile visit with a gentle 1.2s delay for page settling
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1200);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      clearTimeout(timer);
    };
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      localStorage.setItem('payday_a2hs_dismissed', 'true');
    } catch {
      // Ignore storage errors in private browsing
    }
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        handleDismiss();
      }
      setDeferredPrompt(null);
    } else {
      // For iOS or browsers without native prompt support, keep showing instructions or dismiss
      handleDismiss();
    }
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Add Payday to Home Screen"
      className="md:hidden fixed bottom-20 inset-x-4 max-w-sm mx-auto z-50 animate-in fade-in slide-in-from-bottom-3 duration-300"
    >
      <div className="relative rounded-2xl border border-[#C8C2B5] bg-white p-4 shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss Add to Home Screen prompt"
          className="absolute top-3 right-3 p-1.5 rounded-full text-[#5F626A] hover:text-[#16181D] hover:bg-[#F5F3EE] transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Eyebrow Pill */}
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C8C2B5] bg-[#E3EFE8] px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[#1D6B52] font-semibold">
            <Smartphone className="w-3 h-3" />
            Quick Access
          </span>
        </div>

        {/* Title & Description */}
        <h3 className="font-serif text-lg font-medium text-[#16181D] leading-tight">
          Install Payday for Faster Invoicing
        </h3>
        <p className="mt-1 text-xs text-[#5F626A] leading-relaxed">
          Add Payday to your phone's home screen for instant access to bookings, WhatsApp reminders, and payment links.
        </p>

        {/* iOS Specific Instructions vs Android Install Button */}
        {isIOS ? (
          <div className="mt-3.5 p-2.5 rounded-xl border border-[#C8C2B5]/60 bg-[#F5F3EE] text-xs text-[#16181D]">
            <p className="flex items-center flex-wrap gap-1 leading-snug">
              <span>1. Tap the</span>
              <span className="inline-flex items-center gap-0.5 font-semibold text-[#16181D] bg-white px-1.5 py-0.5 rounded border border-[#C8C2B5]">
                <Share className="w-3.5 h-3.5 inline text-[#16181D]" /> Share
              </span>
              <span>button in Safari.</span>
            </p>
            <p className="flex items-center flex-wrap gap-1 mt-1.5 leading-snug">
              <span>2. Scroll down &amp; tap</span>
              <span className="inline-flex items-center gap-0.5 font-semibold text-[#16181D] bg-white px-1.5 py-0.5 rounded border border-[#C8C2B5]">
                <PlusSquare className="w-3.5 h-3.5 inline text-[#16181D]" /> Add to Home Screen
              </span>
              <span>.</span>
            </p>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={handleDismiss}
                className="w-full py-2 px-3 text-center text-xs font-medium text-[#16181D] bg-white hover:bg-[#E3EFE8] border border-[#C8C2B5] rounded-full min-h-[44px] transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-3.5 flex items-center gap-2">
            <button
              type="button"
              onClick={handleInstallClick}
              className="flex-1 bg-[#16181D] hover:bg-[#2C3038] text-[#F5F3EE] rounded-full px-4 py-2 text-xs font-medium flex items-center justify-center gap-1.5 min-h-[44px] transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Add to Home Screen
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="px-3 py-2 text-xs font-medium text-[#5F626A] hover:text-[#16181D] rounded-full min-h-[44px] transition-colors"
            >
              Maybe later
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
