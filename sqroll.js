const anchorRegExp = /^(?:(top|middle|bottom)|(top|middle|bottom)?([+-]\d+(?:px|vh))?)$/;
const sizeRegExp = /([+-]?\d+)(px|vh)/;

function parseUnit(size) {
  if (typeof size !== 'string') return size;

  const match = size.match(sizeRegExp);

  if (match) {
    return Number(match[1]) * (match[2] === 'vh' ? Math.round(window.innerHeight / 100) : 1);
  }

  return Number(size) || 0;
}

function getTargetScroll(elem, elemAnchor, viewportAnchor) {
  let elemY = Number(elemAnchor) || 0;
  let target = Number(viewportAnchor) || 0;

  if (typeof elemAnchor === 'string') {
    const match = elemAnchor.match(anchorRegExp);

    if (match) {
      const initialPosition = elem.getBoundingClientRect();
      const anchor = match[1] || match[2] || 'top';
      const offset = parseUnit(match[3] || 0);
      let top = initialPosition.top + window.scrollY;

      if (anchor === 'bottom') top += (initialPosition.bottom - initialPosition.top);
      else if (anchor === 'middle') top += (initialPosition.bottom - initialPosition.top) / 2;

      elemY = top + offset;
    }
  }

  if (typeof viewportAnchor === 'string') {
    const match = viewportAnchor.match(anchorRegExp);

    if (match) {
      const anchor = match[1] || match[2] || 'top';
      const offset = parseUnit(match[3] || 0);

      target = elemY;

      if (anchor === 'bottom') target -= window.innerHeight;
      else if (anchor === 'middle') target -= window.innerHeight / 2;

      target += offset;
    }
  }

  return target;
}

module.exports = function sqroll() {
  let callbacks = [];
  let lastScroll = -Infinity;

  function run() {
    const scroll = window.scrollY;
    const direction = scroll >= lastScroll ? 'down' : 'up';

    callbacks = callbacks.filter(cb => cb(scroll, direction));
    lastScroll = scroll;
  }

  return {
    track(elem, options) {
      const { start, end, callback } = options;
      const startAt = typeof start.at === 'number'
        ? start.at
        : getTargetScroll(elem, start.when, start.hits);
      const endAt = typeof end.at === 'number'
        ? end.at
        : getTargetScroll(elem, end.when, end.hits);
      const diff = endAt - startAt;
      let changing = false;

      callbacks.push((scroll, direction) => {
        const currentScroll = scroll - startAt;

        if (currentScroll < 0 || currentScroll > diff) {
          if (changing) {
            requestAnimationFrame(() => callback(
              elem,
              currentScroll < 0 ? start.value : end.value,
              scroll,
              direction,
            ));
          }

          return true;
        }

        const percent = currentScroll * 100 / diff;
        const value = end.value > start.value
          ? percent * end.value / 100 + start.value
          : (100 - percent) * start.value / 100 + end.value;

        changing = true;

        requestAnimationFrame(() => callback(elem, value, scroll, direction));

        return true;
      });
    },

    trigger(elem, options) {
      const { callback, when, hits, at } = options;
      const target = typeof at === 'number' ? at : getTargetScroll(elem, when, hits);
      const initialScroll = window.scrollY;

      callbacks.push((scroll, direction) => {
        const diff = scroll - target;

        if (initialScroll < target) {
          if (diff < 0) return true;
        }

        if (initialScroll > target) {
          if (diff > 0) return true;
        }

        requestAnimationFrame(() => callback(elem, scroll, direction));

        return false;
      });
    },

    viewport(elem, options) {
      const { onOut, onIn, offset } = options;
      const [offsetTopString, offsetBottomString] = (offset || '').split(/\s+/);
      const offsetTop = parseUnit(offsetTopString);
      const offsetBottom = offsetBottomString ? parseUnit(offsetBottomString) : offsetTop;
      let visible = false;

      callbacks.push((scroll, direction) => {
        const { top, bottom } = elem.getBoundingClientRect();

        if ((top + offsetTop) > window.innerHeight || (bottom - offsetBottom) < 0) {
          if (visible) {
            visible = false;
            requestAnimationFrame(() => onOut(elem, scroll, direction));
          }
        } else if (!visible) {
          visible = true;
          requestAnimationFrame(() => onIn(elem, scroll, direction));
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
  };
};
