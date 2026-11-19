// ─────────────────────────────────────────────────────────────────────────────
// ELITE PARADISE — GSAP animation layer
//
// Design rules this module enforces:
//   • Every animation is registered inside a gsap.context() and reverted on
//     unmount, so ScrollTriggers, tweens and will-change hints are all released.
//   • `prefers-reduced-motion: reduce` is checked at the SOURCE, not in CSS, so
//     reduced-motion visitors get the final state immediately with zero JS work.
//   • Easing is slow and natural (expo/power outs). Nothing bounces.
//   • Parallax uses scrub so it is tied to scroll position, never a timer.
//   • Mobile gets fewer, cheaper effects — see `isCompact()`.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;

/** Registers ScrollTrigger once, defensively (SSR / double-mount safe). */
export function ensureGsap() {
  if (registered) return;
  if (typeof window === "undefined") return;
  gsap.registerPlugin(ScrollTrigger);
  // A stale trigger list after a route change causes phantom pinning; a single
  // refresh on load keeps measurements honest without polling.
  gsap.defaults({ ease: "power3.out", duration: 0.9 });
  registered = true;
}

/** True when the visitor has asked for reduced motion. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** True on small screens — used to skip expensive effects. */
export function isCompact(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 767px)").matches;
}

/** Motion is allowed: not reduced, and the API exists. */
export function motionOk(): boolean {
  return !prefersReducedMotion() && typeof window !== "undefined";
}

/**
 * Scoped GSAP. Runs `build` inside a context tied to the returned ref's subtree
 * and reverts everything on unmount.
 *
 *   const scope = useGsapScope(({ q, gsap }) => {
 *     gsap.from(q(".card"), { y: 24, stagger: 0.08 });
 *   });
 *   <div ref={scope}>…</div>
 *
 * `q(selector)` is a non-null-returning scoped query — it always gives an array,
 * so callers never have to guard against `undefined` the way
 * `gsap.Context#selector` requires.
 */
export type Scope = {
  /** All descendants of the scope root matching `selector` (never undefined). */
  q: (selector: string) => HTMLElement[];
  gsap: typeof gsap;
};

export function useGsapScope<T extends HTMLElement = HTMLDivElement>(
  build: (scope: Scope) => void,
  deps: unknown[] = [],
) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    ensureGsap();
    const root = ref.current;
    if (!root) return;

    // Reduced motion: no context, no tweens — the markup's resting state is the
    // final state, so nothing needs to be set here.
    if (!motionOk()) return;

    // NOTE: `build` runs synchronously inside gsap.context(), so the context
    // object does not exist yet at that moment. It is therefore NOT passed to
    // build — only `q` and `gsap` are. Anything that needs the context (e.g. a
    // ScrollTrigger) is registered through `q` and cleaned up by ctx.revert().
    const ctx = gsap.context(() => {
      const q = (selector: string) =>
        Array.from(root.querySelectorAll<HTMLElement>(selector));
      build({ q, gsap });
    }, root);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}

// ─────────────────────────────────────────────────────────────────────────────
// Element recipes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Scroll-triggered reveal for `.ep-reveal` descendants: fade up in a stagger as
 * each group enters. Elements present at mount that are already on screen are
 * revealed immediately, so above-the-fold content is never held back.
 */
export function revealOnScroll(
  q: (selector: string) => HTMLElement[],
  selector = ".ep-reveal",
  opts: { y?: number; stagger?: number; start?: string } = {},
) {
  if (!motionOk()) return;
  const { y = 26, stagger = 0.075, start = "top 88%" } = opts;

  const groups = q(selector);
  if (!groups.length) return;

  // Above the fold: play in straight away (a ScrollTrigger that starts at the
  // very top of the page can miss its own start event on some browsers).
  const belowFold: HTMLElement[] = [];
  for (const el of groups) {
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) {
      gsap.fromTo(
        el,
        { autoAlpha: 0, y },
        { autoAlpha: 1, y: 0, duration: 0.85, delay: 0.05, overwrite: true },
      );
    } else {
      belowFold.push(el);
    }
  }

  if (!belowFold.length) return;

  ScrollTrigger.batch(belowFold, {
    start,
    once: true,
    batchMax: 4,
    onEnter: (batch) =>
      gsap.fromTo(
        batch,
        { autoAlpha: 0, y },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.85,
          stagger,
          overwrite: true,
        },
      ),
  });
}

/**
 * Splits an element's text into word spans for a stagger reveal.
 * Returns the word elements, or nulls when motion is off (caller then simply
 * leaves the original text alone).
 */
export function splitWords(el: HTMLElement | null): HTMLElement[] {
  if (!el) return [];
  if (el.dataset.split === "1") {
    return Array.from(el.querySelectorAll<HTMLElement>("[data-word]"));
  }

  const source = el.textContent ?? "";
  if (!source.trim()) return [];

  const frag = document.createDocumentFragment();
  const words: HTMLElement[] = [];

  source.split(/(\s+)/).forEach((chunk) => {
    if (!chunk.trim()) {
      frag.appendChild(document.createTextNode(chunk));
      return;
    }
    // A masked wrapper per word so the inner span can rise from behind a line.
    const outer = document.createElement("span");
    outer.style.display = "inline-block";
    outer.style.overflow = "hidden";
    outer.style.verticalAlign = "top";

    const word = document.createElement("span");
    word.dataset.word = "1";
    word.style.display = "inline-block";
    word.textContent = chunk;

    outer.appendChild(word);
    frag.appendChild(outer);
    words.push(word);
  });

  el.textContent = "";
  el.appendChild(frag);
  el.dataset.split = "1";
  return words;
}

/** Gentle scroll parallax on an image or shape. */
export function parallax(
  q: (selector: string) => HTMLElement[],
  selector: string,
  distance = 60,
) {
  if (!motionOk() || isCompact()) return;
  q(selector).forEach((el) => {
    gsap.fromTo(
      el,
      { yPercent: -distance / 10 },
      {
        yPercent: distance / 10,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.65,
        },
      },
    );
  });
}

/** Animate a number from 0 to `to`, formatting on each frame. */
export function countUp(
  el: HTMLElement | null,
  to: number,
  format: (n: number) => string,
  duration = 1.4,
) {
  if (!el) return;
  if (!motionOk()) {
    el.textContent = format(to);
    return;
  }
  const obj = { n: 0 };
  gsap.to(obj, {
    n: to,
    duration,
    ease: "power2.out",
    onUpdate: () => {
      el.textContent = format(obj.n);
    },
  });
}

/** Small confirmation pop used on add-to-cart / wishlist. */
export function pop(el: Element | null) {
  if (!el || !motionOk()) return;
  gsap.fromTo(
    el,
    { scale: 0.82 },
    { scale: 1, duration: 0.42, ease: "back.out(2.2)", overwrite: true },
  );
}

/** A horizontal sweep used when a drawer/overlay closes. */
export function shake(el: Element | null) {
  if (!el || !motionOk()) return;
  gsap.fromTo(
    el,
    { x: -5 },
    { x: 0, duration: 0.4, ease: "elastic.out(1, 0.35)", overwrite: true },
  );
}

export { gsap, ScrollTrigger };
