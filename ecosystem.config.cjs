module.exports = {
  apps: [
    {
      name: 'nome-magnetico',
      script: './start.mjs', // Apontando para o injetor
      instances: 2,
      exec_mode: 'cluster',
      time: true,
      env: {
        PORT: 4321,
        HOST: '0.0.0.0',
        NODE_ENV: 'production',
      },
    },
  ],
};