export const WELCOME_TO_MESCO_REQUIRED_IMAGE_WIDTH = 1042;
export const WELCOME_TO_MESCO_REQUIRED_IMAGE_HEIGHT = 1164;
export const WELCOME_TO_MESCO_REQUIRED_IMAGE_TEXT =
  `${WELCOME_TO_MESCO_REQUIRED_IMAGE_WIDTH} \u00D7 ${WELCOME_TO_MESCO_REQUIRED_IMAGE_HEIGHT} pixels`;

/**
 * The current kinetic-statement design no longer renders the legacy
 * imageDesktop/imageUrl portrait. Keep this export for existing API and page
 * validation callers, but do not block saves because of stale legacy data.
 * Inline photo chips are intentionally responsive pill crops and accept mixed
 * source dimensions.
 */
export async function validateWelcometoMESCOImage() {
  return [];
}
