/**
 * Space Drift - Asynchronous Asset Preloader & Cache
 */

const assetCache = {
  ships: new Map(),
  asteroids: new Map()
};

const SHIP_SPRITES = [
  { id: 'drift', src: 'assets/ships/SpaceShip_0.png' },
  { id: 'nova', src: 'assets/ships/SpaceShip_4.png' },
  { id: 'aegis', src: 'assets/ships/SpaceShip_3.png' },
  { id: 'phantom', src: 'assets/ships/SpaceShip_2.png' },
  { id: 'fighter', src: 'assets/ships/SpaceShip_1.png' },
  { id: 'saucer', src: 'assets/ships/SpaceShip_5.png' }
];

const ASTEROID_SPRITES = [
  { id: 'ast_0', src: 'assets/asteroids/Asteroid_0.png' }, // Classic Rock
  { id: 'ast_1', src: 'assets/asteroids/Asteroid_1.png' }, // Fire/Magma/Comet
  { id: 'ast_2', src: 'assets/asteroids/Asteroid_2.png' }, // Ice/Cryo
  { id: 'ast_3', src: 'assets/asteroids/Asteroid_3.png' }, // Cyber Debris
  { id: 'ast_4', src: 'assets/asteroids/Asteroid_4.png' }, // Amethyst/Void
  { id: 'ast_5', src: 'assets/asteroids/Asteroid_5.png' }  // Toxic/Radioactive
];

function loadImage(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve({ img, success: true });
    img.onerror = () => {
      console.warn(`[AssetLoader] Gagal memuat asset: ${src}, fallback aktif.`);
      resolve({ img: null, success: false });
    };
    img.src = src;
  });
}

export async function loadGameAssets() {
  const shipPromises = SHIP_SPRITES.map(async s => {
    const { img } = await loadImage(s.src);
    if (img) assetCache.ships.set(s.id, img);
  });

  const astPromises = ASTEROID_SPRITES.map(async a => {
    const { img } = await loadImage(a.src);
    if (img) assetCache.asteroids.set(a.id, img);
  });

  await Promise.all([...shipPromises, ...astPromises]);
  console.log(
    `[AssetLoader] Preload selesai: ${assetCache.ships.size} kapal, ${assetCache.asteroids.size} asteroid.`
  );
  return assetCache;
}

export function getShipSprite(shipId) {
  return assetCache.ships.get(shipId) || null;
}

export function getAsteroidSprite(astKey) {
  return assetCache.asteroids.get(astKey) || null;
}
