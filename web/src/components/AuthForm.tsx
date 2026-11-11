import { useState } from 'react';
import type { FormEvent } from 'react';
import { login, register } from '../api';
import GoogleButton from './GoogleButton';
import './AuthForm.css';

type AuthFormProps = {
  onLogin: (token: string) => void;
};

function AuthForm({ onLogin }: AuthFormProps) {
  // A mesma tela serve para entrar e para criar conta
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Criando conta: cadastra primeiro e depois já faz login
      if (mode === 'register') {
        await register(email, password);
      }

      const { token } = await login(email, password);
      onLogin(token);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'something went wrong',
      );
    } finally {
      setLoading(false);
    }
  }

  // Troca entre "entrar" e "criar conta" e limpa o erro
  function toggleMode() {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2>{mode === 'login' ? 'Log in' : 'Create account'}</h2>

      <label>
        Email
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>

      <label>
        Password
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={8}
          required
        />
      </label>

      {error && <p className="auth-error">{error}</p>}

      <button type="submit" disabled={loading}>
        {loading ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Sign up'}
      </button>

      <GoogleButton onLogin={onLogin} onError={setError} />

      <button type="button" className="auth-toggle" onClick={toggleMode}>
        {mode === 'login'
          ? "Don't have an account? Sign up"
          : 'Already have an account? Log in'}
      </button>
    </form>
  );
}

export default AuthForm;
