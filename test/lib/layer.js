/* eslint-disable max-lines, max-lines-per-function, max-nested-callbacks */

const Koa = require('koa')
const http = require('http')
const request = require('supertest')
const Router = require('../../lib/router')
const Layer = require('../../lib/layer')

describe('Layer', () => {
  it('composes multiple callbacks/middleware', (done) => {
    const app = new Koa()
    const router = new Router()
    app.use(router.routes())
    router.get(
      '/:category/:title',
      (ctx, next) => {
        ctx.status = 500
        return next()
      },
      (ctx, next) => {
        ctx.status = 204
        return next()
      }
    )
    request(http.createServer(app.callback()))
      .get('/programming/how-to-node')
      .expect(204)
      .end((err) => {
        if (err) return done(err)
        done()
      })
  })

  describe('Layer#matchLength()', () => {
    it('captures URL path parameters', (done) => {
      const app = new Koa()
      const router = new Router()
      app.use(router.routes())
      router.get('/:category/:title', (ctx) => {
        ctx.should.have.property('params')
        ctx.params.should.be.type('object')
        ctx.params.should.have.property('category', 'match')
        ctx.params.should.have.property('title', 'this')
        ctx.status = 204
      })
      request(http.createServer(app.callback()))
        .get('/match/this')
        .expect(204)
        .end((err) => {
          if (err) return done(err)
          done()
        })
    })

    it('return original path parameters when decodeURIComponent throw error', (done) => {
      const app = new Koa()
      const router = new Router()
      app.use(router.routes())
      router.get('/:category/:title', (ctx) => {
        ctx.should.have.property('params')
        ctx.params.should.be.type('object')
        ctx.params.should.have.property('category', '100%')
        ctx.params.should.have.property('title', '101%')
        ctx.status = 204
      })
      request(http.createServer(app.callback()))
        .get('/100%/101%')
        .expect(204)
        .end(done)
    })

    it('populates ctx.captures with regexp captures', (done) => {
      const app = new Koa()
      const router = new Router()
      app.use(router.routes())
      // eslint-disable-next-line no-useless-escape
      router.get(/^\/api\/([^\/]+)\/?/i, (ctx, next) => {
        ctx.should.have.property('captures')
        ctx.captures.should.be.instanceOf(Array)
        ctx.captures.should.have.property(0, '1')
        return next()
      }, (ctx) => {
        ctx.should.have.property('captures')
        ctx.captures.should.be.instanceOf(Array)
        ctx.captures.should.have.property(0, '1')
        ctx.status = 204
      })
      request(http.createServer(app.callback()))
        .get('/api/1')
        .expect(204)
        .end((err) => {
          if (err) return done(err)
          done()
        })
    })

    it('return original ctx.captures when decodeURIComponent throw error', (done) => {
      const app = new Koa()
      const router = new Router()
      app.use(router.routes())
      // eslint-disable-next-line no-useless-escape
      router.get(/^\/api\/([^\/]+)\/?/i, (ctx, next) => {
        ctx.should.have.property('captures')
        ctx.captures.should.be.type('object')
        ctx.captures.should.have.property(0, '101%')
        return next()
      }, (ctx) => {
        ctx.should.have.property('captures')
        ctx.captures.should.be.type('object')
        ctx.captures.should.have.property(0, '101%')
        ctx.status = 204
      })
      request(http.createServer(app.callback()))
        .get('/api/101%')
        .expect(204)
        .end((err) => {
          if (err) return done(err)
          done()
        })
    })

    it('populates ctx.captures with regexp captures include undefined', (done) => {
      const app = new Koa()
      const router = new Router()
      app.use(router.routes())
      router.get(/^\/api(\/.+)?/i, (ctx, next) => {
        ctx.should.have.property('captures')
        ctx.captures.should.be.type('object')
        ctx.captures.should.have.property(0, undefined)
        return next()
      }, (ctx) => {
        ctx.should.have.property('captures')
        ctx.captures.should.be.type('object')
        ctx.captures.should.have.property(0, undefined)
        ctx.status = 204
      })
      request(http.createServer(app.callback()))
        .get('/api')
        .expect(204)
        .end((err) => {
          if (err) return done(err)
          done()
        })
    })

    it('should throw friendly error message when handle not exists', () => {
      const app = new Koa()
      const router = new Router()
      app.use(router.routes())
      const notexistHandle = undefined
      ;(() => {
        router.get('/foo', notexistHandle)
      }).should.throw('get `/foo`: `middleware` must be a function, not `undefined`')

      ;(() => {
        router.get('foo router', '/foo', notexistHandle)
      }).should.throw('get `foo router`: `middleware` must be a function, not `undefined`')

      ;(() => {
        router.post('/foo', () => {}, notexistHandle)
      }).should.throw('post `/foo`: `middleware` must be a function, not `undefined`')
    })
  })

  describe('Layer#param()', () => {
    it('composes middleware for param fn', (done) => {
      const app = new Koa()
      const router = new Router()
      const route = new Layer('/users/:user', [ 'GET' ], [ (ctx) => {
        ctx.body = ctx.user
      } ])
      route.param('user', (id, ctx, next) => {
        ctx.user = { name: 'alex' }
        if (!id) {
          ctx.status = 404
          return
        }
        return next()
      })
      router.stack.push(route)
      app.use(router.middleware())
      request(http.createServer(app.callback()))
        .get('/users/3')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err)
          res.should.have.property('body')
          res.body.should.have.property('name', 'alex')
          done()
        })
    })

    it('ignores params which are not matched', (done) => {
      const app = new Koa()
      const router = new Router()
      const route = new Layer('/users/:user', [ 'GET' ], [ (ctx) => {
        ctx.body = ctx.user
      } ])
      route.param('user', (id, ctx, next) => {
        ctx.user = { name: 'alex' }
        if (!id) {
          ctx.status = 404
          return
        }
        return next()
      })
      route.param('title', (id, ctx, next) => {
        ctx.user = { name: 'mark' }
        if (!id) {
          ctx.status = 404
          return
        }
        return next()
      })
      router.stack.push(route)
      app.use(router.middleware())
      request(http.createServer(app.callback()))
        .get('/users/3')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err)
          res.should.have.property('body')
          res.body.should.have.property('name', 'alex')
          done()
        })
    })
  })

  describe('Layer#url()', () => {
    it('generates route URL', () => {
      const route = new Layer('/:category/:title', [ 'get' ], [ () => {} ], 'books')
      let url = route.url({ category: 'programming', title: 'how-to-node' })
      url.should.equal('/programming/how-to-node')
      url = route.url('programming', 'how-to-node')
      url.should.equal('/programming/how-to-node')
    })

    it('escapes using encodeURIComponent()', () => {
      const route = new Layer('/:category/:title', [ 'get' ], [ () => {} ], 'books')
      const url = route.url({ category: 'programming', title: 'how to node' })
      url.should.equal('/programming/how%20to%20node')
    })
  })
})
