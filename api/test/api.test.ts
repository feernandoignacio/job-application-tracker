import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { after, before, describe, test } from 'node:test';
import app from '../src/app.ts';
import { db } from '../src/database.ts';

// Sobe a API numa porta livre só para os testes
const server = app.listen(0);
let baseUrl = '';

before(() => {
  const { port } = server.address() as AddressInfo;
  baseUrl = `http://localhost:${port}`;
});

// Fecha o servidor e as conexões com o banco no final
after(async () => {
  server.close();
  await db.end();
});

// Email diferente a cada teste, para não conflitar com dados que já existem
function uniqueEmail() {
  return `test-${crypto.randomUUID()}@test.com`;
}

// Atalho para chamar a API e já ler o JSON da resposta
async function api(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
) {
  const response = await fetch(baseUrl + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  return { status: response.status, data: text ? JSON.parse(text) : null };
}

// Cria uma conta, faz login e devolve o token
async function createUser() {
  const email = uniqueEmail();
  const password = 'password123';
  await api('POST', '/auth/register', { email, password });
  const { data } = await api('POST', '/auth/login', { email, password });
  return { email, password, token: data.token as string };
}

describe('health', () => {
  test('responds ok', async () => {
    const { status, data } = await api('GET', '/health');
    assert.equal(status, 200);
    assert.deepEqual(data, { status: 'ok' });
  });
});

describe('register', () => {
  test('creates an account', async () => {
    const email = uniqueEmail();
    const { status, data } = await api('POST', '/auth/register', {
      email,
      password: 'password123',
    });
    assert.equal(status, 201);
    assert.equal(data.email, email);
    assert.equal(data.password_hash, undefined);
  });

  test('rejects a duplicated email', async () => {
    const { email } = await createUser();
    const { status } = await api('POST', '/auth/register', {
      email,
      password: 'password123',
    });
    assert.equal(status, 409);
  });

  test('rejects an invalid email and a short password', async () => {
    const invalidEmail = await api('POST', '/auth/register', {
      email: 'not-an-email',
      password: 'password123',
    });
    const shortPassword = await api('POST', '/auth/register', {
      email: uniqueEmail(),
      password: '123',
    });
    assert.equal(invalidEmail.status, 400);
    assert.equal(shortPassword.status, 400);
  });
});

describe('login', () => {
  test('returns a token with the right password', async () => {
    const { token } = await createUser();
    assert.equal(typeof token, 'string');
    assert.ok(token.length > 20);
  });

  test('gives the same error for wrong password and unknown email', async () => {
    const { email } = await createUser();
    const wrongPassword = await api('POST', '/auth/login', {
      email,
      password: 'wrong-password',
    });
    const unknownEmail = await api('POST', '/auth/login', {
      email: uniqueEmail(),
      password: 'password123',
    });
    assert.equal(wrongPassword.status, 401);
    assert.equal(unknownEmail.status, 401);
    assert.deepEqual(wrongPassword.data, unknownEmail.data);
  });

  test('blocks the email after 5 wrong passwords', async () => {
    const { email, password } = await createUser();

    for (let attempt = 0; attempt < 5; attempt++) {
      await api('POST', '/auth/login', { email, password: 'wrong-password' });
    }

    // Mesmo com a senha certa, fica bloqueado
    const { status } = await api('POST', '/auth/login', { email, password });
    assert.equal(status, 429);
  });
});

describe('current user', () => {
  test('returns the name and email of who is logged in', async () => {
    const email = uniqueEmail();
    await api('POST', '/auth/register', {
      email,
      password: 'password123',
      name: 'Lucas',
    });
    const { data: login } = await api('POST', '/auth/login', {
      email,
      password: 'password123',
    });

    const { status, data } = await api(
      'GET',
      '/auth/me',
      undefined,
      login.token,
    );
    assert.equal(status, 200);
    assert.equal(data.email, email);
    assert.equal(data.name, 'Lucas');
  });

  test('requires a token', async () => {
    const { status } = await api('GET', '/auth/me');
    assert.equal(status, 401);
  });
});

describe('google login', () => {
  test('rejects a request without token', async () => {
    const { status } = await api('POST', '/auth/google', {});
    assert.equal(status, 400);
  });

  test('rejects a fake token', async () => {
    const { status } = await api('POST', '/auth/google', {
      accessToken: 'fake-token',
    });
    // 503 quando o Google não está configurado (como no CI), 401 quando está
    assert.ok(status === 401 || status === 503);
  });
});

describe('applications', () => {
  test('require a valid token', async () => {
    const noToken = await api('GET', '/applications');
    const fakeToken = await api('GET', '/applications', undefined, 'fake');
    assert.equal(noToken.status, 401);
    assert.equal(fakeToken.status, 401);
  });

  test('can be created, listed, edited and deleted', async () => {
    const { token } = await createUser();

    const created = await api(
      'POST',
      '/applications',
      { company: 'Acme', position: 'Developer', status: 'applied' },
      token,
    );
    assert.equal(created.status, 201);
    const id = created.data.id;

    const list = await api('GET', '/applications', undefined, token);
    assert.equal(list.data.length, 1);

    const edited = await api(
      'PATCH',
      `/applications/${id}`,
      { status: 'interview', notes: 'Call on Monday' },
      token,
    );
    assert.equal(edited.status, 200);
    assert.equal(edited.data.status, 'interview');
    assert.equal(edited.data.notes, 'Call on Monday');
    assert.equal(edited.data.company, 'Acme');

    const deleted = await api(
      'DELETE',
      `/applications/${id}`,
      undefined,
      token,
    );
    assert.equal(deleted.status, 204);

    const empty = await api('GET', '/applications', undefined, token);
    assert.equal(empty.data.length, 0);
  });

  test('validate the fields', async () => {
    const { token } = await createUser();
    const { status } = await api(
      'POST',
      '/applications',
      { company: '', position: 'Developer', status: 'applied' },
      token,
    );
    assert.equal(status, 400);
  });

  test("users can't see or change each other's data", async () => {
    const userA = await createUser();
    const userB = await createUser();

    const created = await api(
      'POST',
      '/applications',
      { company: 'Secret', position: 'Developer', status: 'applied' },
      userA.token,
    );
    const id = created.data.id;

    const listB = await api('GET', '/applications', undefined, userB.token);
    const patchB = await api(
      'PATCH',
      `/applications/${id}`,
      { status: 'offer' },
      userB.token,
    );
    const deleteB = await api(
      'DELETE',
      `/applications/${id}`,
      undefined,
      userB.token,
    );

    assert.deepEqual(listB.data, []);
    assert.equal(patchB.status, 404);
    assert.equal(deleteB.status, 404);

    // A candidatura do usuário A continua intacta
    const listA = await api('GET', '/applications', undefined, userA.token);
    assert.equal(listA.data[0].status, 'applied');
  });
});

describe('logout', () => {
  test('invalidates the token', async () => {
    const { token } = await createUser();

    const logout = await api('POST', '/auth/logout', undefined, token);
    const after = await api('GET', '/applications', undefined, token);

    assert.equal(logout.status, 204);
    assert.equal(after.status, 401);
  });
});
