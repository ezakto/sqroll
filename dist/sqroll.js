(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define("sqroll", ["module"], factory);
  } else if (typeof exports !== "undefined") {
    factory(module);
  } else {
    var mod = {
      exports: {}
    };
    factory(mod);
    global.sqroll = mod.exports;
  }
})(this, function (module) {
  "use strict";

  function _slicedToArray(arr, i) {
    return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest();
  }

  function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance");
  }

  function _iterableToArrayLimit(arr, i) {
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"] != null) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  function _arrayWithHoles(arr) {
    if (Array.isArray(arr)) return arr;
  }

  module.exports = function sqroll() {
    var anchorRegExp = /^(?:(top|middle|bottom)|(top|middle|bottom)?([+-]\d+(?:px|vh))?)$/;
    var sizeRegExp = /([+-]?\d+)(px|vh)/;

    function parseSize(size) {
      if (typeof size !== 'string') return size;
      var match = size.match(sizeRegExp);

      if (match) {
        return Number(match[1]) * (match[2] === 'vh' ? Math.round(window.innerHeight / 100) : 1);
      }

      return Number(size) || 0;
    }

    function calculateRelativeString(elem) {
      var string = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'top';
      if (typeof string !== 'string') return string;
      var match = string.match(anchorRegExp);

      if (match) {
        var initialPosition = elem.getBoundingClientRect();
        var anchor = match[1] || match[2] || 'top';
        var offset = parseSize(match[3] || 0);
        var top = initialPosition.top + window.scrollY;
        if (anchor === 'bottom') top += initialPosition.bottom - initialPosition.top;else if (anchor === 'middle') top += (initialPosition.bottom - initialPosition.top) / 2;
        return top + offset;
      }

      return Number(string) || 0;
    }

    var callbacks = [];
    var lastScroll = -Infinity;
    var running = false;

    function run() {
      var scroll = window.scrollY;
      var direction = scroll >= lastScroll ? 'down' : 'up';

      if (!running) {
        running = true;
        requestAnimationFrame(function () {
          callbacks = callbacks.filter(function (cb) {
            return cb(scroll, direction);
          });
          running = false;
        });
      }

      lastScroll = scroll;
    }

    return {
      track: function track(elem, options) {
        var from = options.from,
            to = options.to,
            callback = options.callback;
        var startAt = calculateRelativeString(elem, options.startAt);
        var endAt = calculateRelativeString(elem, options.endAt);
        var diff = endAt - startAt;
        callbacks.push(function (scroll, direction) {
          var currentScroll = scroll - startAt;
          if (currentScroll < 0 || currentScroll > diff) return true;
          var percent = currentScroll * 100 / diff;
          var value = to > from ? percent * to / 100 + from : (100 - percent) * from / 100 + to;
          callback(elem, value, scroll, direction);
          return true;
        });
      },
      trigger: function trigger(elem, options) {
        var callback = options.callback;
        var at = calculateRelativeString(elem, options.at);
        callbacks.push(function (scroll, direction) {
          var currentScroll = scroll - at;
          if (currentScroll < 0) return true;
          callback(elem, scroll, direction);
          return false;
        });
      },
      viewport: function viewport(elem, options) {
        var onOut = options.onOut,
            onIn = options.onIn,
            offset = options.offset;

        var _split = (offset || '').split(/\s+/),
            _split2 = _slicedToArray(_split, 2),
            offsetTopString = _split2[0],
            offsetBottomString = _split2[1];

        var offsetTop = parseSize(offsetTopString);
        var offsetBottom = parseSize(offsetBottomString);
        var visible = false;
        callbacks.push(function (scroll, direction) {
          var _elem$getBoundingClie = elem.getBoundingClientRect(),
              top = _elem$getBoundingClie.top,
              bottom = _elem$getBoundingClie.bottom;

          if (top + offsetTop > window.innerHeight || bottom - offsetBottom < 0) {
            if (visible) {
              visible = false;
              onOut(elem, scroll, direction);
            }
          } else if (!visible) {
            visible = true;
            onIn(elem, scroll, direction);
          }

          return true;
        });
      },
      clear: function clear() {
        callbacks = [];
      },
      start: function start() {
        document.addEventListener('scroll', run);
        run();
      },
      stop: function stop() {
        document.removeEventListener('scroll', run);
      },
      destroy: function destroy() {
        callbacks = [];
        document.removeEventListener('scroll', run);
      }
    };
  };
});
