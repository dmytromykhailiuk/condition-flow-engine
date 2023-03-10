const { exec } = require('child_process');

const asyncExec = (command) =>
  new Promise((resolve, reject) => {
    console.log(command, '-> START');

    exec(command, (error, stdout) => {
      if (error) {
        console.log('');
        console.error(error);
        console.log('');
        reject(error);
      }

      console.log(command, '-> FINISH');

      return typeof stdout === 'string' ? resolve(stdout.trim()) : resolve();
    });
  });

module.exports = asyncExec;
