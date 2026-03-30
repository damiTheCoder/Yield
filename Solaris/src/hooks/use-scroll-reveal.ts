import { useCallback, useEffect, useRef } from "react";

export function useScrollReveal(options?: IntersectionObserverInit) {
  const observers = useRef<IntersectionObserver[]>([]);

  useEffect(() => {
    return () => {
      observers.current.forEach((observer) => observer.disconnect());
      observers.current = [];
    };
  }, []);

  return useCallback(
    (node: HTMLElement | null) => {
      if (!node) return;
      if (node.dataset.srAttached === "true") return;
      node.dataset.srAttached = "true";
      node.classList.add("sr-initial");

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("animate-fade-up");
              entry.target.classList.remove("sr-initial");
            } else {
              entry.target.classList.remove("animate-fade-up");
              entry.target.classList.add("sr-initial");
            }
          });
        },
        { rootMargin: "0px 0px -12% 0px", threshold: 0.15, ...options },
      );

      observer.observe(node);
      observers.current.push(observer);
    },
    [options],
  );
}
