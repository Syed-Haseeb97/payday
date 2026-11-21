---
name: ios-liquid-glass-ui
description: Build Apple iOS "Liquid Glass" glassmorphic interfaces and frameless transparent desktop widgets (Tauri v2 + React + Framer Motion on Windows). Use this skill whenever the user asks for glass UI, frosted or obsidian glass, iOS-style cards or pills, a floating always-on-top widget, a desktop overlay, a token or usage tracker widget, spring or morphing expand/collapse animations, odometer number count-ups, inertial or momentum scrolling, or a transparent frameless window, even if they never say "liquid glass". Also use it for any dashboard that should feel like native Apple UI.
---

# iOS Liquid Glass UI and Desktop Widget Skill

Follow this skill to build glassmorphic interfaces and frameless desktop widgets that look right on any wallpaper, with no halos, no jitter and no blinking elements. The rules below are strict. Where a rule says "never", treat it as a hard constraint.

## Workflow

1. **Identify the surface.** Is it a web page, an in-app card, or a frameless desktop widget? Sections 1 to 4 apply to all of them. Section 5 applies only to Tauri desktop widgets.
2. **Pick a theme.** Default to Smoked Obsidian (dark). Use Frosted Light only if the user asks for light mode.
3. **Put the tokens in CSS variables** (Section 1) before writing any component.
4. **Add motion** (Section 3) and the scroll engine (Section 4) where the UI needs them.
5. **Run the QA checklist** at the bottom before saying you are done.

---

## 1. Visual design

### 1.1 Smoked Obsidian (dark, the default)

Aim for a deep, neutral, translucent surface with no purple, blue or muddy gray tint.

```css
.glass-dark {
  position: relative;
  backdrop-filter: blur(36px) saturate(180%);
  -webkit-backdrop-filter: blur(36px) saturate(180%);
  background: linear-gradient(
    165deg,
    rgba(32, 32, 35, 0.65) 0%,
    rgba(22, 22, 24, 0.58) 50%,
    rgba(14, 14, 16, 0.68) 100%
  );
  box-shadow:
    inset 0 1px 0 0 rgba(255, 255, 255, 0.25),
    inset 0 -1px 0 0 rgba(255, 255, 255, 0.05),
    0 0 0 1px rgba(255, 255, 255, 0.18);
}

/* Top specular flare */
.glass-dark::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: inherit;
  background: radial-gradient(
    120% 60% at 20% 0%,
    rgba(255, 255, 255, 0.18) 0%,
    rgba(255, 255, 255, 0.03) 50%,
    transparent 80%
  );
}
```

| Token | Value |
|---|---|
| Primary text | `#ffffff` |
| Secondary text | `rgba(235, 235, 245, 0.65)` |
| Tertiary labels | `rgba(235, 235, 245, 0.42)` |
| Inset card background | `rgba(255, 255, 255, 0.065)` plus hairline `0 0 0 0.5px rgba(255, 255, 255, 0.07)` |
| Buttons and chips | `rgba(255, 255, 255, 0.08)`, hover `rgba(255, 255, 255, 0.16)` |
| Track background | `rgba(0, 0, 0, 0.32)` |
| Active segment thumb | `rgba(255, 255, 255, 0.22)` with `backdrop-filter: blur(20px)` |

### 1.2 Frosted Light

```css
.glass-light {
  background: linear-gradient(
    165deg,
    rgba(255, 255, 255, 0.88) 0%,
    rgba(245, 245, 247, 0.82) 50%,
    rgba(235, 235, 240, 0.86) 100%
  );
  box-shadow:
    inset 0 1px 0 0 rgba(255, 255, 255, 1),
    inset 0 -1px 0 0 rgba(0, 0, 0, 0.04),
    0 0 0 1px rgba(0, 0, 0, 0.12);
}
```

Text colors for light glass: primary `#000000`, secondary `rgba(60, 60, 67, 0.75)`, soft `rgba(60, 60, 67, 0.50)`. Keep the same `backdrop-filter` as the dark theme.

### 1.3 The No-Halo rule (transparent desktop windows)

Never put heavy black outer drop shadows (for example `box-shadow: 0 20px 48px rgba(0,0,0,0.65)`) on transparent frameless webview windows. Windows DWM per-pixel alpha blending turns them into dirty, muddy halos on the wallpaper.

Use only:
- the 1px hairline border `0 0 0 1px rgba(255,255,255,0.18)`
- the inner specular highlights (`inset 0 1px 0 0 ...`)
- a fully transparent outer canvas (`background: transparent` on `html`, `body` and `#root`)

### 1.4 No blinking elements

Never use `animate-pulse`, `animate-ping`, flashing dots or any looping opacity animation on badges, pills, legends or status indicators. Indicators stay static and calm.

---

## 2. Typography

```css
body {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Inter", system-ui, sans-serif;
}

.tabular-nums {
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1, "cv05" 1;
}
```

