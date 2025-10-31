module.exports = {
  apps: [{
    name: 'mlnf-frontend',
    script: 'npx',
    args: 'serve -l 3000 -s .',
    cwd: '/home/user/mlnf/frontend',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    env: {
      NODE_ENV: 'development'
    }
  }]
};
