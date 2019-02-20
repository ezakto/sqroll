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

This is the most basic method. It'll fire a callback function when the window has reached an element.

    sq.trigger(el, {
      at: number or string, default: 'top',
      callback: (el, currentScroll, direction) => {
        console.log('Click!');
      },
    });

If `at` is a number, the callback will fire as soon as the vewport has scrolled that amount of pixels.

If `at` is a string, the reference point will be set relative to the element:

* If `at` is `top`, `middle` or `bottom`, the callback will fire when the **top** of the viewport has reached the top, middle or bottom of the element.
* You can add an offset in px or vh like: 'top+100px', 'middle-50vh', 'bottom-100'.
* If only offset is defined, default reference point is `top`: '+50px', '-10vh'.

Callback is called with the element reference, the current amount of scroll and the direction the user scrolled ('up' or 'down').

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

Optionally, you can add an `offset` option with space-separated pair of offsets (top and bottom), like: `offset: '100px 200px`.

### sq.track(el, options)

This will change a value from a starting point to an ending point while the user scrolls.

    sq.track(el, {
      startAt: 'top-50vh',
      endAt: 'bottom',
      from: 1,
      to: 0,
      callback: (elem, value, scroll, direction) => {
        elem.style.opacity = value;
      },
    });

* `startAt` where should the callback start firing with updated values. In case of 'top-50vh', it means when the top of the element minus half of the viewport height reaches the top of the viewport.
* `endAt` where should the callback stop. In case of 'bottom', it means when the bottom of the element reaches the top of the viewport.
* `from` the starting value. In this example, `value` will be `1` until the viewport has scrolled to `startAt`, then it'll start changing.
* `to` the ending value. In this example `value` will increase with the scroll until the viewport scroll has reached `endAt`, that's when value will equal `to`.
* `callback` gets called only if `value` is updated.

### sq.start()

Start listening to scroll events and firing callbacks.

### sq.stop()

Stop listening to scroll events.

### sq.clear()

Remove all registered callbacks

### sq.destroy()

Stop listening and remove all callbacks.
