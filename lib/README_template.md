# koa-modern-router

[![npm version](https://img.shields.io/npm/v/koa-modern-router.svg?style=flat)](https://npmjs.org/package/koa-modern-router) [![CircleCI](https://circleci.com/gh/zacanger/koa-modern-router.svg?style=svg)](https://circleci.com/gh/zacanger/koa-modern-router) [![Maintainability](https://api.codeclimate.com/v1/badges/829c8a19da29cb7999be/maintainability)](https://codeclimate.com/github/zacanger/koa-modern-router/maintainability) [![codecov](https://codecov.io/gh/zacanger/koa-modern-router/branch/master/graph/badge.svg)](https://codecov.io/gh/zacanger/koa-modern-router) [![Patreon](https://img.shields.io/badge/patreon-donate-yellow.svg)](https://www.patreon.com/zacanger) [![ko-fi](https://img.shields.io/badge/donate-KoFi-yellow.svg)](https://ko-fi.com/U7U2110VB)

Simple and modern router middleware for [Koa](https://github.com/koajs/koa).
Based on [koa-router](https://github.com/ZijianHe/koa-router).

## IMPORTANT

It is not my goal to simply maintain koa-router under a new name. There may be breaking changes in the future. If you just want to keep using koa-router safely, you should `npm i koa-router@7.4.0` and always use `npm ci` and
`save-exact=true` in your `.npmrc`.

* Express-style routing using `app.get`, `app.put`, `app.post`, etc.
* Named URL parameters.
* Named routes with URL generation.
* Responds to `OPTIONS` requests with allowed methods.
* Support for `405 Method Not Allowed` and `501 Not Implemented`.
* Multiple route middleware.
* Multiple routers.
* Nestable routers.
* ES7 async/await support.

{{#module name="koa-modern-router"}}{{>body}}{{/module}}

## Installation

Install using [npm](https://www.npmjs.org/):

```sh
npm i koa-modern-router
```

## API Reference
{{#module name="koa-modern-router"~}}
  {{>body~}}
  {{>member-index~}}
  {{>members~}}
{{/module~}}

## Patreon Sponsors

This project is sponsored on [Patreon](https://www.patreon.com/zacanger) by:

* Keeley Hammond

## Contributing

Please submit all issues and pull requests to the [zacanger/koa-modern-router](http://github.com/zacanger/koa-modern-router) repository. See [CONTRIBUTING.md](./.github/CONTRIBUTING.md) for details.

## License

[MIT](./LICENSE.md)
