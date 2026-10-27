import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { LANGUAGES, useI18n } from "../i18n";

interface AgeGateProps {
  onConfirm: () => void;
}

export default function AgeGate({ onConfirm }: AgeGateProps) {
  const [declined, setDeclined] = useState(false);
  const { t, lang, setLang } = useI18n();

  return (
    <div className="age-overlay">
      <div className="age-grid" aria-hidden="true" />
      <div className="lang-switch age-lang" role="group" aria-label="Language">
        {LANGUAGES.map((item) => (
          <button
            key={item.code}
            type="button"
            className={lang === item.code ? "lang-option active" : "lang-option"}
            aria-pressed={lang === item.code}
            title={item.label}
            onClick={() => setLang(item.code)}
          >
            {item.short}
          </button>
        ))}
      </div>
      <div className="age-card">
        <span className="corner tl" />
        <span className="corner tr" />
        <span className="corner bl" />
        <span className="corner br" />
        <div className="brand-mark large">N</div>
        <p className="eyebrow centered">{t("age.eyebrow")}</p>
        <h1>{declined ? t("age.deniedTitle") : t("age.title")}</h1>
        <p className="age-copy">{declined ? t("age.deniedCopy") : t("age.copy")}</p>
        {!declined && (
          <button className="button primary full" onClick={onConfirm}>
            <ShieldCheck size={18} /> {t("age.confirm")}
          </button>
        )}
        <button className="button secondary full" onClick={() => setDeclined((value) => !value)}>
          {declined ? t("age.back") : t("age.under")}
        </button>
        <p className="fine-print">{t("age.fine")}</p>
      </div>
    </div>
  );
}
