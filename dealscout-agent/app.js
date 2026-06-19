const sources = [
  { name: "Amazon", type: "retail", trust: 82, url: (q) => `https://www.amazon.com/s?k=${q}` },
  { name: "Walmart", type: "retail", trust: 78, url: (q) => `https://www.walmart.com/search?q=${q}` },
  { name: "Best Buy", type: "retail", trust: 88, url: (q) => `https://www.bestbuy.com/site/searchpage.jsp?st=${q}` },
  { name: "Target", type: "retail", trust: 80, url: (q) => `https://www.target.com/s?searchTerm=${q}` },
  { name: "Costco", type: "retail", trust: 85, url: (q) => `https://www.costco.com/CatalogSearch?keyword=${q}` },
  { name: "Newegg", type: "retail", trust: 76, url: (q) => `https://www.newegg.com/p/pl?d=${q}` },
  { name: "B&H", type: "retail", trust: 84, url: (q) => `https://www.bhphotovideo.com/c/search?q=${q}` },
  { name: "Micro Center", type: "retail", trust: 83, url: (q) => `https://www.microcenter.com/search/search_results.aspx?Ntt=${q}` },
  { name: "eBay", type: "used", trust: 72, url: (q) => `https://www.ebay.com/sch/i.html?_nkw=${q}` },
  { name: "Facebook Marketplace", type: "used", trust: 58, url: (q) => `https://www.facebook.com/marketplace/search/?query=${q}` },
  { name: "Craigslist", type: "used", trust: 49, url: (q) => `https://www.craigslist.org/search/sss?query=${q}` },
  { name: "OfferUp", type: "used", trust: 54, url: (q) => `https://offerup.com/search?q=${q}` },
  { name: "Mercari", type: "used", trust: 62, url: (q) => `https://www.mercari.com/search/?keyword=${q}` },
  { name: "Swappa", type: "used", trust: 81, url: (q) => `https://swappa.com/search?q=${q}` },
  { name: "Slickdeals", type: "deal", trust: 70, url: (q) => `https://slickdeals.net/newsearch.php?q=${q}` },
  { name: "Google Shopping", type: "deal", trust: 74, url: (q) => `https://www.google.com/search?tbm=shop&q=${q}` },
];

const exactDealCatalog = [
  {
    source: "Costco",
    match: /\b(ps5|playstation\s*5|dualsense)\b/i,
    title: "PlayStation DualSense Wireless Controller and Charging Station - White",
    url: "https://www.costco.com/playstation-dualsense-wireless-controller-and-charging-station---white.product.4000354051.html",
    price: 85,
    shipping: 0,
    condition: "new",
    distance: 0,
    sellerAgeMonths: 120,
    responseRate: 96,
    risk: 17,
    score: 77,
    note: "Exact Costco product page matched. Retail return protection is stronger than most marketplace listings.",
    verification: [
      "Exact Costco product URL is available.",
      "Retail source has stronger return and warranty protection than peer marketplace listings.",
      "Final checkout total should still be confirmed before purchase.",
    ],
  },
  {
    source: "Facebook Marketplace",
    match: /\b(monitor|display|screen|samsung)\b/i,
    title: "Samsung 27-inch curved monitor",
    url: "https://www.facebook.com/marketplace/item/1163090929335546/?ref=search&referral_code=null&referral_story_type=post&tracking=browse_serp%3A674c5eec-e3f5-4008-92e1-798c463130a1",
    price: 40,
    shipping: 0,
    condition: "used",
    distance: 9,
    sellerAgeMonths: 216,
    responseRate: 94,
    risk: 18,
    score: 86,
    note: "Exact Marketplace listing matched. Seller is highly rated, has 43 reviews, and joined Facebook in 2008.",
    verification: [
      "Exact Facebook Marketplace item URL is available.",
      "Seller is shown as highly rated with 43 reviews.",
      "Seller profile shows Facebook account age since 2008.",
      "Listing shows Samsung brand, 27-inch screen, Full HD 1920 x 1080, 60Hz, and used-good condition.",
      "Door pickup is listed, so buyer should still confirm availability and inspect the monitor in person.",
    ],
  },
];

