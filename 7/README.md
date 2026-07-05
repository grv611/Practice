# Task Manager — DOM Explorer

A task manager built with plain HTML, CSS and JavaScript — no frameworks,
no libraries. It exists to make browser internals visible: how HTML and
CSS become pixels, how attributes differ from properties, and how events
travel through the DOM.

## Running it

Open `index.html` in a browser. That's it — there's no build step.


## Features

- Add, edit, complete, and delete tasks — no page reloads.
- Search by title and filter by category.
- Pending / completed counters, and a clear-all button.
- Dark mode / light mode, saved between visits.
- Two live demos: attributes vs. properties, and event propagation.
- Tasks persist in `localStorage`.

## Concepts, explained

### Parsing
When the browser receives an HTML file, it can't use raw bytes directly.
Parsing is the process of reading that byte stream and turning it into
something structured the browser can act on — the first step toward a
DOM tree.

### Tokenization
Before the parser can build a tree, it breaks the character stream into
tokens: a start tag, an attribute name, an attribute value, a text run,
an end tag. The tokenizer hands these tokens to the parser one at a
time, and the parser decides what to do with each one.

### DOM Tree
The Document Object Model is the tree of nodes built from those tokens —
`<html>` containing `<body>` containing `<ul id="task-list">` containing
`<li>` elements, and so on. Crucially, it's not static: it's a live
object graph. Every `document.createElement`, `appendChild`, and
`remove()` call in `script.js` is mutating this tree directly, which is
why the page updates instantly without a reload.

### CSSOM Tree
CSS goes through its own parse-and-tokenize pass, producing the CSS
Object Model: every rule, selector, and declaration, with cascade and
specificity already resolved into a tree that mirrors the stylesheet's
structure.

### Render Tree
The browser combines the DOM tree and the CSSOM tree into a render
tree — only the nodes that are actually visible (no `display: none`
elements, no `<head>` contents), each one paired with its final,
computed style. From there the browser calculates layout (where
everything sits) and paints pixels to the screen.

### Attributes vs. Properties
An **attribute** is what's written in the HTML markup — a string, fixed
at parse time unless you explicitly change it. A **property** is the
live value on the DOM object right now, which can drift from the
attribute the moment a user interacts with the page.

The demo on the page makes this concrete: type into the input, then
compare `input.value` against `input.getAttribute("value")`. The
property reflects your typing; the attribute doesn't move until
something calls `setAttribute` on it.

### Event Bubbling
When you click an element nested inside others, the click doesn't just
fire once. After the target's own listeners run, the event "bubbles"
back up through every ancestor — child, then parent, then grandparent —
giving each one a chance to react. Bubbling is the default phase for
`addEventListener`.

### Event Capturing
Capturing is the mirror image, and it happens *first*: before the click
reaches its actual target, it travels down from the outermost ancestor
inward — grandparent, then parent, then child. You opt into this phase
by passing `{ capture: true }` to `addEventListener`.

The propagation demo on the page attaches both a bubbling and a
capturing listener to all three nested boxes, so one click reveals the
full order: capture phase top-down, then bubble phase bottom-up.

### Event Delegation
Rather than attaching a click listener to every task card individually,
one listener sits on the `<ul id="task-list">` container. When any
button inside any card is clicked, the event bubbles up to that single
listener, which checks `event.target` to figure out what was actually
clicked and which task it belongs to. This means task cards added long
after the page loaded still work, with no extra listeners to manage.

## Project structure

```
index.html    structure and markup for every section
style.css     monochrome styling, dark mode via [data-theme]
script.js     all behavior — state, rendering, events
```

## Evaluation checklist

- DOM Manipulation — task creation, editing, deletion, and the six
  required DOM methods (`append`, `prepend`, `before`, `after`,
  `replaceWith`, `remove`) are all used in `script.js`, each marked with
  a `// DOM method demo:` comment.
- Event Handling & Delegation — a single delegated listener on the task
  list handles complete/edit/delete/save/cancel for every card.
- Attributes vs. Properties — dedicated demo section, plus
  `getAttribute` / `setAttribute` / `removeAttribute` / `hasAttribute` /
  `dataset` used throughout task state management.
- Code Quality — one file per concern, commented at each non-obvious
  step.
- UI/UX — monochrome, keyboard-focusable, respects
  `prefers-reduced-motion`, responsive down to mobile widths.