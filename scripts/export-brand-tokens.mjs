import { writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import tailwind from '../tailwind.config.mjs';

const { colors, fontFamily } = tailwind.theme.extend;
const [tag, sha, output] = process.argv.slice(2);
if (!/^v\d+\.\d+\.\d+$/.test(tag ?? '') || !/^[0-9a-f]{40}$/.test(sha ?? '') || !output) {
  throw new Error('Informe a tag de deploy, o SHA completo e o arquivo de saída.');
}
const checkoutSha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
if (checkoutSha !== sha) throw new Error('O SHA informado difere do checkout dos tokens.');

const tokens = {
  primary: colors.brand.primary,
  background: colors.dark.DEFAULT,
  deep_background: colors.dark.deeper,
  heading: fontFamily.cinzel.join(', '),
  body: fontFamily.inter.join(', '),
};
if (Object.values(tokens).some((value) => typeof value !== 'string' || !value.trim())) {
  throw new Error('Token público ausente.');
}

await writeFile(output, JSON.stringify({ tag, sha, deployed_at: new Date().toISOString(), tokens }, null, 2) + '\n');
