module.exports = function sqroll() {
  const anchorRegExp = /^(?:(top|middle|bottom)|(top|middle|bottom)?([+-]\d+(?:px|vh))?)$/;
  const sizeRegExp = /([+-]?\d+)(px|vh)/;

  function parseSize(size) {
    if (typeof size !== 'string') return size;

    const match = size.match(sizeRegExp);

    if (match) {
      return Number(match[1]) * (match[2] === 'vh' ? Math.round(window.innerHeight / 100) : 1);
    }

    return Number(size) || 0;
  }

  function calculateRelativeString(elem, string = 'top') {
    if (typeof string !== 'string') return string;

    const match = string.match(anchorRegExp);

    if (match) {
      const initialPosition = elem.getBoundingClientRect();
      const anchor = match[1] || match[2] || 'top';
      const offset = parseSize(match[3] || 0);
      let top = initialPosition.top + window.scrollY;

      if (anchor === 'bottom') top += (initialPosition.bottom - initialPosition.top);
      else if (anchor === 'middle') top += (initialPosition.bottom - initialPosition.top) / 2;

      return top + offset;
    }

    return Number(string) || 0;
  }

  let callbacks = [];
  let lastScroll = -Infinity;
  let running = false;

  function run() {
    const scroll = window.scrollY;
    const direction = scroll >= lastScroll ? 'down' : 'up';

    if (!running) {
      running = true;
      requestAnimationFrame(() => {
        callbacks = callbacks.filter(cb => cb(scroll, direction));
        running = false;
      });
    }

    lastScroll = scroll;
  }

  return {
    track(elem, options) {
      const { from, to, callback } = options;
      const startAt = calculateRelativeString(elem, options.startAt);
      const endAt = calculateRelativeString(elem, options.endAt);

      const diff = endAt - startAt;

      callbacks.push((scroll, direction) => {
        const currentScroll = scroll - startAt;

        if (currentScroll < 0 || currentScroll > diff) return true;

        const percent = currentScroll * 100 / diff;
        const value = to > from ? percent * to / 100 + from : (100 - percent) * from / 100 + to;

        callback(elem, value, scroll, direction);

        return true;
      });
    },

    trigger(elem, options) {
      const { callback } = options;
      const at = calculateRelativeString(elem, options.at);

      callbacks.push((scroll, direction) => {
        const currentScroll = scroll - at;

        if (currentScroll < 0) return true;

        callback(elem, scroll, direction);

        return false;
      });
    },

    viewport(elem, options) {
      const { onOut, onIn, offset } = options;
      const [offsetTopString, offsetBottomString] = (offset || '').split(/\s+/);
      const offsetTop = parseSize(offsetTopString);
      const offsetBottom = parseSize(offsetBottomString);
      let visible = false;

      callbacks.push((scroll, direction) => {
        const { top, bottom } = elem.getBoundingClientRect();

        if ((top + offsetTop) > window.innerHeight || (bottom - offsetBottom) < 0) {
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

    clear() {
      callbacks = [];
    },

    start() {
      document.addEventListener('scroll', run);
      run();
    },

    stop() {
      document.removeEventListener('scroll', run);
    },

    destroy() {
      callbacks = [];
      document.removeEventListener('scroll', run);
    },
  }
}