Use `.tabular-nums` on every counter and metric so digits don't shift while numbers change.

| Role | Style |
|---|---|
| Hero metric | `text-[30px] font-bold tracking-[-0.04em] leading-tight` |
| Card title | `text-[14px] font-semibold tracking-[-0.02em]` |
| Eyebrow / section header | `text-[10.5px] font-semibold uppercase tracking-[0.05em]` |
| Segment tabs and controls | `text-[12px] font-medium tracking-[-0.01em]` |
| Data rows / model names | `text-[12px] font-medium tracking-[-0.015em]` |

---

## 3. Motion

Use Framer Motion for springs and `requestAnimationFrame` for number counting.

### 3.1 Morphing expand and collapse

```ts
export const APPLE_SPRING = {
  type: "spring" as const,
  stiffness: 440,
  damping: 36,
  mass: 0.7,
};
```

**Anchored bottom-right rule (zero blank flash):**
1. The outer glass surface has `transformOrigin: "bottom right"`.
2. The collapsed pill is pinned with `position: absolute; right: 0; bottom: 0; width: 198px; height: 56px;`. Never center it inside the morphing box.
3. On collapse, the expanded card fades out (0.15s) while the pill, already at `right: 0; bottom: 0`, fades in (0.15s).
4. The container springs shut around the pill. No blank frame, no jump.

### 3.2 Odometer count-up (450ms)

Numbers roll to their target instead of snapping. The first render must already show the real value, so there is no blank flicker.

```tsx
import { useEffect, useRef, useState } from "react";
import { formatCompactTokens } from "../utils/format"; // project's number formatter; create it if missing

export function RollingNumber({ value, className, duration = 450 }: { value: number; className?: string; duration?: number }) {
  const [display, setDisplay] = useState(() => formatCompactTokens(value));
  const currentValRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current);

    const startVal = isFirstMount.current ? 0 : currentValRef.current;
    isFirstMount.current = false;
    const targetVal = value;

    if (startVal === targetVal) {
      currentValRef.current = targetVal;
      setDisplay(formatCompactTokens(targetVal));
      return;
    }

    const startTime = performance.now();
    const animate = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress); // exponential ease-out
      const current = Math.round(startVal + (targetVal - startVal) * ease);
      currentValRef.current = current;
      setDisplay(formatCompactTokens(current));

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        currentValRef.current = targetVal;
        setDisplay(formatCompactTokens(targetVal));
        animFrameRef.current = null;
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current);
    };
  }, [value, duration]);

  return <span className={className}>{display}</span>;
}
```

### 3.3 Segmented control thumb glide

```tsx
<motion.span
  layoutId="ios-segment-thumb"
  transition={{ type: "spring", stiffness: 480, damping: 36, mass: 0.65 }}
  className="glass-thumb absolute inset-0 -z-10 rounded-[11px]"
/>
```

Render this span only inside the active tab, so `layoutId` slides it between tabs.

---

## 4. Inertial scroll engine

Windows mouse wheels send stepped 100 to 120px jumps, and CSS `scroll-behavior: smooth` doesn't smooth them in Chromium/WebView2. Use this hook on every scrollable container in a widget.

```ts
import { useEffect, useRef } from "react";

export function useSmoothScroll<T extends HTMLElement>(deps: any = null) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let targetScroll = el.scrollTop;
    let currentScroll = el.scrollTop;
    let velocityMultiplier = 1.0;
    let lastWheelTime = 0;
    let lastDirection = 0;
    let isRunning = false;
    let animFrame = 0;

    const getMaxScroll = () => Math.max(0, el.scrollHeight - el.clientHeight);
    const clamp = (val: number, max: number) => Math.max(0, Math.min(val, max));

    const update = () => {
      const diff = targetScroll - currentScroll;
      if (Math.abs(diff) > 0.25) {
        currentScroll += diff * 0.22; // exponential decay
        el.scrollTop = currentScroll;
        animFrame = requestAnimationFrame(update);
      } else {
        currentScroll = targetScroll;
        el.scrollTop = currentScroll;
        isRunning = false;
      }
    };

    const onWheel = (e: WheelEvent) => {
      const maxScroll = getMaxScroll();
      if (maxScroll <= 0) return;
      e.preventDefault();
      e.stopPropagation();

      const now = performance.now();
      const dt = now - lastWheelTime;
      lastWheelTime = now;

      const rawDelta = e.deltaY;
      const dir = Math.sign(rawDelta);

      // Rapid successive spins accelerate up to 3.5x
      if (dt < 130 && dir === lastDirection) {
        velocityMultiplier = Math.min(velocityMultiplier * 1.3 + 0.35, 3.5);
      } else if (dt > 240) {
        velocityMultiplier = 1.0;
      }
      lastDirection = dir;

      let delta = dir * Math.min(Math.abs(rawDelta), 100) * 0.55 * velocityMultiplier;
      if (e.deltaMode === 1) delta = rawDelta * 28;

      targetScroll = clamp(targetScroll + delta, maxScroll);
      if (!isRunning) {
        isRunning = true;
        animFrame = requestAnimationFrame(update);
      }
    };

    const onScroll = () => {
      if (!isRunning) {
        currentScroll = el.scrollTop;
        targetScroll = el.scrollTop;
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(animFrame);
    };
  }, [deps]);

  return ref;
}
```

