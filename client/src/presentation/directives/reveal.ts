import type { Directive } from 'vue';

const observers = new WeakMap<HTMLElement, IntersectionObserver>();

export const vReveal: Directive<HTMLElement, number | undefined> = {
  mounted(el, { value: delay = 0 }) {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !('IntersectionObserver' in window)) return;

    el.classList.add('reveal');
    el.style.setProperty('--reveal-delay', `${delay}ms`);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        el.classList.add('reveal-in');
        observer.disconnect();
      },
      { threshold: 0.12 },
    );
    observer.observe(el);
    observers.set(el, observer);
  },
  unmounted(el) {
    observers.get(el)?.disconnect();
  },
};
