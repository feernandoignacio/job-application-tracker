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
      setError(
        caught instanceof Error ? caught.message : 'something went wrong',
      );
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
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2>{isRegister ? 'Create account' : 'Log in'}</h2>

      {/* Google primeiro, depois a linha "or" e o formulário normal */}
      <GoogleButton onLogin={onLogin} onError={setError} />

      {isRegister && (
        <label>
          Name
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Enter your name"
            autoComplete="name"
            required
          />
        </label>
      )}

      <label>
        Email
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Enter your email"
          autoComplete="email"
          required
        />
      </label>

      <label>
        Password
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={
            isRegister ? 'At least 8 characters' : 'Enter your password'
          }
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          minLength={8}
          required
        />
      </label>

      {error && <p className="auth-error">{error}</p>}

      <button type="submit" className="auth-submit" disabled={!canSubmit}>
        {loading
          ? 'Please wait...'
          : isRegister
            ? 'Create account'
            : 'Continue'}
      </button>

      <button type="button" className="auth-toggle" onClick={toggleMode}>
        {isRegister
          ? 'Already have an account? Log in'
          : "Don't have an account? Sign up"}
      </button>
    </form>
  );
}

export default AuthForm;
