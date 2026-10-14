# The SSR app uses Next.js App Router (RSC + SSR)

The SSR app is built with Next.js App Router, so its pages are React Server Components that are also server-rendered, rather than classic SSR where every component hydrates. App Router is what people building SSR React apps actually use today, and its Route Handlers serve as the app's BFF. The cost is that the comparison is "CSR vs RSC + SSR" rather than pure "CSR vs SSR": less JS is hydrated than in classic SSR, which the README must call out.

## Considered Options

- **Next.js Pages Router (`getServerSideProps`)**: classic SSR, but legacy.
- **React Router v7 framework mode / TanStack Start**: closer to classic SSR, but less representative of what readers will meet in practice.