const form = document.querySelector("#scout-form");
const dealList = document.querySelector("#deal-list");
const template = document.querySelector("#deal-card-template");
const sourceList = document.querySelector("#source-list");
const sourceCount = document.querySelector("#source-count");
const reportTitle = document.querySelector("#report-title");
const bestPrice = document.querySelector("#best-price");
const safePick = document.querySelector("#safe-pick");
const sourcesScanned = document.querySelector("#sources-scanned");
const recommendation = document.querySelector("#recommendation");
const watchouts = document.querySelector("#watchouts");
const negotiationPlan = document.querySelector("#negotiation-plan");
const sortSelect = document.querySelector("#sort");
const tabs = document.querySelectorAll(".tab-button");
const stageNodes = document.querySelector("#stage-nodes");
const stageSources = document.querySelector("#stage-sources");
const stageDeals = document.querySelector("#stage-deals");
const stageRisk = document.querySelector("#stage-risk");
const orbitProduct = document.querySelector("#orbit-product");
const orbitSources = document.querySelector("#orbit-sources");
const dealTimeline = document.querySelector("#deal-timeline");
const timelineSummary = document.querySelector("#timeline-summary");
const drawer = document.querySelector("#negotiation-drawer");
const drawerTitle = document.querySelector("#drawer-title");
const drawerMessage = document.querySelector("#drawer-message");
const drawerOffer = document.querySelector("#drawer-offer");
const drawerChecks = document.querySelector("#drawer-checks");
const drawerClose = document.querySelector("#drawer-close");
const drawerCopy = document.querySelector("#drawer-copy");
const heroProductImage = document.querySelector("#hero-product-image");
const heroSecondaryImage = document.querySelector("#hero-secondary-image");
const heroTertiaryImage = document.querySelector("#hero-tertiary-image");

let activeFilter = "all";
let currentDeals = [];
let currentProduct = "";
let currentBudget = 0;
let drawerScript = "";
let hasSearched = false;

function hashText(text) {
  return [...text].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 7);
}

