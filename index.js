/*!
 * file-morgan
 * Copyright(c) 2017 Peter Rietveld
 * MIT Licensed
 */

'use strict'

/**
 * Module exports.
 * @public
 */

module.exports = fileMorgan
module.exports.compile = function(format) {
	return morgan.compile(format)
}
module.exports.token = function(name, fn) {
	return morgan.token(name, fn)
}
module.exports.format = function(name, fmt) {
	return morgan.format(name, fmt)
}

/**
 * Module dependencies.
 * @private
 */

var fs = require('fs')
var path = require('path')
var morgan = require('morgan')
var fileStreamRotator = require('file-stream-rotator')

/**
 * Default log file.
 * @private
 */

var DEFAULT_LOG_FILE = 'access.log'

/**
 * Default log directory.
 * @private
 */

var DEFAULT_LOG_DIRECTORY = 'logs'

/**
 * Force production mode used for testing
 * @private
 */

var FORCE_PRODUCTION_MODE = false

/**
 * Use stream rotator.
 * @private
 */

var USE_STREAM_ROTATOR = false

/**
 * Date format used with file stream rotator
 * @private
 */

var DATE_FORMAT = ('YYYYMMDD')

/**
 * Create a logger middleware
 *
 * @public
 * @param {String|Function} format
 * @param {Object} [options]
 * @return {Function} middleware
 */

function fileMorgan(format, options) {
	var opts = options || {},
		forceProductionMode = opts.forceProductionMode !== 'undefined' ? opts.forceProductionMode : FORCE_PRODUCTION_MODE,
		useStreamRotator = opts.useStreamRotator !== 'undefined' ? opts.useStreamRotator : USE_STREAM_ROTATOR,
		dateFormat = opts.dateFormat || DATE_FORMAT,
		fileName = opts.file || DEFAULT_LOG_FILE,
		directory = path.resolve(opts.directory || DEFAULT_LOG_DIRECTORY),
		filePath = path.join(directory, fileName),
		env = process.env.NODE_ENV || 'development',
		skip,
		stream

	if(typeof dateFormat !== 'string') {
		throw new TypeError('option dateFormat must be a string')
	}

	if(env === 'production' || forceProductionMode) {
		try {
			// Ensure log directory exists
			fs.existsSync(directory) || fs.mkdirSync(directory)

			// Default skip to requests with error code 400 or higher
			skip = typeof opts.skip !== 'undefined' ? opts.skip : function(req, res) {
					return res.statusCode < 400
				}

			if(useStreamRotator) {
				// Create a rotating write stream
				stream = fileStreamRotator.getStream({
					date_format: dateFormat,
					filename: formatFileName(filePath, '%DATE%'),
					frequency: 'daily',
					verbose: false
				})
			}
			else {
				// Create a write stream (in append mode)
				stream = fs.createWriteStream(filePath, { flags: 'a' })
			}

			// Merge options
			opts = Object.assign(opts, { skip: skip, stream: stream })

			return morgan(format, opts)
		}
		catch(err) {
			throw err
		}
	}
	else/* if(env === 'dev' || env === 'development' || !env) */{
		return morgan('dev')
	}
}

/**
 * Format file name.
 *
 * @private
 * @param {String} fileName
 * @param {String} dateFormat
 * @return {String}
 */

function formatFileName(filePath, dateFormat) {
	var parsedFilePath = path.parse(filePath),
		dir = parsedFilePath.dir,
		name = parsedFilePath.name,
		ext = parsedFilePath.ext,
		fileName = name + '-' + dateFormat + ext

	return path.join(dir, fileName)
}