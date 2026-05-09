import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import zhTW from './locales/zh-TW.json';
import en from './locales/en.json';

/**
 * 自動掃描所有模組目錄下的 i18n/<locale>.json，
 * 以模組資料夾名為 namespace 動態註冊。
 *
 * 例如 src/modules/home/i18n/zh-TW.json → namespace 'home'
 */
type LocaleJson = Record<string, unknown>;

function buildModuleResources(): { 'zh-TW': Record<string, LocaleJson>; en: Record<string, LocaleJson> } {
  // 注意：import.meta.glob 必須用相對於本檔案的路徑，不可用 @/ alias
  const zhFiles = import.meta.glob('../../modules/*/i18n/zh-TW.json', { eager: true }) as Record<
    string,
    { default: LocaleJson }
  >;
  const enFiles = import.meta.glob('../../modules/*/i18n/en.json', { eager: true }) as Record<
    string,
    { default: LocaleJson }
  >;

  const extractNs = (path: string) => {
    // 從 '/src/modules/<ns>/i18n/<locale>.json' 取出 <ns>
    const m = path.match(/modules\/([^/]+)\//);
    return m?.[1] ?? 'unknown';
  };

  const zhResources: Record<string, LocaleJson> = {};
  Object.entries(zhFiles).forEach(([p, mod]) => {
    zhResources[extractNs(p)] = mod.default;
  });
  const enResources: Record<string, LocaleJson> = {};
  Object.entries(enFiles).forEach(([p, mod]) => {
    enResources[extractNs(p)] = mod.default;
  });

  return { 'zh-TW': zhResources, en: enResources };
}

const moduleResources = buildModuleResources();

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'zh-TW',
    supportedLngs: ['zh-TW', 'en'],
    defaultNS: 'common',
    ns: ['common', ...Object.keys(moduleResources['zh-TW'])],
    resources: {
      'zh-TW': {
        common: zhTW,
        ...moduleResources['zh-TW'],
      },
      en: {
        common: en,
        ...moduleResources.en,
      },
    },
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'app.locale',
      caches: ['localStorage'],
    },
  });

export default i18n;
