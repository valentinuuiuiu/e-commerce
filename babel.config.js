module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }], // For Jest environment
    '@babel/preset-typescript',
    ['@babel/preset-react', { runtime: 'automatic' }] // Use automatic runtime for React 17+
  ]
};
