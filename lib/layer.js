/* eslint-disable max-lines, array-callback-return */

const pathToRegExp = require('path-to-regexp')
const Uri = require('urijs')

/**
 * Safe decodeURIComponent, won't throw any error.
 * If `decodeURIComponent` error happen, just return the original value.
 *
 * @param {String} text
 * @returns {String} URL decode original string.
 * @private
 */

const safeDecodeURIComponent = (text) => {
  try {
    return decodeURIComponent(text)
  } catch (e) {
    return text
  }
}

module.exports = class Layer {
  /**
   * Initialize a new routing Layer with given `method`, `path`, and `middleware`.
   *
   * @param {String|RegExp} path Path string or regular expression.
   * @param {Array} methods Array of HTTP verbs.
   * @param {Array} middleware Layer callback/middleware or series of.
   * @param {Object=} opts
   * @param {String=} opts.name route name
   * @param {String=} opts.sensitive case sensitive (default: false)
   * @param {String=} opts.strict require the trailing slash (default: false)
   * @returns {Layer}
   * @private
   */
  constructor (path, methods, middleware, opts = {}) {
    this.opts = opts
    this.name = this.opts.name || null
    this.methods = []
    this.paramNames = []
    this.stack = Array.isArray(middleware) ? middleware : [ middleware ]

    methods.forEach(function (method) {
      const l = this.methods.push(method.toUpperCase())
      if (this.methods[l - 1] === 'GET') {
        this.methods.unshift('HEAD')
      }
    }, this)

    // ensure middleware is a function
    this.stack.forEach(function (fn) {
      const type = typeof fn
      if (type !== 'function') {
        throw new Error(
          methods.toString() +
          ' `' +
          (this.opts.name || path) +
          '`: `middleware` ' +
          'must be a function, not `' +
          type +
          '`'
        )
      }
    }, this)

    this.path = path
    this.plainPath = path instanceof RegExp
      ? path.source
      : path.replace(/\(\.\*\)/g, '')

    this.regexp = pathToRegExp(path, this.paramNames, this.opts)
    this.regexp = new RegExp(this.regexp.source, 'gi')
  }

  /**
   * Returns the length of given `path` that matches route, or -1 if no match.
   *
   * @param {String} path
   * @returns {number}
   * @private
   */
  matchLength (path) {
    const result = this.regexp.test(path)
    const lastIndex = this.regexp.lastIndex
    this.regexp.lastIndex = 0
    return result ? lastIndex : -1
  }

  /**
   * Returns map of URL parameters for given `path` and `paramNames`.
   *
   * @param {String} path
   * @param {Array.<String>} captures
   * @param {Object=} existingParams
   * @returns {Object}
   * @private
   */
  params (path, captures, existingParams) {
    const params = existingParams || {}

    for (let len = captures.length, i = 0; i < len; i++) {
      if (this.paramNames[i]) {
        const c = captures[i]
        params[this.paramNames[i].name] = c ? safeDecodeURIComponent(c) : c
      }
    }

    return params
  }

  /**
   * Returns array of regexp url path captures.
   *
   * @param {String} path
   * @returns {Array.<String>}
   * @private
   */
  captures (path) {
    if (this.opts.ignoreCaptures) return []
    const result = this.regexp.exec(path).slice(1)
    this.regexp.lastIndex = 0
    return result
  }

  /**
   * Generate URL for route using given `params`.
   *
   * @example
   *
   * ```javascript
   * const route = new Layer(['GET'], '/users/:id', fn)
   *
   * route.url({ id: 123 }); // => "/users/123"
   * ```
   *
   * @param {Object} params url parameters
   * @returns {String}
   * @private
   */
  url (params, options) {
    const toPath = pathToRegExp.compile(this.plainPath)

    let args = params

    if (typeof params !== 'object') {
      args = Array.prototype.slice.call(arguments)
      if (typeof args[args.length - 1] === 'object') {
        options = args[args.length - 1]
        args = args.slice(0, args.length - 1)
      }
    }

    const tokens = pathToRegExp.parse(this.plainPath)

    let replace = {}

    if (Array.isArray(args)) {
      for (let len = tokens.length, i = 0, j = 0; i < len; i++) {
        if (tokens[i].name) replace[tokens[i].name] = args[j++]
      }
    } else if (tokens.some((token) => token.name)) {
      replace = params
    } else {
      options = params
    }

    let replaced = toPath(replace)

    if (options && options.query) {
      replaced = new Uri(replaced)
      replaced.search(options.query)
      return replaced.toString()
    }

    return replaced
  }

  /**
   * Run validations on route named parameters.
   *
   * @example
   *
   * ```javascript
   * router
   *   .param('user', (id, ctx, next) => {
   *     ctx.user = users[id]
   *     if (!user) return ctx.status = 404
   *     next()
   *   })
   *   .get('/users/:user', (ctx, next) => {
   *     ctx.body = ctx.user
   *   })
   * ```
   *
   * @param {String} param
   * @param {Function} middleware
   * @returns {Layer}
   * @private
   */
  param (param, fn) {
    const stack = this.stack
    const params = this.paramNames
    const middleware = function (ctx, next) {
      return fn.call(this, ctx.params[param], ctx, next)
    }
    middleware.param = param

    const names = params.map((p) => p.name)

    const x = names.indexOf(param)
    if (x > -1) {
      // iterate through the stack, to figure out where to place the handler fn
      stack.some((fn, i) => {
        // param handlers are always first, so when we find an fn w/o a param property, stop here
        // if the param handler at this part of the stack comes after the one we are adding, stop here
        if (!fn.param || names.indexOf(fn.param) > x) {
          // inject this param handler right before the current item
          stack.splice(i, 0, middleware)
          return true // then break the loop
        }
      })
    }

    return this
  }

  /**
   * Prefix route path.
   *
   * @param {String} prefix
   * @returns {Layer}
   * @private
   */
  setPrefix (prefix) {
    if (this.path) {
      this.path = prefix + this.path
      this.plainPath = this.path.replace(/\(\.\*\)/g, '')
      this.paramNames = []
      this.regexp = pathToRegExp(this.path, this.paramNames, this.opts)
      this.regexp = new RegExp(this.regexp.source, 'gi')
    }

    return this
  }
}
