import { type Ref, useRef, useEffect } from "react";

// export const useScrollToTop = (to: "top" | "bottom" = "top", deps: unknown[] | undefined = undefined) => {
//   const ref: Ref<HTMLDivElement> = useRef(null);
//   const map = {
//     top: "start",
//     bottom: "end",
//   } as const;
//   useEffect(() => {
//     ref.current && ref.current.scrollIntoView({ behavior: "smooth", block: map[to] });
//   }, deps);
//   return () => <div ref={ref} />;
// };
export const useScrollToTopRef = (deps: any) => {
  const pageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    pageRef.current?.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  }, deps);

  return pageRef;
};

export const useScrollToBottomRef = (deps: any) => {
  const pageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    pageRef.current?.scrollTo({
      top: pageRef.current.scrollHeight,
      left: 0,
      behavior: "smooth",
    });
  }, deps);

  return pageRef;
};
