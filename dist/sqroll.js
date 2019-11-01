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
    if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) {
      return;
    }

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

  var anchorRegExp = /^(?:(top|middle|bottom)|(top|middle|bottom)?([+-]\d+(?:px|vh))?)$/;
  var sizeRegExp = /([+-]?\d+)(px|vh)/;

  function parseUnit(size) {
    if (typeof size !== 'string') return size;
    var match = size.match(sizeRegExp);

    if (match) {
      return Number(match[1]) * (match[2] === 'vh' ? Math.round(window.innerHeight / 100) : 1);
    }

    return Number(size) || 0;
  }

  function getTargetScroll(elem, elemAnchor, viewportAnchor) {
    var elemY = Number(elemAnchor) || 0;
    var target = Number(viewportAnchor) || 0;

    if (typeof elemAnchor === 'string') {
      var match = elemAnchor.match(anchorRegExp);

      if (match) {
        var initialPosition = elem.getBoundingClientRect();
        var anchor = match[1] || match[2] || 'top';
        var offset = parseUnit(match[3] || 0);
        var top = initialPosition.top + window.scrollY;
        if (anchor === 'bottom') top += initialPosition.bottom - initialPosition.top;else if (anchor === 'middle') top += (initialPosition.bottom - initialPosition.top) / 2;
        elemY = top + offset;
      }
    }

    if (typeof viewportAnchor === 'string') {
      var _match = viewportAnchor.match(anchorRegExp);

      if (_match) {
        var _anchor = _match[1] || _match[2] || 'top';

        var _offset = parseUnit(_match[3] || 0);

        target = elemY;
        if (_anchor === 'bottom') target -= window.innerHeight;else if (_anchor === 'middle') target -= window.innerHeight / 2;
        target += _offset;
      }
    }

    return target;
  }

  module.exports = function sqroll() {
    var callbacks = [];
    var lastScroll = -Infinity;

    function run() {
      var scroll = window.scrollY;
      var direction = scroll >= lastScroll ? 'down' : 'up';
      callbacks = callbacks.filter(function (cb) {
        return cb(scroll, direction);
      });
      lastScroll = scroll;
    }

    return {
      track: function track(elem, options) {
        var start = options.start,
            end = options.end,
            callback = options.callback;
        var startAt = typeof start.at === 'number' ? start.at : getTargetScroll(elem, start.when, start.hits);
        var endAt = typeof end.at === 'number' ? end.at : getTargetScroll(elem, end.when, end.hits);
        var diff = endAt - startAt;
        var changing = false;
        callbacks.push(function (scroll, direction) {
          var currentScroll = scroll - startAt;

          if (currentScroll < 0 || currentScroll > diff) {
            if (changing) {
              requestAnimationFrame(function () {
                return callback(elem, currentScroll < 0 ? start.value : end.value, scroll, direction);
              });
            }

            return true;
          }

          var percent = currentScroll * 100 / diff;
          var value = end.value > start.value ? percent * end.value / 100 + start.value : (100 - percent) * start.value / 100 + end.value;
          changing = true;
          requestAnimationFrame(function () {
            return callback(elem, value, scroll, direction);
          });
          return true;
        });
      },
      trigger: function trigger(elem, options) {
        var callback = options.callback,
            when = options.when,
            hits = options.hits,
            at = options.at;
        var target = typeof at === 'number' ? at : getTargetScroll(elem, when, hits);
        var initialScroll = window.scrollY;
        callbacks.push(function (scroll, direction) {
          var diff = scroll - target;

          if (initialScroll < target) {
            if (diff < 0) return true;
          }

          if (initialScroll > target) {
            if (diff > 0) return true;
          }

          requestAnimationFrame(function () {
            return callback(elem, scroll, direction);
          });
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

        var offsetTop = parseUnit(offsetTopString);
        var offsetBottom = offsetBottomString ? parseUnit(offsetBottomString) : offsetTop;
        var visible = false;
        callbacks.push(function (scroll, direction) {
          var _elem$getBoundingClie = elem.getBoundingClientRect(),
              top = _elem$getBoundingClie.top,
              bottom = _elem$getBoundingClie.bottom;

          if (top + offsetTop > window.innerHeight || bottom - offsetBottom < 0) {
            if (visible) {
              visible = false;
              requestAnimationFrame(function () {
                return onOut(elem, scroll, direction);
              });
            }
          } else if (!visible) {
            visible = true;
            requestAnimationFrame(function () {
              return onIn(elem, scroll, direction);
            });
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
