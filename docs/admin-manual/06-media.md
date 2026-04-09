# 6. Media Library

The Media library is where every image, PDF, and document used on the website is stored. Once a file is uploaded here, it can be used in any page, blog, or theme setting.

## Where to find it

Sidebar → **Media**

## What you see

A grid of cards, each showing an uploaded file:

- **Thumbnail** (for images)
- **Filename**
- **Upload date**
- **Copy URL** button
- **Delete** button

You can search by filename and paginate through older uploads.

---

## Upload a file

1. Click **Upload** at the top right.
2. Select one or more files from your computer (or drag-and-drop them onto the upload area).
3. Wait — files are uploaded one at a time. A progress bar shows on each.
4. The newly uploaded file appears at the top of the grid.

### Allowed formats

| Type | Extensions |
|---|---|
| **Image** | `.webp` only |
| **Document** | `.pdf` |

> **Why only WebP?** WebP files are 25–50 % smaller than JPEG/PNG with the same quality. This makes the website faster.
>
> **Convert your images to WebP** at [squoosh.app](https://squoosh.app/) or any image converter before uploading. Drag a JPG/PNG into Squoosh, choose WebP on the right, download, then upload here.

### Limits

- **Maximum size**: 50 MB per file
- **Maximum image dimensions**: 8192 × 8192 pixels

If a file exceeds these limits, the upload will be rejected with an error.

---

## Use a file in a page or blog

1. Open the **Media** library and find the file you want.
2. Click the **copy icon** under the file card — the URL is now on your clipboard.
3. Switch to the page or blog you are editing.
4. Paste the URL into the image / file field (e.g. **Featured Image** on a blog, image fields inside page builder blocks).

> **Note**: there is currently no in-place "media picker" dialog. You always copy the URL from the Media library and paste it into the destination field. If you need a picker, ask your developer.

---

## Edit alt text

Alt text is a short description of an image, used by **screen readers** (for visually impaired visitors) and **search engines**. Setting it on every photo improves accessibility and SEO.

1. Open the **Media** library.
2. Find the file card and click the **pencil icon** (Edit) under it.
3. A dialog opens showing a thumbnail, file details, and an **Alt text** field.
4. Type a short factual description — for example: *"Children at MESCO scholarship distribution event 2024"*.
5. Click **Save**.

> **Tips**:
> - Keep alt text under ~125 characters and avoid starting with "Image of…" — screen readers already announce that it is an image.
> - For purely decorative images (e.g. background patterns), leave the alt text blank — that tells screen readers to skip them.
> - Alt text on PDFs is also editable but is rarely needed for downloadable documents.

---

## Delete a file

1. Click the trash icon on a file card.
2. Confirm the deletion.

> **Warning**: deleting a file does **not** automatically remove references to it from pages or blogs. If a deleted image is still used somewhere, that page will show a broken image. Search the Media URL in the page builder before deleting.

---

## Search and pagination

- **Search box** at the top — type part of the filename
- **Pagination** at the bottom — newer files are shown first

---

## Tips

- **Rename files before uploading** — give them descriptive names like `scholarship-event-2024.webp` instead of `IMG_3421.webp`. The filename is part of the URL.
- **Compress images first**. Aim for under **300 KB** for full-width images and under **100 KB** for thumbnails.
- **Set alt text on every photo** right after upload — see the section above. Search engines and screen readers depend on it.
- **Group your uploads** — uploading 10 files in one session is faster than spreading them across the day.
- **PDFs**: name them clearly (e.g. `annual-report-2024.pdf`) — this matters when readers download them.
- **Don't upload sensitive documents** to the Media library — anything uploaded becomes publicly accessible if someone knows the URL.
