# SSR vs CSR reference

A reference app that implements the same pages with client-side rendering and server-side rendering, to show what each one costs and buys in initial load and in token handling.

## Language

### Rendering

**Client-Side Rendering (CSR)**:
The server sends an empty HTML shell and a JS bundle, and the browser fetches data and renders the page. It's the typical single-page application.
_Avoid_: SPA (when the rendering mode is meant), client app

**Server-Side Rendering (SSR)**:
The server renders the page's HTML with its data per request, and the browser then hydrates it to make it interactive.
_Avoid_: server app, isomorphic rendering

**React Server Component (RSC)**:
A component that only ever runs on the server and sends no JS for itself to the browser, so it is never hydrated. The SSR app's pages are built from these.
_Avoid_: server-side component

**Hydration**:
The browser attaching React's event handlers and state to server-rendered HTML so it becomes interactive.

**Initial Load**:
The time from navigating to the app's URL until the first page shows its data.
_Avoid_: page load, startup time

**Simulated Latency**:
An artificial delay, set per page request, that the API waits before responding, so the effect of slow data on Initial Load can be shown.
_Avoid_: delay, lag, throttling

### Sample domain

**Order**:
A customer's purchase, with a status, a total and one or more Line Items. It is the data both apps render.
_Avoid_: purchase, transaction

**Line Item**:
One product on an Order, with a quantity and a price.
_Avoid_: order line, item

**Dashboard**:
The page shown after login, with a revenue summary and a list of recent Orders.
_Avoid_: home, overview

### Auth

**Backend-for-Frontend (BFF)**:
A server owned by the frontend that holds the user's tokens and calls downstream APIs on the user's behalf, so tokens never reach the browser.
_Avoid_: proxy, API gateway
