# Genshin Calc

A Wish Pity & Primogem Savings Calculator for Genshin Impact, built as a small portfolio project.

I made this to answer the question every player asks before a banner: "Do I have enough pulls for the character I want?" You enter your current pity, whether your next 5★ is a 50/50 or guaranteed, and how many Primogems and Intertwined Fates you have. The dashboard then shows your chance of getting the featured 5★ and how many days of saving you still need.

## What it does

- Takes your current pity, 50/50 status, Primogems, and Fates, with sliders and number inputs
- Lets you toggle Daily Commissions and the Blessing of the Welkin Moon to count your daily income
- Works out the chance of landing the featured 5★ using the 0.6% base rate, the soft pity ramp from pull 74, and hard pity at 90
- Shows how many pulls you need to reach soft pity and hard pity (up to 180 on a 50/50, 90 when guaranteed)
- Estimates how many days it will take to reach hard pity with your income
- Shows a pity progress bar with the soft pity and hard pity zones marked

## Tech

React, Vite, and Tailwind CSS. The calculation logic lives in its own file (`src/lib/wishMath.js`), separate from the UI, so it's easy to read and test.

## Notes on the math

The 50/50 is treated as a flat 50% coin flip. The game's "Capturing Radiance" mechanic gives a slightly better chance than that, so real results can come out a bit better than the calculator shows.

## Disclaimer

Unofficial fan-made calculator. Not affiliated with or endorsed by HoYoverse.

© All rights reserved by COGNOSPHERE. Genshin Impact and all related assets, names, and trademarks belong to HoYoverse / COGNOSPHERE.
