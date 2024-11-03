import { type Ref, useRef, useEffect } from "react";

export const useScrollToTop = (to: 'top' | 'bottom' = 'top', deps: unknown[] | undefined = undefined) => {
    const ref: Ref<HTMLDivElement> = useRef(null);
    const map = {
        'top': 'start',
        'bottom': 'end',
    } as const;
    useEffect(() => {
        ref.current && ref.current.scrollIntoView({ behavior: 'smooth', block: map[to] });
    }, deps);
    return () => <div ref={ref}/>;
};
