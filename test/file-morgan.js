process.env.NO_DEPRECATION = 'file-morgan'

var assert = require('assert')
var http = require('http')
var fileMorgan = require('..')
var request = require('supertest')
var path = require('path')
var fs = require('fs-extra')

describe('file-morgan()', function() {
	afterEach(function() {
		// TODO: clean files and log directory after every test
	})

	describe('arguments', function() {
		it('should use default format', function(done) {
			var cb = after(1, function(err, res, line) {
				if(err) {
					return done(err)
				}

				// Check if log file exists
				fs.access(path.join('logs', 'access.log'), fs.constants.F_OK, function(err) {
					if(err) {
						return done(err)
					}

					// Remove log directory and all files in it
					fs.remove(path.resolve('logs'), function (err) {
						if(err) {
							return done(err)
						}
					});
				})

				done()
			})

			// https://www.npmjs.com/package/supertest
			request(createServer('common', { skip: false, forceProductionMode: true }))
				.get('/')
				.expect(200, cb)
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