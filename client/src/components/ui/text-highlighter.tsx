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
  ({ children, className, highlightColor = "#b7ff3c" }, ref) => {
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
        className={cn("inline font-semibold", className)}
        style={{
          backgroundImage: `linear-gradient(${highlightColor}, ${highlightColor})`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "0 0",
          backgroundSize: active ? "100% 100%" : "0% 100%",
          boxDecorationBreak: "clone",
          WebkitBoxDecorationBreak: "clone",
        }}
        initial={{ backgroundSize: "0% 100%" }}
        animate={{ backgroundSize: active ? "100% 100%" : "0% 100%" }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        {children}
      </motion.span>
    );
  },
);

TextHighlighter.displayName = "TextHighlighter";

export default TextHighlighter;
