# DealScout Agent

DealScout is a standalone prototype for a buyer-side shopping agent. It scouts a broad set of retail, used marketplace, and deal-feed sources, normalizes listings into one ranking model, estimates true cost, flags risk, and drafts seller messages for used listings.

## Run locally

Open `index.html` directly in a browser, or serve the folder:

```sh
python3 -m http.server 5174
```

Then visit `http://localhost:5174`.

## Current version

- Searches across a connector list of major sources.
- Generates ranked deal results from product, budget, ZIP, condition, and priority.
- Scores each deal by estimated price value, safety, speed, seller trust, and condition risk.
- Creates direct search links for every source.
- Drafts seller verification and negotiation messages.
- Includes retail, used marketplace, and deal-feed filtering.

## Next build steps

- Replace simulated connector results with official APIs where available.
- Add browser-assisted source readers only where each platform allows automation.
- Add user approval before sending any marketplace message.
- Store watchlists and alert users when price drops.
- Add product-specific risk questions, such as IMEI checks for phones or shutter count for cameras.
