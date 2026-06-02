import React from "react";
import { motion } from "framer-motion";

export default function Modal({ children, onClose }) {
  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/55 px-4 pb-4 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="max-h-[88vh] w-full max-w-[485px] overflow-y-auto rounded-[2rem] border border-white/10 bg-[#11100f]/95 p-5 shadow-soft"
        initial={{ y: 80, scale: 0.96 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 60, scale: 0.98 }}
        transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.45 }}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