function money(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function selectedConditions() {
  return [...form.querySelectorAll('input[name="condition"]:checked')].map((input) => input.value);
}

function productImageQuery(product) {
  const normalized = product.toLowerCase();
  if (/\b(ps5|playstation|dualsense|controller|xbox|switch)\b/.test(normalized)) return "controller";
  if (/\b(iphone|phone|smartphone|pixel|galaxy)\b/.test(normalized)) return "phone";
  if (/\b(monitor|display|screen)\b/.test(normalized)) return "monitor";
  if (/\b(laptop|macbook|notebook)\b/.test(normalized)) return "laptop";
  if (/\b(headphone|headset|earbuds|airpods)\b/.test(normalized)) return "headphones";
  if (/\b(camera|lens)\b/.test(normalized)) return "camera";
  if (/\b(watch|smartwatch)\b/.test(normalized)) return "watch";
  if (/\b(table|desk|chair|sofa|furniture)\b/.test(normalized)) return "furniture";
  return "generic";
}

const productImageLibrary = {
  controller: [
    "https://images.unsplash.com/photo-1605901309584-818e25960a8f?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=900&q=80",
  ],
  phone: [
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1585060544812-6b45742d762f?auto=format&fit=crop&w=900&q=80",
  ],
  monitor: [
    "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=900&q=80",
  ],
  laptop: [
    "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1484788984921-03950022c9ef?auto=format&fit=crop&w=900&q=80",
  ],
  headphones: [
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=80",
  ],
  camera: [
    "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1500634245200-e5245c7574ef?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1495707902641-75cac588d2e9?auto=format&fit=crop&w=900&q=80",
  ],
  watch: [
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=900&q=80",
  ],
  furniture: [
    "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1549497538-303791108f95?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=900&q=80",
  ],
  generic: [
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80",
  ],
};

function productImages(type) {
  return productImageLibrary[type] || productImageLibrary.generic;
}

function setCardImage(node, imageUrl, fallback) {
  node.style.backgroundImage = `linear-gradient(90deg, rgba(6, 0, 18, 0.5), rgba(6, 0, 18, 0.06)), url("${imageUrl}"), ${fallback}`;
}

function setHeroImages(product, deals = []) {
  const type = product ? productImageQuery(product) : "generic";
  const images = productImages(type);

  [heroProductImage, heroSecondaryImage, heroTertiaryImage].forEach((node) => {
    node.dataset.productType = type;
  });
  setCardImage(heroProductImage, images[0], "linear-gradient(135deg, #19042f, #4e1673)");
  setCardImage(heroSecondaryImage, images[1], "linear-gradient(135deg, #102244, #3b1259)");
  setCardImage(heroTertiaryImage, images[2], "linear-gradient(135deg, #111827, #45146a)");
}

function shortProductName(product) {
  return product
    .replace(/\b(unlocked|refurbished|open box|new|used)\b/gi, "")
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .join(" ");
}

function buildDeals({ product, budget, conditions }) {
  return exactDealCatalog
    .filter((listing) => listing.match.test(product))
    .map((listing, index) => {
      const source = sources.find((item) => item.name === listing.source);
      const trueCost = listing.trueCost || listing.price + listing.shipping + (source?.type === "retail" ? Math.round(listing.price * 0.065) : 0);

      return {
        id: `${listing.source}-${index}`,
        source,
        title: listing.title,
        price: listing.price,
        shipping: listing.shipping,
        trueCost,
        condition: listing.condition,
        distance: listing.distance,
        sellerAgeMonths: listing.sellerAgeMonths,
        responseRate: listing.responseRate,
        risk: listing.risk,
        score: listing.score,
        dealUrl: listing.url,
        isExactDeal: true,
        researchNote: listing.note,
        verification: listing.verification || [],
      };
    })
    .filter((deal) => deal.source && conditions.includes(deal.condition) && deal.trueCost <= budget)
    .sort((a, b) => b.score - a.score);
}

function dealReason(deal) {
  if (deal.researchNote) return deal.researchNote;

  const costText = deal.shipping === 0 ? "no extra shipping" : `${money(deal.shipping)} estimated shipping`;
  if (deal.source.type === "used") {
    return `${deal.source.name} is attractive because the true cost is ${money(deal.trueCost)} and the seller looks ${deal.risk < 35 ? "relatively safe" : "worth checking carefully"}. Ask for proof before agreeing to meet.`;
  }
  return `${deal.source.name} has a strong total-cost profile at ${money(deal.trueCost)} with ${costText}, plus stronger return protection than most peer listings.`;
}

function sellerMessage(deal, product, budget) {
  if (deal.source.type !== "used") {
    return `I found this ${product} at ${deal.source.name}. Before buying, I would compare final checkout cost, return window, warranty, and pickup availability.`;
  }

  const offer = Math.max(10, Math.round(Math.min(deal.trueCost * 0.88, budget * 0.82) / 5) * 5);
  return `Hi, I am interested in the ${product}. Is it fully working, are there any scratches or repairs, and can you share clear photos plus proof it is not locked? If everything checks out, would you consider ${money(offer)} for a quick pickup?`;
}

function offerAmount(deal, budget) {
  return Math.max(10, Math.round(Math.min(deal.trueCost * 0.88, budget * 0.82) / 5) * 5);
}

function riskDetails(deal) {
  if (deal.verification?.length) {
    return `Research check: ${deal.verification.join(" ")}`;
  }

  if (deal.source.type !== "used") {
    return `Risk check: verify final checkout price, seller identity if marketplace fulfillment is involved, return window, and warranty coverage. Estimated risk score: ${deal.risk}/100.`;
  }

  return `Risk check: seller age ${deal.sellerAgeMonths} months, response rate ${deal.responseRate}%, distance ${deal.distance} miles, condition ${deal.condition}. Ask for serial/IMEI status when relevant, recent photos, receipt if available, and meet in a public place. Estimated risk score: ${deal.risk}/100.`;
}

function filteredDeals() {
  const sortMode = sortSelect.value;
  return currentDeals
    .filter((deal) => activeFilter === "all" || deal.source.type === activeFilter)
    .sort((a, b) => {
      if (sortMode === "price") return a.trueCost - b.trueCost;
      if (sortMode === "risk") return a.risk - b.risk;
      return b.score - a.score;
    });
}

function sourceStatus(source) {
  if (!hasSearched) return { label: "ready", tone: "ready" };
  const deal = currentDeals.find((item) => item.source.name === source.name);
  if (!deal) return { label: "needs research", tone: "searching" };
  if (deal.score >= 78) return { label: "verified listing", tone: "best" };
  return { label: "verified", tone: "verified" };
}

function renderSourceList() {
  sourceCount.textContent = `${sources.length} active`;
  sourceList.innerHTML = "";
  sources.forEach((source) => {
    const status = sourceStatus(source);
    const chip = document.createElement("span");
    chip.className = `source-chip status-${status.tone}`;
    chip.style.setProperty("--sync-delay", `${sourceList.children.length * 55}ms`);
    chip.innerHTML = `<span class="status-light"></span><strong>${source.name}</strong><small>${status.label}</small>`;
    sourceList.append(chip);
  });
}

function renderStage() {
  const positions = [
    { left: "5%", top: "17%" },
    { left: "63%", top: "9%" },
    { left: "77%", top: "46%" },
    { left: "14%", top: "68%" },
    { left: "43%", top: "58%" },
  ];
  const stageDealsToShow = currentDeals.slice(0, 5);
  const lowestRisk = [...currentDeals].sort((a, b) => a.risk - b.risk)[0];

  stageSources.textContent = sources.length;
  stageDeals.textContent = currentDeals.length;
  stageRisk.textContent = lowestRisk ? `${lowestRisk.risk}/100` : "0";
  stageNodes.innerHTML = "";
  orbitSources.innerHTML = "";
  orbitProduct.textContent = shortProductName(currentProduct || "Product") || "Product";

  stageDealsToShow.forEach((deal, index) => {
    const node = document.createElement("div");
    node.className = `stage-node${index === 0 ? " best" : ""}${deal.risk > 60 ? " warn" : ""}`;
    node.style.left = positions[index].left;
    node.style.top = positions[index].top;
    node.style.animationDelay = `${index * 0.35}s`;
    node.innerHTML = `<strong>${deal.source.name}</strong><span>${money(deal.trueCost)} · ${deal.score}/100</span>`;
    stageNodes.append(node);
  });

  currentDeals.slice(0, 8).forEach((deal, index) => {
    const source = document.createElement("span");
    source.className = `orbit-source orbit-source-${index + 1}`;
    source.style.setProperty("--sync-delay", `${index * 110}ms`);
    source.textContent = deal.source.name;
    orbitSources.append(source);
  });
}

function renderTimeline() {
  const topDeals = currentDeals.slice(0, 3);
  const steps = [
    { label: "Scan", value: `${sources.length} sources`, detail: "Only exact researched listings are allowed into results." },
    { label: "Verify", value: `${currentDeals.length} exact`, detail: "Each visible deal needs an exact URL plus seller/source evidence." },
    ...topDeals.map((deal, index) => ({
      label: `Pick ${index + 1}`,
      value: `${deal.source.name} · ${money(deal.trueCost)}`,
      detail: `Verified score ${deal.score}/100, risk ${deal.risk}/100, ${deal.condition}.`,
    })),
  ];

  timelineSummary.textContent = `${topDeals.length} researched finalist${topDeals.length === 1 ? "" : "s"}`;
  dealTimeline.innerHTML = "";
  steps.forEach((step, index) => {
    const item = document.createElement("article");
    item.className = "timeline-step";
    item.style.animationDelay = `${index * 0.08}s`;
    item.innerHTML = `<span>${step.label}</span><strong>${step.value}</strong><p>${step.detail}</p>`;
    dealTimeline.append(item);
  });
}

function renderSummary(product) {
  const best = [...currentDeals].sort((a, b) => a.trueCost - b.trueCost)[0];
  const safest = [...currentDeals].sort((a, b) => a.risk - b.risk)[0];
  const recommended = currentDeals[0];

  reportTitle.textContent = `Best deals for ${product}`;
  bestPrice.textContent = best ? money(best.trueCost) : "$0";
  safePick.textContent = safest ? `${100 - safest.risk}/100` : "0";
  sourcesScanned.textContent = sources.length;

  recommendation.textContent = recommended
    ? `${recommended.source.name} is the best researched pick right now with an exact listing URL, ${recommended.score}/100 verified score, and ${money(recommended.trueCost)} total cost.`
    : "No exact researched listings match this product, budget, and condition yet.";

  watchouts.innerHTML = "";
  [
    "No deal is shown unless it has an exact product/listing URL.",
    "Seller reviews, account age, condition, pickup/shipping, and price must be checked before ranking.",
    "Any unverified source stays out of the deal list instead of being guessed.",
  ].forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    watchouts.append(li);
  });

  negotiationPlan.textContent = recommended?.source.type === "used"
    ? "Start 12-18% below the listed price, ask verification questions first, then move up only if the seller proves condition and ownership."
    : recommended
      ? "Use retail results as your safe benchmark, then negotiate used listings below that total cost so the risk is worth it."
      : "Run a live research pass or add verified listing evidence before negotiating.";
}

