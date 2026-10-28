// Gera o valor de ADMIN_PASSWORD_HASH: node scripts/hash-password.mjs (digite a senha e Enter).
import { hashPassword } from '../lib/auth.mjs';

let senha = '';
process.stdin.setEncoding('utf8');
for await (const parte of process.stdin) senha += parte;
senha = senha.replace(/\r?\n$/, '');
if (senha.length < 10) {
  console.error('Use uma senha com pelo menos 10 caracteres.');
  process.exit(1);
}
console.log(await hashPassword(senha));
