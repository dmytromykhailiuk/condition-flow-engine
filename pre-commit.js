const asyncExec = require('./asyncExec');
const fs = require('fs');

(async () => {
  const branchName = (await asyncExec('git rev-parse --abbrev-ref HEAD')) || '';

  if (branchName !== 'main') {
    return process.exit(0);
  }

  console.log('Start pre-commit script');

  await asyncExec('npm run compile && git add dist');

  const package = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  const packageLock = JSON.parse(fs.readFileSync('package-lock.json', 'utf-8'));
  const versionArr = package.version.split('.');

  fs.writeFileSync(
    'package.json',
    JSON.stringify(
      {
        ...package,
        version: [versionArr[0], versionArr[1], Number(versionArr[2]) + 1].join('.'),
      },
      null,
      2,
    ),
  );

  fs.writeFileSync(
    'package-lock.json',
    JSON.stringify(
      {
        ...packageLock,
        version: [versionArr[0], versionArr[1], Number(versionArr[2]) + 1].join('.'),
      },
      null,
      2,
    ),
  );

  await asyncExec('git add package.json');
  await asyncExec('git add package-lock.json');

  console.log('Finish pre-commit script');

  return process.exit(0);
})();