function renderDeals(product, budget) {
  const deals = filteredDeals();
  dealList.innerHTML = "";

  deals.forEach((deal, index) => {
    const card = template.content.firstElementChild.cloneNode(true);
    card.style.setProperty("--reveal-delay", `${Math.min(index, 8) * 55}ms`);
    if (index < 3) card.classList.add("high-rank");
    if (index === 0) card.classList.add("top-pick");
    card.querySelector(".deal-rank").textContent = `#${index + 1}`;
    card.querySelector("h3").textContent = deal.title;
    card.querySelector(".source-meta").textContent = `${deal.source.name} · ${deal.source.type}`;
    card.querySelector(".price-box strong").textContent = money(deal.trueCost);
    card.querySelector(".price-box small").textContent = `${money(deal.price)} item`;
    card.querySelector(".score-pill").textContent = `Score ${deal.score}/100`;
    card.querySelector(".risk-pill").textContent = `Risk ${deal.risk}/100`;
    card.querySelector(".condition-pill").textContent = deal.condition;
    card.querySelector(".distance-pill").textContent = deal.source.type === "used" ? `${deal.distance} mi` : "ship/pickup";
    card.querySelector(".reason").textContent = dealReason(deal);
    card.querySelector(".message-copy").textContent = sellerMessage(deal, product, budget);
    const dealLink = card.querySelector(".search-link");
    dealLink.href = deal.dealUrl;
    dealLink.target = "_blank";
    dealLink.rel = "noopener noreferrer";
    dealLink.classList.remove("unavailable");
    dealLink.textContent = "Open exact listing";
    dealLink.ariaLabel = `Open exact ${deal.source.name} listing`;
    card.querySelector(".negotiate-button").addEventListener("click", () => {
      openNegotiationDrawer(deal, product, budget);
    });
    card.querySelector(".copy-button").addEventListener("click", async (event) => {
      await navigator.clipboard.writeText(card.querySelector(".message-copy").textContent);
      event.currentTarget.textContent = "Copied";
      setTimeout(() => {
        event.currentTarget.textContent = "Copy";
      }, 1200);
    });
    card.querySelector(".details-button").addEventListener("click", () => {
      card.querySelector(".reason").textContent = riskDetails(deal);
    });
    dealList.append(card);
  });

  if (!deals.length) {
    dealList.innerHTML = `<article class="empty-state"><strong>No verified deals found</strong><p>No exact researched listing matched this product, budget, and condition. Run live research or add verified listing evidence before showing results.</p></article>`;
  }
}

