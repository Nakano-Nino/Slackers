// PM2 Process Manager Configuration for Slackers (Native Bare-Metal Deployment)
module.exports = {
  apps: [
    {
      name: 'slackers-api',
      cwd: './apps/api',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5001,
      },
      error_file: '../../logs/api-error.log',
      out_file: '../../logs/api-out.log',
      time: true,
    },
    {
      name: 'slackers-web',
      cwd: './apps/web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '../../logs/web-error.log',
      out_file: '../../logs/web-out.log',
      time: true,
    },
  ],
};
