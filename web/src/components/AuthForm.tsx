import { useState } from 'react';
import type { FormEvent } from 'react';
import { login, register } from '../api';
import { useLanguage } from '../i18n/LanguageContext';
import { isTranslationKey } from '../i18n/translations';
import GoogleButton from './GoogleButton';
import LanguageSelect from './LanguageSelect';
import './AuthForm.css';

type AuthFormProps = {
  onLogin: (token: string) => void;
};

function AuthForm({ onLogin }: AuthFormProps) {
  const { t } = useLanguage();

  // A mesma tela serve para entrar e para criar conta
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isRegister = mode === 'register';

  // O botão só fica ativo quando os campos obrigatórios estão preenchidos
  const canSubmit =
    email.trim() !== '' &&
    password !== '' &&
    (!isRegister || name.trim() !== '') &&
    !loading;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Criando conta: cadastra primeiro e depois já faz login
      if (isRegister) {
        await register(email, password, name);
      }

      const { token } = await login(email, password);
      onLogin(token);
    } catch (caught) {
      // Se o erro da API tiver tradução, mostra traduzido
      const message =
        caught instanceof Error ? caught.message : 'something went wrong';
      setError(isTranslationKey(message) ? t(message) : message);
    } finally {
      setLoading(false);
    }
  }

  // Troca entre "entrar" e "criar conta" e limpa o erro
  function toggleMode() {
    setMode(isRegister ? 'login' : 'register');
    setError('');
  }

  return (
    <div className="auth-wrapper">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>{isRegister ? t('createAccount') : t('logIn')}</h2>

        {/* Google primeiro, depois a linha "or" e o formulário normal */}
        <GoogleButton onLogin={onLogin} onError={setError} />

        {isRegister && (
          <label>
            {t('name')}
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t('namePlaceholder')}
              autoComplete="name"
              required
            />
          </label>
        )}

        <label>
          {t('email')}
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t('emailPlaceholder')}
            autoComplete="email"
            required
          />
        </label>

        <label>
          {t('password')}
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={
              isRegister
                ? t('newPasswordPlaceholder')
                : t('passwordPlaceholder')
            }
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            minLength={8}
            required
          />
        </label>

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" className="auth-submit" disabled={!canSubmit}>
          {loading
            ? t('pleaseWait')
            : isRegister
              ? t('createAccount')
              : t('continue')}
        </button>

        {/* Embaixo do botão: link para criar conta (esquerda) e idioma (direita) */}
        <div className="auth-footer">
          <button type="button" className="auth-switch" onClick={toggleMode}>
            {isRegister ? t('haveAccount') : t('noAccount')}{' '}
            <strong>{isRegister ? t('logIn') : t('signUp')}</strong>
          </button>

          <LanguageSelect direction="up" />
        </div>
      </form>
    </div>
  );
}

export default AuthForm;
