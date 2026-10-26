import { useEffect, useState } from "react";
import { hasCyrillic, peekTranslation, translateText } from "../services/translate";

const RETRY_DELAYS = [4000, 10000, 25000];

export function useTranslated(text: string, enabled: boolean): string {
  const [value, setValue] = useState(() => (enabled && text ? peekTranslation(text, "en|ru") ?? text : text));

  useEffect(() => {
    if (!enabled || !text || hasCyrillic(text)) {
      setValue(text);
      return;
    }
    const cached = peekTranslation(text, "en|ru");
    if (cached) {
      setValue(cached);
      return;
    }
    setValue(text);
    let cancelled = false;
    let timer: number | undefined;

    // A failed request used to leave the title in English forever; now it is retried a few times.
    const attempt = (n: number) => {
      translateText(text, "en|ru")
        .then((result) => {
          if (!cancelled) setValue(result);
        })
        .catch(() => {
          if (cancelled || n >= RETRY_DELAYS.length) return;
          timer = window.setTimeout(() => attempt(n + 1), RETRY_DELAYS[n]);
        });
    };
    attempt(0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [text, enabled]);

  return value;
}
