import { useRef, useEffect } from "react";

export const TextArea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.height = "inherit";
    if (props.value) {
      const docHeight = document.documentElement.clientHeight;
      const contentScrollHeight = ref.current.scrollHeight;
      const plannedHeight = Math.min(Math.max(contentScrollHeight, 0), Math.floor(docHeight / 2));
      ref.current.style.height = `${plannedHeight}px`;
    }
  }, [props.value]);
  return <textarea {...props} ref={ref} />;
};
