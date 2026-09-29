const fs = require('fs');
const path = require('path');

function resolveObject(arr, val, memo = new Map()) {
  if (val === -5) return undefined;
  if (val === null || typeof val !== 'object') return val;
  if (memo.has(val)) return memo.get(val);
  if (Array.isArray(val)) {
    const res = [];
    memo.set(val, res);
    for (const item of val) {
      if (typeof item === 'number' && item >= 0 && item < arr.length) {
        res.push(resolveObject(arr, arr[item], memo));
      } else {
        res.push(resolveObject(arr, item, memo));
      }
    }
    return res;
  }
  const res = {};
  memo.set(val, res);
  for (const [k, v] of Object.entries(val)) {
    let key = k;
    if (k.startsWith('_')) {
      const keyIdx = parseInt(k.slice(1), 10);
      if (keyIdx >= 0 && keyIdx < arr.length) {
        key = arr[keyIdx];
      }
    }
    let valResolved = v;
    if (typeof v === 'number' && v >= 0 && v < arr.length) {
      valResolved = resolveObject(arr, arr[v], memo);
    } else if (v === -5) {
      valResolved = undefined;
    } else {
      valResolved = resolveObject(arr, v, memo);
    }
    res[key] = valResolved;
  }
  return res;
}

async function dumpCardArtData() {
  console.log('Fetching all cards from cardart.cc...');
  const allCards = [];
  const seenIds = new Set();
  let cursor = null;
  let page = 0;

  while (true) {
    page++;
    let url = 'https://cardart.cc/explore.data';
    if (cursor) {
      url += '?cursor=' + encodeURIComponent(cursor) + '&view=more';
    }
    const res = await fetch(url);
    if (!res.ok) {
      console.log('Page fetch failed with status:', res.status);
      break;
    }
    const arr = await res.json();
    
    const itemsIdx = arr.indexOf('items');
    if (itemsIdx === -1) {
      console.log('Could not find items index on page', page);
      break;
    }
    const itemsRef = arr[itemsIdx + 1];
    if (!Array.isArray(itemsRef)) {
      console.log('itemsRef is not array on page', page);
      break;
    }
    
    const pageItems = resolveObject(arr, itemsRef);
    let newItemsCount = 0;
    for (const item of pageItems) {
      if (item && item.id && !seenIds.has(item.id)) {
        seenIds.add(item.id);
        const cardImg = item.images?.png || ('/img/cards/' + item.id + '/v1/card.png');
        const thumbImg = item.images?.w640 || item.images?.w1024 || cardImg;
        allCards.push({
          id: item.id,
          title: item.title || 'CardArt 设计款',
          titleEn: item.titleEn || '',
          dominantColor: item.dominantColor || '#1e293b',
          imageUrl: cardImg.startsWith('http') ? cardImg : ('https://cardart.cc' + cardImg),
          thumbUrl: thumbImg.startsWith('http') ? thumbImg : ('https://cardart.cc' + thumbImg),
          authorName: item.author?.name || 'CardArt',
          authorHandle: item.author?.handle || '',
          likeCount: typeof item.likeCount === 'number' ? item.likeCount : 0,
          downloadCount: typeof item.downloadCount === 'number' ? item.downloadCount : 0,
          typeSlug: item.typeSlug || 'payment',
          regionCode: item.regionCode || 'GLOBAL',
          featured: !!item.featured,
          source: 'cardart',
          sourceUrl: 'https://cardart.cc/c/' + item.id,
        });
        newItemsCount++;
      }
    }
    
    let nextCursor = null;
    const ncIdx = arr.indexOf('nextCursor');
    if (ncIdx !== -1 && typeof arr[ncIdx+1] === 'string') {
      nextCursor = arr[ncIdx+1];
    }
    console.log('Page ' + page + ': added ' + newItemsCount + ', total ' + allCards.length);
    if (!nextCursor || newItemsCount === 0) break;
    cursor = nextCursor;
  }

  console.log('Fetched total cards from cardart.cc: ' + allCards.length);
  
  // Ensure data directory
  const rootDir = process.cwd();
  const dataDir = path.join(rootDir, 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(path.join(dataDir, 'cardart_cards.json'), JSON.stringify(allCards, null, 2), 'utf-8');

  // Write TypeScript file
  const tsHeader = '// Snapshot of cards from https://cardart.cc\n// Maintained with dynamic synchronization via /api/cardart/sync and client-side live fetch\n\nexport interface CardArtCard {\n  id: string;\n  title: string;\n  titleEn: string;\n  dominantColor: string;\n  imageUrl: string;\n  thumbUrl: string;\n  authorName: string;\n  authorHandle: string;\n  likeCount: number;\n  downloadCount: number;\n  typeSlug: string;\n  regionCode: string;\n  featured: boolean;\n  source: "cardart";\n  sourceUrl: string;\n}\n\nexport const CARDART_CARDS: CardArtCard[] = ';

  const tsContent = tsHeader + JSON.stringify(allCards, null, 2) + ';\n';
  fs.writeFileSync(path.join(rootDir, 'src/lib/cardartData.ts'), tsContent, 'utf-8');
  console.log('Successfully wrote data/cardart_cards.json and src/lib/cardartData.ts!');
}

dumpCardArtData().catch(err => {
  console.error('Error during cardart sync:', err);
  process.exit(1);
});
