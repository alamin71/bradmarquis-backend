module.exports = {
  apps: [
    {
      name: 'bradmarquis-backend',
      script: 'dist/server.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
        IP_ADDRESS: '0.0.0.0'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
        IP_ADDRESS: '0.0.0.0'
      }
    }
  ]
};
