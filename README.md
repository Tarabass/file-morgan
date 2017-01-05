file-morgan
============
[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
<!--- [![Build Status][travis-image]][travis-url] -->

This is build upon [morgan](https://github.com/expressjs/morgan) module and saves logs to the file system

## API

```js
var fileMorgan = require('file-morgan')
```

### fileMorgan(format, options)

Create a new file-morgan logger middleware function using the given `format` and `options`.
The `format` (same as [morgan](https://github.com/expressjs/morgan) module) argument may be a string of a predefined name (see below for the names) or
a string of a format string.

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

## To Do
- [X] Add eslint
- [ ] Replace Object.assign with object-assign module
- [X] Add GitHub information to package.json
- [ ] Add tests
- [ ] Add npm information
- [ ] Finish README.

## License
[MIT](LICENSE)

[npm-image]: https://img.shields.io/npm/v/file-morgan.svg
[npm-url]: https://npmjs.org/package/file-morgan
[downloads-image]: https://img.shields.io/npm/dm/file-morgan.svg
[downloads-url]: https://npmjs.org/package/file-morgan
<!---[travis-image]: https://img.shields.io/travis/emech-en/mongo-morgan.svg?style=flat
[travis-url]: https://travis-ci.org/emech-en/mongo-morgan-->