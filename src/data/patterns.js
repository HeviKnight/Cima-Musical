// ===================================================
// DADOS Y SPRITES (DATA)
// ===================================================

/**
 * Devuelve la ruta al sprite correspondiente de la cara del dado (1..6).
 * @param {number|string} diceValue
 * @returns {string} Ruta al sprite
 */
export function getDiceSprite(diceValue) {
  const val = Math.min(Math.max(parseInt(diceValue, 10) || 1, 1), 6);
  return `/assets/sprites/UI/Dado_spr_${val}.png`;
}
