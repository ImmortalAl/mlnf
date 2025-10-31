module.exports = {
  apps: [{
    name: 'mlnf-backend',
    script: 'server.js',
    cwd: '/home/user/mlnf/backend',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    env_file: '.env',
    env: {
      NODE_ENV: 'development'
    }
  }]
};
