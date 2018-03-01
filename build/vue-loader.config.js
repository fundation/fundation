module.exports = {
  extractCSS: process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging',
  preserveWhitespace: false,
  postcss: [
    require('autoprefixer')({
      browsers: ['last 3 versions']
    })
  ]
}
