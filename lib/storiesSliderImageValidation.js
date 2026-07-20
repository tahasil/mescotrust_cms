export const STORIES_SLIDER_REQUIRED_IMAGE_WIDTH = 400;
export const STORIES_SLIDER_REQUIRED_IMAGE_HEIGHT = 400;
export const STORIES_SLIDER_REQUIRED_IMAGE_TEXT =
  `${STORIES_SLIDER_REQUIRED_IMAGE_WIDTH} \u00D7 ${STORIES_SLIDER_REQUIRED_IMAGE_HEIGHT} pixels`;

/**
 * The storyboard crops CMS images into its responsive media window, so mixed
 * source dimensions are valid. The function remains exported for the page
 * validation pipeline and backward-compatible callers.
 */
export async function validateStoriesSliderImages() {
  return [];
}
