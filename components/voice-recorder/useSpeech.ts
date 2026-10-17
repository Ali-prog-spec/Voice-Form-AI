"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Text-to-speech through the browser's built-in voices (no API key, nothing leaves the device). */
export function useSpeech() {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const voice = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    setSupported(true);
    const pick = () => {
      const voices = window.speechSynthesis.getVoices();
      voice.current =
        voices.find((v) => /^en/i.test(v.lang) && /natural|google|online/i.test(v.name)) ??
        voices.find((v) => /^en/i.test(v.lang)) ??
        null;
    };
    pick();
    window.speechSynthesis.addEventListener("voiceschanged", pick);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", pick);
      window.speechSynthesis.cancel();
    };
  }, []);

  const cancel = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !text.trim()) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (voice.current) u.voice = voice.current;
    u.lang = voice.current?.lang ?? "en-US";
    u.rate = 1;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  }, []);

  return { supported, speaking, speak, cancel };
}
