module.exports = {
  apps: [
    {
      name: "port-flow-web",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      max_memory_restart: "1G",
      autorestart: true,
      watch: false,
    },
  ],
};
