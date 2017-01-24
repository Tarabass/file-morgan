'use strict'

process.env.NO_DEPRECATION = 'file-morgan'

var assert = require('assert')
var sinon = require('sinon')
var http = require('http')
var morgan = require('morgan')
var fileMorgan = require('..')
var supertest = require('supertest')
var path = require('path')
var fs = require('fs-extra')

afterEach(function() {
	// Remove log directory and all files in it
	fs.remove(path.resolve('logs'), function(err) {
		if(err && err.code !== 'ENOENT') {
			throw err
		}
	})
})

// TODO: let morgan fail and let file-morgan throw error from try - catch
describe('file-morgan()', function() {
	describe('arguments', function() {
		describe('format', function() {
			it('should accept string', function() {
				assert.doesNotThrow(fileMorgan.bind(fileMorgan, 'combined'), TypeError)
			})

			it('should be required', function() {
				assert.throws(fileMorgan, /format must be a string/)
			})

			it('should reject objects', function() {
				assert.throws(fileMorgan.bind(fileMorgan, {}), /format must be a string/)
			})

			it('should reject functions', function() {
				var noopFunction = function() {
					return true
				}

				assert.throws(fileMorgan.bind(fileMorgan, noopFunction), /format must be a string/)
			})

			it('should reject numbers', function() {
				assert.throws(fileMorgan.bind(fileMorgan, 42), /format must be a string/)
			})
		})

		// TODO: write test for all options (watchfiles, useStreamRotator)
		// TODO: call fileMorgan with no options should use default settings
		describe('options', function() {
			it('should not be required', function() {
				assert.doesNotThrow(fileMorgan.bind(fileMorgan, 'combine'), Error)
			})

			it('should return morgan with dev format', function() {
				var returnValue = fileMorgan('combined'),
					morganDev = morgan('dev')

				assert.ok(typeof returnValue === 'function', 'fileMorgan should return a function')
				assert.ok(returnValue.name === 'logger')
				assert.ok(returnValue.length === 3)

				assert.equal(typeof returnValue, typeof morganDev)
				assert.equal(returnValue.name, morganDev.name)
				assert.equal(returnValue.length, morganDev.length)
			})

			describe('dateFormat', function() {
				it('should accept string', function() {
					assert.doesNotThrow(fileMorgan.bind(fileMorgan, 'combine', {
						useStreamRotator: true,
						dateFormat: 'DDMMYYYY'
					}), TypeError)
				})

				it('should reject dates', function() {
					assert.throws(fileMorgan.bind(fileMorgan, 'common', {
						useStreamRotator: true,
						dateFormat: new Date()
					}), /dateFormat must be a string/)
				})

				it('should reject objects', function() {
					assert.throws(fileMorgan.bind(fileMorgan, 'common', {
						useStreamRotator: true,
						dateFormat: {}
					}), /dateFormat must be a string/)
				})

				it('should reject functions', function() {
					var noopFunction = function() {
						return true
					}

					assert.throws(fileMorgan.bind(fileMorgan, 'common', {
						useStreamRotator: true,
						dateFormat: noopFunction
					}), /dateFormat must be a string/)
				})

				it('should reject numbers', function() {
					assert.throws(fileMorgan.bind(fileMorgan, 'common', {
						useStreamRotator: true,
						dateFormat: 42
					}), /dateFormat must be a string/)
				})
			})

			describe('skip', function() {
				it('should accept boolean', function() {
					assert.doesNotThrow(fileMorgan.bind(fileMorgan, 'combined', {
						forceProductionMode: true,
						skip: false
					}), TypeError)
				})

				it('should accept function', function() {
					assert.doesNotThrow(fileMorgan.bind(fileMorgan, 'combined', {
						forceProductionMode: true,
						skip: function(req, res) {
							return res.statusCode < 400
						}
					}), TypeError)
				})

				it('should reject object', function() {
					assert.throws(fileMorgan('common', {
						forceProductionMode: true,
						skip: {
							a: 'a'
						}
					}), TypeError)
				})

				it('should reject numbers', function() {
					assert.throws(fileMorgan('common', {
						forceProductionMode: true,
						skip: 42
					}), TypeError)
				})
			})

			it('should accept custom directory and fileName', function(done) {
				var directory = 'dirtoexist',
					fileName = 'filetoexist.log',
					cb = after(1, function(err) {
						if(err) {
							return done(err)
						}

						return done()
					})

				process.nextTick(function() {
					fs.access(path.join(directory, fileName), function(fsError) {
						if(fsError) {
							throw fsError
						}
					})
				})

				process.nextTick(function() {
					fs.remove(path.join(directory), function(rmError) {
						if(rmError) {
							throw rmError
						}
					})
				})

				supertest(createServer('combined', {
					skip: false,
					forceProductionMode: true,
					directory: directory,
					fileName: fileName
				}))
					.get('/')
					.expect(200, cb)
			})
		})
	})

	describe('formatFileName', function() {
		it('should format file name correctly', function() {
			var formattedDate = getFormattedDate()

			fileMorgan('combined', {
				forceProductionMode: true,
				dateFormat: 'DDMMYYYY',
				useStreamRotator: true
			})

			process.nextTick(function() {
				fs.access(path.join('logs', 'access-' + formattedDate + '.log'), function(err) {
					assert.equal(err, null)
				})
			})
		})
	})
})

