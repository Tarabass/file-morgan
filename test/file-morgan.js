process.env.NO_DEPRECATION = 'file-morgan'

var assert = require('assert')
var http = require('http')
var fileMorgan = require('..')
var request = require('supertest')
var path = require('path')
var fs = require('fs-extra')

describe('file-morgan()', function() {
	afterEach(function() {
		// Remove log directory and all files in it
		fs.remove(path.resolve('logs'), function (err) {
			if(err) {
				if (err.code === "ENOENT") {
					return
				} else {
					throw err
				}
			}
		})
	})

	describe('arguments', function() {
		describe('format', function() {
			it('should be required', function () {
				assert.throws(fileMorgan, /format must be a string/)
			})

			it('should reject format as function', function () {
				assert.throws(fileMorgan.bind(fileMorgan, {}), /format must be a string/)
			})

			it('should use default format', function(done) {
				var cb = after(1, function(err, res, line) {
					if(err) {
						return done(err)
					}

					done()
				})

				// https://www.npmjs.com/package/supertest
				request(createServer('default', { skip: false, forceProductionMode: true }))
					.get('/')
					.expect(200, cb)
			})
		})

		describe('options.dateFormat', function() {
			it('should be a string', function () {
				assert.throws(fileMorgan.bind(fileMorgan, 'common', {
					useStreamRotator: true,
					dateFormat: new Date()
				}), /dateFormat must be a string/)
			})
		})
	})
})

function after(count, callback) {
	var args = new Array(3)
	var i = 0

	return function(err, arg1, arg2) {
		assert.ok(i++ < count, 'callback called ' + count + ' times')

		args[0] = args[0] || err
		args[1] = args[1] || arg1
		args[2] = args[2] || arg2

		if(count === i) {
			callback.apply(null, args)
		}
	}
}

function createServer(format, opts, fn, fn1) {
	var logger = fileMorgan(format, opts)
	var middle = fn || noopMiddleware

	return http.createServer(function onRequest(req, res) {
		// prior alterations
		if(fn1) {
			fn1(req, res)
		}

		logger(req, res, function onNext(err) {
			// allow req, res alterations
			middle(req, res, function onDone() {
				if(err) {
					res.statusCode = 500
					res.end(err.message)
				}

				res.setHeader('X-Sent', 'true')
				res.end((req.connection && req.connection.remoteAddress) || '-')
			})
		})
	})
}

function noopMiddleware(req, res, next) {
	next()
}