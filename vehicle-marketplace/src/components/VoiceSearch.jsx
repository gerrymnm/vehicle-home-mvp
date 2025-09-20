import React, { useEffect, useRef, useState } from "react";

export default function VoiceSearch({ initialValue = "", onSubmit }) {
  const [value, setValue] = useState(initialValue);
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);

  useEffect(() => setValue(initialValue), [initialValue]);

  useEffect(() => {
    // Web Speech API (graceful fallback)
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = (e) => {
      const t = e.results?.[0]?.[0]?.transcript || "";
      if (t) setValue((prev) => (prev ? `${prev} ${t}` : t));
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);

    recRef.current = rec;
  }, []);

  function startVoice() {
    if (!recRef.current) return;
    try {
      setListening(true);
      recRef.current.start();
    } catch {
      setListening(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.(value);
      }}
      className="relative"
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder='Try: "2020–2022 Toyota SUVs under 30k near San Jose"'
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-24 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
      />

      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
        <button
          type="button"
          onClick={startVoice}
          className={`h-9 w-9 grid place-items-center rounded-full border ${
            listening ? "bg-emerald-50 border-emerald-300" : "hover:bg-gray-50"
          }`}
          title="Speak your search"
        >
          <span className={`dot ${listening ? "bg-emerald-500" : "bg-gray-300"}`}></span>
        </button>
        <button
          type="submit"
          className="px-3 py-1.5 rounded-md bg-black text-white text-sm hover:bg-gray-800"
        >
          Search
        </button>
      </div>
    </form>
  );
}
