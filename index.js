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
module.exports.on = module.exports.addListener = addListener
module.exports.compile = function(format) {
	return morgan.compile(format)
}
module.exports.token = function(name, fn) {
	return morgan.token.call(this, name, fn)
}
module.exports.format = function(name, fmt) {
	return morgan.format.call(this, name, fmt)
}

/**
 * Module dependencies.
 * @private
 */

var fs = require('fs')
var path = require('path')
var morgan = require('morgan')
var fileStreamRotator = require('file-stream-rotator')
var objectAssign = require('object-assign')
var chokidar = require('chokidar')
var events = require('events')

/**
 * Default log filename.
 * @private
 */

var DEFAULT_LOG_FILENAME = 'access.log'

/**
 * Default log directory.
 * @private
 */

var DEFAULT_LOG_DIRECTORY = 'logs'

/**
 * Force production mode used for testing.
 * @private
 */

var FORCE_PRODUCTION_MODE = false

/**
 * Watch files for changes.
 * @private
 */

var WATCH_FILES = false

/**
 * Use stream rotator.
 * @private
 */

var USE_STREAM_ROTATOR = false

/**
 * Date format used with file stream rotator.
 * @private
 */

var DATE_FORMAT = ('YYYYMMDD')

/**
 * Placeholder for EventEmitter.
 * @private
 */

var EVENT_EMITTER = new events.EventEmitter()

/**
 * Array of possible events.
 * @private
 */

var SUPPORTED_EVENTS = [
	'change'
]

/**
 * Create a logger middleware.
 *
 * @public
 * @param {String|Function} format
 * @param {Object} [options]
 * @return {Function} middleware
 */

function fileMorgan(format, options) {
	var opts = options || {},
		forceProductionMode = opts.forceProductionMode !== 'undefined' ? opts.forceProductionMode : FORCE_PRODUCTION_MODE,
		watchFiles = opts.watchFiles !== 'undefined' ? opts.watchFiles : WATCH_FILES,
		useStreamRotator = opts.useStreamRotator !== 'undefined' ? opts.useStreamRotator : USE_STREAM_ROTATOR,
		dateFormat = opts.dateFormat || DATE_FORMAT,
		fileName = opts.fileName || DEFAULT_LOG_FILENAME,
		directory = path.resolve(opts.directory || DEFAULT_LOG_DIRECTORY),
		filePath = path.join(directory, fileName),
		env = process.env.NODE_ENV || 'development',
		skip,
		stream

	if(typeof format !== 'string') {
		throw new TypeError('argument format must be a string')
	}

	if(useStreamRotator && typeof dateFormat !== 'string') {
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

			if(useStreamRotator === true) {
				filePath = formatFileName(filePath, '%DATE%')

				// Create a rotating write stream
				stream = fileStreamRotator.getStream({
					date_format: dateFormat,
					filename: filePath,
					frequency: 'daily',
					verbose: false
				})
			}
			else {
				// Create a write stream (in append mode)
				stream = fs.createWriteStream(filePath, {
					flags: 'a'
				})
			}

			// Create file watcher
			if(watchFiles === true) {
				addFileWatcher(useStreamRotator === true ? directory : filePath)
			}

			// Merge options
			opts = objectAssign(opts, {
				skip: skip,
				stream: stream
			})

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

/**
 * Create file watcher.
 *
 * @private
 * @param {String} file or directory
 */

function addFileWatcher(filePathOrDirectory) {
	var watcher = chokidar.watch(filePathOrDirectory, {
		alwaysStat: true
	})

	watcher.on('change', function(path, stats) {
		if (stats) {
			EVENT_EMITTER.emit('change', path, stats)
		}
	})
}

/**
 * Wrapper for EventEmitter.on function.
 *
 * @public
 * @param {String} type
 * @param {Function} listener
 */

function addListener(event, listener) {
	if(SUPPORTED_EVENTS.indexOf(event) !== -1) {
		try {
			EVENT_EMITTER.on(event, listener)
		}
		catch(err) {
			throw err
		}
	}
	else {
		throw new Error('Unsupported event.')
	}
}