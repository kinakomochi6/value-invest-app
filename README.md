This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## B/S data contract

The updater stores the stable analysis categories in the Firestore field
`B/S_分析分類`. P/與 calculations use this nested map when it is present and
fall back to the legacy top-level B/S fields for companies that have not yet
been refreshed. An incomplete or malformed nested map is rejected as a whole,
so values from two schema versions are never mixed in one calculation.

Asset categories are multiplied by their liquidation-value rates. Total
liabilities (`★負債合計`) and non-controlling interests
(`純資_非支配株主持分`) are then deducted once. Detailed liability categories
remain available for display and diagnostics, but are not deducted again.

## P/與 safety checks

P/與 is allowed to affect the value score and target-price simulation only
when all of the following are true:

- the complete canonical B/S map is present
- the updater quality status is `verified`
- canonical assets reconcile to total assets within 1 oku yen
- total assets, total liabilities, market capitalization, and adjusted net
  assets pass basic validity checks

`partial`, `quarantined`, legacy, incomplete, and inconsistent records do not
publish a P/與 value and are excluded from investment decisions. The internal
reference calculation remains available as `P_與_参考値` for diagnostics only.
Even verified records are withheld when adjusted net assets are below 5% of
total assets or below 1 oku yen, because small classification differences would
otherwise make P/與 swing sharply. Real-estate adjustments require both book
value and market value, and tax is deducted only from positive unrealized gains.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
