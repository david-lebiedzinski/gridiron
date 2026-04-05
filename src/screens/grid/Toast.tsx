import { useEffect, useRef } from "react";

interface ToastProps {
  message: string | null;
  type: "success" | "error" | "info";
}

export default function Toast({ message, type }: ToastProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    if (message) {
      ref.current.textContent = message;
      ref.current.className = `grid-toast ${type} show`;

      const timer = setTimeout(() => {
        if (ref.current) {
          ref.current.classList.remove("show");
        }
      }, 1800);

      return () => clearTimeout(timer);
    } else {
      ref.current.classList.remove("show");
    }
  }, [message, type]);

  return <div ref={ref} className="grid-toast" />;
}
