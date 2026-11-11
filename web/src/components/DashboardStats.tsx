import { useLanguage } from '../i18n/LanguageContext';
import type { TranslationKey } from '../i18n/translations';
import type { Application, ApplicationStatus } from '../types/application';
import './DashboardStats.css';

type DashboardStatsProps = {
  applications: Application[];
};

// Os 4 números do resumo: o total e um por etapa
const stats: { key: TranslationKey; status?: ApplicationStatus }[] = [
  { key: 'statTotal' },
  { key: 'statApplied', status: 'applied' },
  { key: 'statInterview', status: 'interview' },
  { key: 'statOffer', status: 'offer' },
];

function DashboardStats({ applications }: DashboardStatsProps) {
  const { t } = useLanguage();

  // Sem status = conta todas; com status = conta só as daquela etapa
  function count(status?: ApplicationStatus) {
    if (!status) {
      return applications.length;
    }
    return applications.filter((application) => application.status === status)
      .length;
  }

  return (
    <dl className="dashboard-stats" aria-label={t('summaryLabel')}>
      {stats.map((stat) => (
        <div key={stat.key} className={`stat stat-${stat.status ?? 'total'}`}>
          <dt>{t(stat.key)}</dt>
          <dd>{count(stat.status)}</dd>
        </div>
      ))}
    </dl>
  );
}

export default DashboardStats;
