"use client";

import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { Smile } from "lucide-react";

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

export default function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={pickerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-3 rounded-2xl glass border-black/5 hover:bg-black/5 transition-all text-black/40 hover:text-black flex items-center justify-center shadow-sm"
        title="Add emoji"
      >
        <Smile size={22} />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-[9999] animate-fade-in origin-top-left">
          <div className="shadow-2xl shadow-black/20 rounded-[2.5rem] overflow-hidden">
            <Picker
              data={data}
              onEmojiSelect={(emoji: { native: string }) => {
                onEmojiSelect(emoji.native);
                setIsOpen(false);
              }}
              theme="light"
              previewPosition="none"
              skinTonePosition="none"
              maxFrequentRows={2}
              perLine={8}
              set="native"
            />
          </div>
        </div>
      )}
    </div>
  );
}
