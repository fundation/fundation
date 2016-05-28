# Fundation

A fun and simple way to build a site.

```js
var fundation = require('fundation');
var app = require('express')();

app.use(fundation.init());

app.listen(8080)
```

## Installation

```bash
$ npm install fundation
```

## Models

```js
module.exports = function(app) {
  return {
    get: function (slug) {
      return {
        title: "My Title",
        description: "Bacon ipsum dolor frankfurter ham"
      }
    }
  };
};
```

## Controllers

```js
var article = require('fundation').model.article;

module.exports = function (app) {
  app.route('/article/:slug')
    .get(function (req, res, next) {
      res.render('article.swig', {
        article: article.get(req.params.slug)
    });
  });
};
```

## Views

```html
<h1>{{ article.title }}</h1>
<p>{{ article.description }}</p>
```

## License

  [MIT](LICENSE)
