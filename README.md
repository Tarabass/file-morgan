file-morgan
============

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Dependencies][david-image]][david-url]
[![Build Status][travis-image]][travis-url]
[![Test Coverage][coveralls-image]][coveralls-url]
[![Join the chat at https://gitter.im/file-morgan/Lobby][gitter-image]][gitter-url]

This is build upon [morgan](https://github.com/expressjs/morgan) module and saves logs to the file system

## API

```js
var fileMorgan = require('file-morgan')
```

### fileMorgan(format, options)

Create a new file-morgan logger middleware function using the given `format` and `options`. The `format` (same as
[morgan](https://github.com/expressjs/morgan) module) argument may be a string of a predefined name (see
[morgan predefined name](https://github.com/expressjs/morgan#predefined-formats)) or a string of compiled format string (see
[morgan compile function](https://github.com/expressjs/morgan#morgancompileformat)).

```js
// BASIC EXAMPLE: save logs to a file named `access.log` placed in the `logs` directory
fileMorgan('common')
```

This will log all requests with error code 400 or higher to `logs/access.log`.

> This will only occur if `NODE_ENV` is set to `production` or `forceProductionMode` is set to true. Else all 
requests will be logged to the console ('dev' format).

#### Options

Options is the same as [morgan](https://github.com/expressjs/morgan) module. Just added the following properties:

* forceProductionMode
* useStreamRotator
* dateFormat
* fileName
* directory

The option `stream` is removed/overwriten.

##### forceProductionMode

Used for developers to force logging when your application is not running in production mode. Default is `false`

##### watchFiles

For performance watching files is optional. When watching files on changes an `change event` is emitted. Default is `false`

##### useStreamRotator

When set to true a new log file will be created on daily basis. The format of the file is `filename-date.log`, where the filename is default `access` 
and the date is formatted as `year-month-day (YYYYMMDD)`.

##### dateFormat

Will be used when `useStreamRotator` is set to true and will overwrite the default setting (`YYYYMMDD`).

##### fileName

Default is `access.log`.

##### directory

Default is `logs`

```js
// EXAMPLE: save logs to a file named 'errors-28022017.log'
fileMorgan('common', {
	useStreamRotator: true,
	dateFormat: 'DDMMYYYY',
	fileName: 'errors.log',
	directory: 'logfiles'
})
```

#### Events

For now file-morgan emits one event called `change`, as defined in `SUPPORTED_EVENTS`. To listen to events call `on(eventName, listener)` or `addListener(eventName, listener)`

##### change

The `change` event is emitted when a file has changed in the directory where logs are saved.

#### Methods

To listen to events there are two methods that can be used.

##### addListener(eventName, listener)

Alias for `on(eventName, listener)`.

##### on(eventName, listener)

Adds the listener function for the event named eventName. The listener callback gets two arguments (`path`, `stats`). `path` is the path of the file that has changed, and `stats` are
the stats (see [fs.stats](https://nodejs.org/api/fs.html#fs_class_fs_stats)) of the file that has changed.

```js
fileMorgan.on('change', function(path, stats) {
	console.log('File ' + path + ' changed size to ' + stats.size)
})
```

## To Do
- [X] Add eslint
- [X] Replace Object.assign with object-assign module
- [X] Add GitHub information to package.json
- [X] Add tests
- [X] Add code coverage
- [ ] Improve tests for default options
- [ ] Improve code coverage
- [X] Fire event when log file is changed
- [X] Add npm information
- [ ] Finish README.
- [X] Add travis

## License
[MIT](LICENSE)

[npm-image]: https://img.shields.io/npm/v/file-morgan.svg
[npm-url]: https://npmjs.org/package/file-morgan
[downloads-image]: https://img.shields.io/npm/dm/file-morgan.svg
[downloads-url]: https://npmjs.org/package/file-morgan
[david-image]: https://img.shields.io/david/strongloop/express.svg
[david-url]: https://david-dm.org/tarabass/file-morgan
[travis-image]: https://img.shields.io/travis/Tarabass/file-morgan.svg
[travis-url]: https://travis-ci.org/Tarabass/file-morgan
[coveralls-image]: https://img.shields.io/coveralls/Tarabass/file-morgan/master.svg
[coveralls-url]: https://coveralls.io/r/Tarabass/file-morgan?branch=master
[gitter-image]: https://badges.gitter.im/file-morgan/Lobby.svg
[gitter-url]: https://gitter.im/file-morgan/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge