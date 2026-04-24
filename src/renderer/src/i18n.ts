import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import ar from './locales/ar.json'

const STORAGE_KEY = 'pharmacy.lang'

const initialLang =
  (typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY)) || 'en'

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar }
  },
  lng: initialLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
})

applyDirection(initialLang)

i18n.on('languageChanged', (lng) => {
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, lng)
  applyDirection(lng)
})

function applyDirection(lng: string): void {
  if (typeof document === 'undefined') return
  const dir = lng === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.setAttribute('dir', dir)
  document.documentElement.setAttribute('lang', lng)
}

export default i18n
