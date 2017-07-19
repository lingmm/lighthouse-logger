/**
 * @license Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var debug = require('debug');
var EventEmitter = require('events').EventEmitter;
var isWindows = process.platform === 'win32';

// process.browser is set when browserify'd via the `process` npm module
var isBrowser = process.browser;

var colors = {
  red: isBrowser ? 'crimson' : 1,
  yellow: isBrowser ? 'gold' : 3,
  cyan: isBrowser ? 'darkturquoise' : 6,
  green: isBrowser ? 'forestgreen' : 2,
  blue: isBrowser ? 'steelblue' : 4,
  magenta: isBrowser ? 'palevioletred' : 5
};

// whitelist non-red/yellow colors for debug()
debug.colors = [colors.cyan, colors.green, colors.blue, colors.magenta];

var Emitter = (function (_EventEmitter) {
  _inherits(Emitter, _EventEmitter);

  function Emitter() {
    _classCallCheck(this, Emitter);

    _get(Object.getPrototypeOf(Emitter.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(Emitter, [{
    key: 'issueStatus',

    /**
     * Fires off all status updates. Listen with
     * `require('lib/log').events.addListener('status', callback)`
     * @param {string} title
     * @param {!Array<*>} argsArray
     */
    value: function issueStatus(title, argsArray) {
      if (title === 'status' || title === 'statusEnd') {
        this.emit(title, [title].concat(_toConsumableArray(argsArray)));
      }
    }

    /**
     * Fires off all warnings. Listen with
     * `require('lib/log').events.addListener('warning', callback)`
     * @param {string} title
     * @param {!Array<*>} argsArray
     */
  }, {
    key: 'issueWarning',
    value: function issueWarning(title, argsArray) {
      this.emit('warning', [title].concat(_toConsumableArray(argsArray)));
    }
  }]);

  return Emitter;
})(EventEmitter);

var loggersByTitle = {};
var loggingBufferColumns = 25;

var Log = (function () {
  function Log() {
    _classCallCheck(this, Log);
  }

  _createClass(Log, null, [{
    key: '_logToStdErr',
    value: function _logToStdErr(title, argsArray) {
      var log = Log.loggerfn(title);
      log.apply(undefined, _toConsumableArray(argsArray));
    }
  }, {
    key: 'loggerfn',
    value: function loggerfn(title) {
      var log = loggersByTitle[title];
      if (!log) {
        log = debug(title);
        loggersByTitle[title] = log;
        // errors with red, warnings with yellow.
        if (title.endsWith('error')) {
          log.color = colors.red;
        } else if (title.endsWith('warn')) {
          log.color = colors.yellow;
        }
      }
      return log;
    }
  }, {
    key: 'setLevel',
    value: function setLevel(level) {
      switch (level) {
        case 'silent':
          debug.enable('-*');
          break;
        case 'verbose':
          debug.enable('*');
          break;
        case 'error':
          debug.enable('-*, *:error');
          break;
        default:
          debug.enable('*, -*:verbose');
      }
    }

    /**
     * A simple formatting utility for event logging.
     * @param {string} prefix
     * @param {!Object} data A JSON-serializable object of event data to log.
     * @param {string=} level Optional logging level. Defaults to 'log'.
     */
  }, {
    key: 'formatProtocol',
    value: function formatProtocol(prefix, data, level) {
      var columns = !process || process.browser ? Infinity : process.stdout.columns;
      var method = data.method || '?????';
      var maxLength = columns - method.length - prefix.length - loggingBufferColumns;
      // IO.read blacklisted here to avoid logging megabytes of trace data
      var snippet = data.params && method !== 'IO.read' ? JSON.stringify(data.params).substr(0, maxLength) : '';
      Log._logToStdErr(prefix + ':' + (level || ''), [method, snippet]);
    }
  }, {
    key: 'log',
    value: function log(title) {
      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      Log.events.issueStatus(title, args);
      return Log._logToStdErr(title, args);
    }
  }, {
    key: 'warn',
    value: function warn(title) {
      for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        args[_key2 - 1] = arguments[_key2];
      }

      Log.events.issueWarning(title, args);
      return Log._logToStdErr(title + ':warn', args);
    }
  }, {
    key: 'error',
    value: function error(title) {
      for (var _len3 = arguments.length, args = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
        args[_key3 - 1] = arguments[_key3];
      }

      return Log._logToStdErr(title + ':error', args);
    }
  }, {
    key: 'verbose',
    value: function verbose(title) {
      for (var _len4 = arguments.length, args = Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
        args[_key4 - 1] = arguments[_key4];
      }

      Log.events.issueStatus(title, args);
      return Log._logToStdErr(title + ':verbose', args);
    }

    /**
     * Add surrounding escape sequences to turn a string green when logged.
     * @param {string} str
     * @return {string}
     */
  }, {
    key: 'greenify',
    value: function greenify(str) {
      return '' + Log.green + str + Log.reset;
    }

    /**
     * Add surrounding escape sequences to turn a string red when logged.
     * @param {string} str
     * @return {string}
     */
  }, {
    key: 'redify',
    value: function redify(str) {
      return '' + Log.red + str + Log.reset;
    }
  }, {
    key: 'green',
    get: function get() {
      return '\x1B[32m';
    }
  }, {
    key: 'red',
    get: function get() {
      return '\x1B[31m';
    }
  }, {
    key: 'yellow',
    get: function get() {
      return '\x1b[33m';
    }
  }, {
    key: 'purple',
    get: function get() {
      return '\x1b[95m';
    }
  }, {
    key: 'reset',
    get: function get() {
      return '\x1B[0m';
    }
  }, {
    key: 'bold',
    get: function get() {
      return '\x1b[1m';
    }
  }, {
    key: 'dim',
    get: function get() {
      return '\x1b[2m';
    }
  }, {
    key: 'tick',
    get: function get() {
      return isWindows ? '√' : '✓';
    }
  }, {
    key: 'cross',
    get: function get() {
      return isWindows ? '×' : '✘';
    }
  }, {
    key: 'whiteSmallSquare',
    get: function get() {
      return isWindows ? '·' : '▫';
    }
  }, {
    key: 'heavyHorizontal',
    get: function get() {
      return isWindows ? '─' : '━';
    }
  }, {
    key: 'heavyVertical',
    get: function get() {
      return isWindows ? '│ ' : '┃ ';
    }
  }, {
    key: 'heavyUpAndRight',
    get: function get() {
      return isWindows ? '└' : '┗';
    }
  }, {
    key: 'heavyVerticalAndRight',
    get: function get() {
      return isWindows ? '├' : '┣';
    }
  }, {
    key: 'heavyDownAndHorizontal',
    get: function get() {
      return isWindows ? '┬' : '┳';
    }
  }, {
    key: 'doubleLightHorizontal',
    get: function get() {
      return '──';
    }
  }]);

  return Log;
})();

Log.events = new Emitter();

module.exports = Log;