Usage: `const ref = useSmoothScroll<HTMLDivElement>(items.length); <div ref={ref} className="apple-scroll">…</div>`

### Scrollbar suppression (global CSS)

```css
*::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; background: transparent !important; }
*, *::before, *::after { scrollbar-width: none !important; -ms-overflow-style: none !important; }

.apple-scroll {
  overflow-y: auto;
  overscroll-behavior: contain;
  scroll-behavior: auto; /* required: CSS smooth scrolling fights the rAF loop */
  -webkit-overflow-scrolling: touch;
}
```

---

## 5. Desktop widget integration (Tauri v2 on Windows)

Apply this section only when building a frameless desktop widget.

### 5.1 Window config (`tauri.conf.json`)

```json
{
  "app": {
    "windows": [
      {
        "label": "main",
        "title": "Token Glass",
        "width": 420,
        "height": 560,
        "resizable": false,
        "fullscreen": false,
        "decorations": false,
        "transparent": true,
        "shadow": false,
        "alwaysOnTop": true,
        "skipTaskbar": true,
        "visible": false,
        "focus": false
      }
    ]
  }
}
```

Change `title` and the label to match the project. Show the window from code once the first frame has painted, since it starts with `visible: false`.

### 5.2 Click-through and outside-click collapse (`hit_test.rs`)

- **Collapsed:** mouse events pass through transparent regions to the desktop using `window.set_ignore_cursor_events(!inside)`.
- **Expanded:** a physical left-click outside the card emits `collapse-requested`, and the frontend collapses to the pill.

```rust
#[cfg(windows)]
fn is_left_mouse_down() -> bool {
    #[link(name = "user32")]
    extern "system" {
        fn GetAsyncKeyState(v_key: i32) -> i16;
    }
    const VK_LBUTTON: i32 = 0x01;
    unsafe { (GetAsyncKeyState(VK_LBUTTON) as u16 & 0x8000) != 0 }
}

// In the hit_test loop:
if rect.width > 250.0 && !inside {
    let mouse_down = is_left_mouse_down();
    if mouse_down && !was_outside_mouse_down {
        let _ = window.emit("collapse-requested", ());
    }
    was_outside_mouse_down = mouse_down;
} else {
    was_outside_mouse_down = false;
}
```

### 5.3 Single-instance mutex (`main.rs`)

```rust
#[cfg(windows)]
fn check_single_instance() -> bool {
    #[link(name = "kernel32")]
    extern "system" {
        fn CreateMutexW(lp_mutex_attributes: *const core::ffi::c_void, b_initial_owner: i32, lp_name: *const u16) -> *mut core::ffi::c_void;
        fn GetLastError() -> u32;
    }
    const ERROR_ALREADY_EXISTS: u32 = 183;
    let name: Vec<u16> = "Local\\TokenGlassSingletonMutex\0".encode_utf16().collect();
    unsafe {
        let handle = CreateMutexW(core::ptr::null(), 0, name.as_ptr());
        if handle.is_null() || GetLastError() == ERROR_ALREADY_EXISTS {
            return false;
        }
    }
    true
}
```

Call it at the start of `main()` and exit when it returns `false`. Rename the mutex per app.

### 5.4 Build and distribution

1. Build with `npx tauri build --no-bundle` or `npx tauri build --bundles nsis`. Never use raw `cargo build --release`, because it expects a dev server at `127.0.0.1:1420` instead of embedded assets.
2. Put sidecars and CLIs in `src-tauri/resources/` and declare `"resources": ["resources/*"]` in `tauri.conf.json`.
3. Installer config, so there is no UAC prompt:

```json
"bundle": {
  "active": true,
  "targets": ["nsis"],
  "windows": { "nsis": { "installMode": "currentUser" } }
}
```

---

## QA checklist (run before finishing)

- [ ] No black outer drop shadows on transparent windows; only hairline borders and inset highlights
- [ ] No `animate-pulse`, `animate-ping` or looping blink anywhere
- [ ] `html`, `body` and `#root` backgrounds are transparent in widget mode
- [ ] All numbers use `tabular-nums`, and counters use `RollingNumber`
- [ ] Collapsed pill is pinned bottom-right, and the surface uses `transformOrigin: "bottom right"`
- [ ] Every scrollable area uses `useSmoothScroll` and the scrollbar is hidden
- [ ] Tauri window is `transparent`, `decorations: false`, `shadow: false`
- [ ] Single-instance mutex is wired in `main.rs`
- [ ] Production build is done with `tauri build`, not raw `cargo build --release`
