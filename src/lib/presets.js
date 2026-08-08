import skinsData from './skins-data.json'

// Bottle "skins" — real illustrated artwork lifted straight from the
// original design bible (blurr (1).html's embedded SKINS object), not
// placeholder color blocks.
export const PRESETS = {
  whisky: { label: 'Whisky', art: 'whisky_black', ml: 750, price: 1200 },
  vodka: { label: 'Vodka', art: 'vodka_red', ml: 750, price: 1000 },
  gin: { label: 'Gin', art: 'gin_blue', ml: 750, price: 2800 },
  rum: { label: 'Rum', art: 'whisky_blue', ml: 750, price: 1400 },
  brandy: { label: 'Brandy', art: 'brandy_brown', ml: 750, price: 1100 },
  wine: { label: 'Wine', art: 'wine_green', ml: 750, price: 950 },
  beer: { label: 'Lager', art: 'beer_green', ml: 650, price: 160 },
  wild: { label: 'Skull vodka', art: 'vodka_skull', ml: 750, price: 2600 },
  other: { label: 'Something else', art: 'green_screwtop', ml: 750, price: 0 },
}

export const PRESET_KEYS = Object.keys(PRESETS)

export function artFor(skin) {
  const preset = PRESETS[skin]
  const key = preset?.art || 'whisky_black'
  return skinsData[key]?.d
}
