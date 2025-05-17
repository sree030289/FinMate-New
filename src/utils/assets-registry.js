// Improved implementation of the assets-registry module

// Keep a cache of registered assets
const assetsById = {};
let nextAssetId = 1;

export function registerAsset(asset) {
  const assetId = nextAssetId++;
  assetsById[assetId] = asset;
  
  // Return a reference that Metro can understand
  return {
    __packager_asset: true,
    fileSystemLocation: asset.fileSystemLocation || '',
    httpServerLocation: asset.httpServerLocation || '/assets',
    width: asset.width || 1,
    height: asset.height || 1,
    scales: asset.scales || [1],
    hash: asset.hash || '',
    name: asset.name || 'asset',
    type: asset.type || 'png',
    assetId
  };
}

export function getAssetByID(assetId) {
  return assetsById[assetId] || null;
}

export default {
  registerAsset,
  getAssetByID
};
