import { useLanguage } from '../i18n/LanguageContext';
import type { TranslationKey } from '../i18n/translations';
import './AuthHero.css';

// Cards de exemplo que ficam parados nas colunas
const exampleCards = [
  { company: 'Planet Express', position: 'Front-end Developer' },
  { company: 'Monsters, Inc.', position: 'React Developer' },
];

const features: TranslationKey[] = [
  'heroFeature1',
  'heroFeature2',
  'heroFeature3',
];

// Lado esquerdo da tela de login: explica o app com uma animação
function AuthHero() {
  const { t } = useLanguage();

  return (
    <section className="auth-hero">
      <div className="hero-brand">
        <span className="hero-logo" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <rect x="3" y="7" width="18" height="13" rx="2" />
            <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
          </svg>
        </span>
        {t('appTitle')}
      </div>

      <div className="hero-text">
        <h1>
          {t('heroTitleStart')}
          <span className="hero-highlight">{t('heroTitleHighlight')}</span>.
        </h1>
        <p>{t('heroSubtitle')}</p>
      </div>

      {/* Mini quadro: o card "Acme" anda de Enviada para Entrevista e Proposta */}
      <div className="hero-board" aria-hidden="true">
        <div className="hero-columns">
          <span>{t('applied')}</span>
          <span>{t('interview')}</span>
          <span>{t('offer')}</span>
        </div>

        <div className="hero-lanes">
          {exampleCards.map((card) => (
            <div key={card.company} className="hero-card">
              <strong>{card.company}</strong>
              <span>{card.position}</span>
            </div>
          ))}
          <div className="hero-card hero-card-empty" />

          <div className="hero-card hero-card-moving">
            <strong>Acme</strong>
            <span>Junior Front-end</span>
            <div className="hero-pills">
              <span className="hero-pill pill-applied">{t('applied')}</span>
              <span className="hero-pill pill-interview">{t('interview')}</span>
              <span className="hero-pill pill-offer">{t('offer')}</span>
            </div>
          </div>
        </div>
      </div>

      <ul className="hero-features">
        {features.map((feature) => (
          <li key={feature}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12l5 5 9-10" />
            </svg>
            {t(feature)}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default AuthHero;