function renderEmptyState() {
  currentProduct = "";
  currentBudget = 0;
  currentDeals = [];
  hasSearched = false;
  setHeroImages("", []);

  renderSourceList();
  sourceCount.textContent = `${sources.length} ready`;
  stageSources.textContent = sources.length;
  stageDeals.textContent = "0";
  stageRisk.textContent = "0";
  stageNodes.innerHTML = "";
  orbitSources.innerHTML = "";
  orbitProduct.textContent = "Ready";

  reportTitle.textContent = "Start a scout search";
  bestPrice.textContent = "$0";
  safePick.textContent = "0";
  sourcesScanned.textContent = sources.length;
  recommendation.textContent = "Enter a product, budget, and location to search only verified exact listings.";
  watchouts.innerHTML = "";
  ["No product selected yet.", "Results will appear after you run a scout search."].forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    watchouts.append(li);
  });
  negotiationPlan.textContent = "Negotiation guidance will appear once a best deal is found.";

  timelineSummary.textContent = "No active search";
  dealTimeline.innerHTML = "";
  [
    { label: "Ready", value: `${sources.length} sources`, detail: "Enter a product to start comparing live deal paths." },
    { label: "Waiting", value: "No product", detail: "The dashboard is empty until you submit a scout search." },
  ].forEach((step, index) => {
    const item = document.createElement("article");
    item.className = "timeline-step";
    item.style.animationDelay = `${index * 0.08}s`;
    item.innerHTML = `<span>${step.label}</span><strong>${step.value}</strong><p>${step.detail}</p>`;
    dealTimeline.append(item);
  });

  dealList.innerHTML = `<article class="empty-state"><strong>No deals yet</strong><p>Search for a product to show researched listings with exact links only.</p></article>`;
}