describe('file-morgan.addListener', function() {
	it('should listen to change event', function(done) {
		var cb = after(1, function(err/*, res, line*/) {
			if(err) {
				return done(err)
			}

			process.nextTick(function() {
				assert(spy.called)
			})

			return done()
		})

		var spy = sinon.spy(function(path, stats) {
			return path && stats
		})

		fileMorgan.addListener.bind(fileMorgan, 'change', spy)

		supertest(createServer('combined', {
			forceProductionMode: true,
			watchFiles: true,
			fileName: 'change_event.log'
		}, function(req, res) {
			res.statusCode = 404
			res.end()
		}))
			.get('/unknown_route')
			.expect(404, cb)
	})

	it('should except on as alias for addListener', function() {
		assert.equal(fileMorgan.on, fileMorgan.addListener)
	})

	describe('arguments', function() {
		it('should except change event', function() {
			assert.doesNotThrow(fileMorgan.addListener.bind(fileMorgan, 'change', function(path, stats) {
				return path && stats
			}), /Unsupported event/)
		})

		it('should reject finished event', function() {
			assert.throws(fileMorgan.addListener.bind(fileMorgan, 'finished', function(path, stats) {
				return path && stats
			}), /Unsupported event/)
		})

		it('listener should be required', function() {
			assert.throws(fileMorgan.addListener.bind(fileMorgan, 'change'), Error)
		})
	})
})

describe('file-morgan.token(name, fn)', function() {
	it('should call morgan.token(name, fn)', function() {
		var noopFunction = function() {
			return true
		}

		sinon.spy(morgan, 'token')

		fileMorgan.token('remote-addr', noopFunction)
		assert.ok(morgan.token.calledOnce, 'morgan.token not called')
	})

	it('should return a fileMorgan object', function() {
		var returnValue,
			noopFunction = function() {
				return true
			}

		returnValue = fileMorgan.token('remote-addr', noopFunction)
		assert.deepEqual(returnValue, fileMorgan, 'fileMorgan.token should return fileMorgan')
	})

	describe('arguments', function() {
		describe('name', function() {
			it('should accept string', function() {
				assert.doesNotThrow(fileMorgan.token.bind(fileMorgan, 'originalurl', function(req) {
					return req.originalUrl
				}), TypeError)
			})

			it('should be required', function() {
				assert.throws(fileMorgan.token, /name must be a string/)
			})

			it('should reject objects', function() {
				assert.throws(fileMorgan.token.bind(fileMorgan, {}), /name must be a string/)
			})

			it('should reject functions', function() {
				var noopFunction = function() {
					return true
				}

				assert.throws(fileMorgan.token.bind(fileMorgan, noopFunction), /name must be a string/)
			})

			it('should reject numbers', function() {
				assert.throws(fileMorgan.token.bind(fileMorgan, 42), /name must be a string/)
			})
		})

		describe('fn', function() {
			it('should accept function', function() {
				assert.doesNotThrow(fileMorgan.token.bind(fileMorgan, 'originalurl', function(req) {
					return req.originalUrl
				}), TypeError)
			})

			it('should be required', function() {
				assert.throws(fileMorgan.token.bind(fileMorgan, 'originalurl'), /fn must be a function/)
			})

			it('should reject objects', function() {
				assert.throws(fileMorgan.token.bind(fileMorgan, 'originalurl', {}), /fn must be a function/)
			})

			it('should reject boolean', function() {
				assert.throws(fileMorgan.token.bind(fileMorgan, 'originalurl', true), /fn must be a function/)
			})

			it('should reject numbers', function() {
				assert.throws(fileMorgan.token.bind(fileMorgan, 'originalurl', 42), /fn must be a function/)
			})
		})
	})
})

