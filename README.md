# sqroll
Sqroll is another scrolling library, with a simple api and a small overhead.

## Install

Download source or `npm install sqroll`.

Include script `dist/sqroll.min.js` as a script tag or include in source:

    const sqroll = require('scroll');

    import sqroll from 'scroll';

You might need to polyfill `requestAnimationFrame()`.

## API & Usage

Create an instance, add triggers and then start the listener:

    const sq = sqroll();
    
    // add triggers...
    
    sq.start();

### sq.trigger(el, options)

This is the most basic method. It'll fire a callback function when an element hits an edge or middle of the viewport.

    sq.trigger(el, {
      when: 'top', // of element
      hits: 'middle', // of viewport
      callback: (el, currentScroll, direction) => {
        console.log('Click!');
      },
    });

`when` can be `'top'`, `'middle'`, or `'bottom'`.
`hits` can also be `'top'`, `'middle'`, or `'bottom'`, or a number. If it's a number, the callback will fire when the edge/middle of the element has reached that amount of pixels.

* You can add an offset in px or vh like: 'top+100px', 'middle-50vh', 'bottom-100'.
* If only an offset is defined, default reference point is `top`: '+50px', '-10vh'.

Also, instead of `when` and `hits`, you can specify an absolute amount of scroll using `at`:

    sq.trigger(el, {
      at: 1000, // px
      callback: (el, currentScroll, direction) => {
        console.log('Click!');
      },
    });

Callback is called with the element reference, the current amount of scroll and the direction the user scrolled (`'up'` or `'down'`).

### sq.viewport(el, options)

This method will fire one callback every time the element enters the viewport, and one callback everytime it leaves the viewport.

    sq.viewport(el, {
      onIn: (el, currentScroll, direction) => {
        console.log('Visible');
      },
      onOut: (el, currentScroll, direction) => {
        console.log('Hidden');
      },
    });

Optionally, you can add an `offset` option with one, or a space-separated pair of offsets (top and bottom), like: `offset: '100px 200px`.

### sq.track(el, options)

This will change a value from a starting point to an ending point while the user scrolls.

    sq.track(el, {
      start: {
        when: 'top', // of element
        hits: 'bottom', // of viewport
        value: 0,
      },
      end: {
        when: 'top',
        hits: 'top',
        value: 1,
      },
      callback: (elem, value, scroll, direction) => {
        elem.style.opacity = value;
      },
    });

* `start` when should the callback start firing, and the initial value. In this example, when the top edge of the element is at the bottom of the viewport, the element opacity will be 0.
* `end` when should the callbacks stop, and the final value. In this example, when the top edge of the element is at the top of the viewport, the element opacity will be 1.
* `callback` gets called only if `value` is updated.

You can also use `at` property instead of `when` and `hits` to specify an absolute amount of scroll in one or both `start` and `end` objects:

    sq.track(el, {
      start: {
        at: 0, // px
        value: 0,
      },
      end: {
        when: 'top',
        hits: 'top',
        value: 1,
      },
      callback: (elem, value, scroll, direction) => {
        elem.style.opacity = value;
      },
    });

### sq.start()

Start listening to scroll events and firing callbacks.

### sq.stop()

Stop listening to scroll events.

### sq.clear()

Remove all registered callbacks

### sq.destroy()

Stop listening and remove all callbacks.