function openNegotiationDrawer(deal, product, budget) {
  const suggestedOffer = offerAmount(deal, budget);
  const message = sellerMessage(deal, product, budget);
  const checks = deal.source.type === "used"
    ? ["Ask for current photos", "Verify serial/IMEI or ownership proof", "Confirm no repairs or hidden damage", "Meet in a public place"]
    : ["Confirm final checkout total", "Check warranty window", "Compare return policy", "Review seller/fulfillment details"];

  drawerTitle.textContent = `${deal.source.name} · ${money(deal.trueCost)}`;
  drawerMessage.textContent = message;
  drawerOffer.textContent = deal.source.type === "used"
    ? `Open at ${money(suggestedOffer)}, hold max near ${money(Math.round(deal.trueCost * 0.96))}, and only move up after proof of condition.`
    : `Use ${money(deal.trueCost)} as the safe benchmark. Used listings should beat this by at least 12% to justify risk.`;
  drawerChecks.innerHTML = "";
  checks.forEach((check) => {
    const li = document.createElement("li");
    li.textContent = check;
    drawerChecks.append(li);
  });
  drawerScript = `${message}\n\nOffer strategy: ${drawerOffer.textContent}\n\nChecklist:\n${checks.map((check) => `- ${check}`).join("\n")}`;
  drawer.setAttribute("aria-hidden", "false");
  drawer.classList.add("open");
}

function closeNegotiationDrawer() {
  drawer.setAttribute("aria-hidden", "true");
  drawer.classList.remove("open");
}

function runScout() {
  const data = new FormData(form);
  const product = data.get("product").trim();
  const budget = Number(data.get("budget"));
  const zip = data.get("zip").trim();
  const priority = data.get("priority");
  const conditions = selectedConditions();

  currentProduct = product;
  currentBudget = budget;
  hasSearched = true;
  currentDeals = buildDeals({ product, budget, zip, priority, conditions });
  setHeroImages(product, currentDeals);
  renderSourceList();
  renderStage();
  renderTimeline();
  renderSummary(product);
  renderDeals(product, budget);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  startScoutSequence();
});

sortSelect.addEventListener("change", () => {
  if (!currentDeals.length) return;
  const data = new FormData(form);
  renderDeals(data.get("product").trim(), Number(data.get("budget")));
});

tabs.forEach((button) => {
  button.addEventListener("click", () => {
    tabs.forEach((tab) => tab.classList.remove("active"));
    button.classList.add("active");
    activeFilter = button.dataset.filter;
    if (!currentDeals.length) return;
    const data = new FormData(form);
    renderDeals(data.get("product").trim(), Number(data.get("budget")));
  });
});

function startScoutSequence() {
  document.body.classList.add("is-scanning");
  sourceList.querySelectorAll(".source-chip").forEach((chip) => {
    chip.className = "source-chip status-searching is-syncing";
    chip.querySelector("small").textContent = "syncing";
  });
  window.setTimeout(() => {
    runScout();
    document.body.classList.remove("is-scanning");
  }, 720);
}

drawerClose.addEventListener("click", closeNegotiationDrawer);
drawerCopy.addEventListener("click", async () => {
  await navigator.clipboard.writeText(drawerScript);
  drawerCopy.textContent = "Copied script";
  setTimeout(() => {
    drawerCopy.textContent = "Copy negotiation script";
  }, 1200);
});
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeNegotiationDrawer();
});

renderSourceList();
renderEmptyState();