describe('file-morgan.format(name, fmt)', function() {
	it('should call morgan.format(name, fmt)', function() {
		sinon.spy(morgan, 'format')

		fileMorgan.format('tiny', ':method :url :status :res[content-length] - :response-time ms')
		assert.ok(morgan.format.calledOnce, 'morgan.format not called')
	})

	it('should return a fileMorgan object', function() {
		var returnValue

		returnValue = fileMorgan.format('tiny', ':method :url :status :res[content-length] - :response-time ms')
		assert.deepEqual(returnValue, fileMorgan, 'fileMorgan.format should return fileMorgan')
	})

	describe('arguments', function() {
		describe('name', function() {
			it('should accept string', function() {
				assert.doesNotThrow(fileMorgan.format.bind(fileMorgan, 'tiny', ':method :url :status :res[content-length] - :response-time ms'), TypeError)
			})

			it('should be required', function() {
				assert.throws(fileMorgan.format, /name must be a string/)
			})

			it('should reject objects', function() {
				assert.throws(fileMorgan.format.bind(fileMorgan, {}), /name must be a string/)
			})

			it('should reject functions', function() {
				var noopFunction = function() {
					return true
				}

				assert.throws(fileMorgan.format.bind(fileMorgan, noopFunction), /name must be a string/)
			})

			it('should reject numbers', function() {
				assert.throws(fileMorgan.format.bind(fileMorgan, 42), /name must be a string/)
			})
		})

		describe('fmt', function() {
			it('should accept string', function() {
				assert.doesNotThrow(fileMorgan.format.bind(fileMorgan, 'tiny', ':method :url :status :res[content-length] - :response-time ms'), TypeError)
			})

			it('should accept function', function() {
				var noopFunction = function() {
					return true
				}

				assert.doesNotThrow(fileMorgan.format.bind(fileMorgan, 'tiny', noopFunction), TypeError)
			})

			it('should be required', function() {
				assert.throws(fileMorgan.format.bind(fileMorgan, 'tiny'), /fmt must be a string or a function/)
			})

			it('should reject objects', function() {
				assert.throws(fileMorgan.format.bind(fileMorgan, 'tiny', {}), /fmt must be a string or a function/)
			})

			it('should reject boolean', function() {
				assert.throws(fileMorgan.format.bind(fileMorgan, 'tiny', true), /fmt must be a string or a function/)
			})

			it('should reject numbers', function() {
				assert.throws(fileMorgan.format.bind(fileMorgan, 'tiny', 42), /fmt must be a string or a function/)
			})
		})
	})
})

describe('file-morgan.compile(format)', function() {
	it('should call morgan.compile(format)', function() {
		sinon.spy(morgan, 'compile')

		fileMorgan.compile('combine')
		assert.ok(morgan.compile.calledOnce, 'morgan.compile not called')
	})

	it('should return a function', function() {
		var returnValue = fileMorgan.compile(':method')

		assert.ok(typeof returnValue === 'function', 'fileMorgan.compile should return a function')
		assert.ok(returnValue.length === 3)
	})

	describe('arguments', function() {
		describe('format', function() {
			it('should be required', function() {
				assert.throws(fileMorgan.compile.bind(fileMorgan), /argument format/)
			})

			it('should reject functions', function() {
				var noopFunction = function() {
					return true
				}

				assert.throws(fileMorgan.compile.bind(fileMorgan, noopFunction), /argument format/)
			})

			it('should reject numbers', function() {
				assert.throws(fileMorgan.compile.bind(fileMorgan, 42), /argument format/)
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
	var logger = fileMorgan(format, opts),
		middle = fn || noopMiddleware

	return http.createServer(function(req, res) {
		// prior alterations
		if(fn1) {
			fn1(req, res)
		}

		logger(req, res, function(err) {
			// allow req, res alterations
			middle(req, res, function() {
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

function getFormattedDate() {
	var today = new Date(),
		dd = today.getDate(),
		mm = today.getMonth() + 1,
		yyyy = today.getFullYear()

	if(dd < 10) {
		dd = '0' + dd
	}

	if(mm < 10) {
		mm = '0' + mm
	}

	return dd + mm + yyyy
}