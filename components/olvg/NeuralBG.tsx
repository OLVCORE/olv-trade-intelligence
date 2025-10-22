'use client';
import { motion } from 'framer-motion';

export default function NeuralBG() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-olv-ink">
      <motion.div
        className="absolute inset-0 bg-neural"
        initial={{ opacity: 0.0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(700px_250px_at_40%_-10%,rgba(255,255,255,0.08),transparent)] dark:bg-[radial-gradient(700px_250px_at_40%_-10%,rgba(255,255,255,0.04),transparent)]" />
    </div>
  );
}


