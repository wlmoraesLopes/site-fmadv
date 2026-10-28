// Senha do admin (scrypt), sessão assinada por HMAC e limite de tentativas de login.
import { scrypt, randomBytes, createHmac, timingSafeEqual } from 'node:crypto';

const derive = (senha, sal) => new Promise((ok, erro) =>
  scrypt(senha, sal, 32, (e, chave) => (e ? erro(e) : ok(chave))));

export async function hashPassword(senha) {
  const sal = randomBytes(16);
  return `scrypt$${sal.toString('base64')}$${(await derive(senha, sal)).toString('base64')}`;
}

export async function verifyPassword(senha, guardado) {
  const [alg, sal, hash] = String(guardado || '').split('$');
  if (alg !== 'scrypt' || !sal || !hash) return false;
  const esperado = Buffer.from(hash, 'base64');
  const obtido = await derive(String(senha), Buffer.from(sal, 'base64'));
  return esperado.length === obtido.length && timingSafeEqual(esperado, obtido);
}

const assina = (segredo, texto) => createHmac('sha256', segredo).update(texto).digest('base64url');

// Token = "<expiração em ms>.<hmac>"
export function signSession(segredo, ttlSec = 28800, agora = Date.now()) {
  const exp = String(agora + ttlSec * 1000);
  return `${exp}.${assina(segredo, exp)}`;
}

export function verifySession(segredo, token, agora = Date.now()) {
  if (!segredo || typeof token !== 'string') return false;
  const [exp, mac] = token.split('.');
  if (!exp || !mac || !/^\d+$/.test(exp)) return false;
  const a = Buffer.from(mac);
  const b = Buffer.from(assina(segredo, exp));
  return a.length === b.length && timingSafeEqual(a, b) && Number(exp) > agora;
}

// Em memória, por instância da função: freia tentativas seguidas de adivinhar a senha.
export function rateLimiter({ max = 5, windowMs = 600_000, now = Date.now } = {}) {
  const falhas = new Map();
  const atuais = (ip) => (falhas.get(ip) || []).filter((t) => now() - t < windowMs);
  return {
    blocked: (ip) => atuais(ip).length >= max,
    fail: (ip) => falhas.set(ip, [...atuais(ip), now()]),
    reset: (ip) => falhas.delete(ip),
  };
}
