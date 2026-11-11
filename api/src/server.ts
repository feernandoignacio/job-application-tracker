import app from './app.ts';

// Na hospedagem a porta vem do ambiente; no seu computador usa 3333
const PORT = process.env.PORT ?? 3333;

app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
});

// A Vercel usa este export para rodar a API
export default app;
