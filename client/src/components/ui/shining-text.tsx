import { motion } from "framer-motion";

type ShiningTextProps = { text: string; className?: string };

export function ShiningText({ text, className }: ShiningTextProps) {
  return (
    <motion.span
      className={className}
      style={{ backgroundImage: "linear-gradient(110deg, #19382d 35%, #fff8d6 50%, #19382d 65%)", backgroundSize: "200% 100%", backgroundClip: "text", WebkitBackgroundClip: "text", color: "transparent" }}
      initial={{ backgroundPosition: "200% 0" }}
      animate={{ backgroundPosition: "-200% 0" }}
      transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
    >{text}</motion.span>
  );
}

export default ShiningText;
