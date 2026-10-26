import { useI18n, type TKey } from "../i18n";
import { SOURCES, useSettings } from "../settings";
import type { Source } from "../types/video";

const LABELS: Record<Source, TKey> = {
  both: "source.both",
  eporner: "source.eporner",
  pornhub: "source.pornhub",
};

interface SourceSwitchProps {
  onChange?: (source: Source) => void;
}

export default function SourceSwitch({ onChange }: SourceSwitchProps) {
  const { t } = useI18n();
  const { settings, update } = useSettings();

  const pick = (source: Source) => {
    if (source === settings.source) return;
    update({ source });
    onChange?.(source);
  };

  return (
    <label className="sort-control source-select">
      <span>{t("source.label")}</span>
      <select value={settings.source} aria-label={t("source.label")} onChange={(event) => pick(event.target.value as Source)}>
        {SOURCES.map((item) => (
          <option key={item} value={item}>{t(LABELS[item])}</option>
        ))}
      </select>
    </label>
  );
}
