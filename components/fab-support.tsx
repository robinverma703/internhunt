"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Send, X } from "lucide-react";

export default function FabSupport() {
  const [open, setOpen] = useState(false);
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_LINK ?? "#";
  const telegram = process.env.NEXT_PUBLIC_TELEGRAM_LINK ?? "#";

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.9 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col gap-2"
          >
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor-hover
              className="flex items-center gap-3 rounded-full bg-white pl-4 pr-5 py-3 text-sm font-medium text-graphite shadow-card hover:shadow-card-hover transition-shadow"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-mint-dim text-mint">
                <MessageCircle size={16} />
              </span>
              WhatsApp support
            </a>
            <a
              href={telegram}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor-hover
              className="flex items-center gap-3 rounded-full bg-white pl-4 pr-5 py-3 text-sm font-medium text-graphite shadow-card hover:shadow-card-hover transition-shadow"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-signal-dim text-signal">
                <Send size={16} />
              </span>
              Telegram channel
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        data-cursor-hover
        onClick={() => setOpen((v) => !v)}
        whileTap={{ scale: 0.92 }}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-graphite text-white shadow-card-hover"
        aria-label={open ? "Close support menu" : "Open support menu"}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? "close" : "open"}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {open ? <X size={22} /> : <MessageCircle size={22} />}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
