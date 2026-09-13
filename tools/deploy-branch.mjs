// Запасная выкладка: кладёт готовую сборку в ветку gh-pages.
//
// Нужна, когда Actions недоступны. Pages умеет отдавать сайт прямо из ветки,
// сборка при этом делается здесь, а не на их раннере.
//
//   npm run build && node tools/deploy-branch.mjs
import { execFileSync } from 'node:child_process';
import { writeFileSync, existsSync, rmSync } from 'node:fs';

const run = (cmd, args, cwd = 'dist') =>
  execFileSync(cmd, args, { cwd, stdio: 'pipe' }).toString().trim();

if (!existsSync('dist/index.html')) {
  console.error('Сначала соберите сайт: npm run build');
  process.exit(1);
}

// Без этого файла Pages прогонит сборку через Jekyll, а тот пропускает папки,
// начинающиеся с подчёркивания, — то есть весь /_astro с картинками и стилями.
writeFileSync('dist/.nojekyll', '');

const remote = execFileSync('git', ['remote', 'get-url', 'origin']).toString().trim();

rmSync('dist/.git', { recursive: true, force: true });
run('git', ['init', '-q']);
run('git', ['add', '-A']);
run('git', ['-c', 'user.name=Sergey Kurganov', '-c', 'user.email=KSV.kurganov@yandex.ru',
            'commit', '-q', '-m', 'Сборка сайта']);
run('git', ['push', '-q', '-f', remote, 'HEAD:gh-pages']);
rmSync('dist/.git', { recursive: true, force: true });

console.log('Сборка выложена в ветку gh-pages');
