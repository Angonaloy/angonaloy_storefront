import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

import { cn } from "@/lib/utils";

export type TextHighlighterRef = {
  animate: () => void;
  reset: () => void;
};

type TextHighlighterProps = {
  children: React.ReactNode;
  className?: string;
  highlightColor?: string;
};

export const TextHighlighter = forwardRef<TextHighlighterRef, TextHighlighterProps>(
  ({ children, className, highlightColor = "#f5d76e" }, ref) => {
    const elementRef = useRef<HTMLSpanElement>(null);
    const [manualAnimation, setManualAnimation] = useState(false);
    const inView = useInView(elementRef, { once: true, amount: 0.1 });

    useImperativeHandle(ref, () => ({
      animate: () => setManualAnimation(true),
      reset: () => setManualAnimation(false),
    }));

    const active = inView || manualAnimation;

    return (
      <motion.span
        ref={elementRef}
        className={cn("inline rounded-[3px] px-1 font-semibold", className)}
        style={{
          backgroundImage: `linear-gradient(${highlightColor}, ${highlightColor})`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "0 88%",
          backgroundSize: active ? "100% 42%" : "0% 42%",
          boxDecorationBreak: "clone",
          WebkitBoxDecorationBreak: "clone",
        }}
        initial={{ backgroundSize: "0% 42%" }}
        animate={{ backgroundSize: active ? "100% 42%" : "0% 42%" }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        {children}
      </motion.span>
    );
  },
);

TextHighlighter.displayName = "TextHighlighter";

export default TextHighlighter;
