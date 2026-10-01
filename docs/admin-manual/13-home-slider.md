# 13. Homepage Slider (Editing)

> Audit reference: Item 7 — *Homepage Slider (Process Note): "Slider was previously edited via a shortcode."*

---

## Where the slider lives

Sidebar → **Sliders**

You will see a table with four sliders:

| Slider | Component ID |
|---|---|
| Home Slider | `HomeSlider` |
| Circular Slider | `ImageSlider` |
| Stories Slider | `StoriesSlider` |
| Events Slider | `EventsSlider` |

Each row has a **Status** switch (Enabled / Disabled) and an **Edit** button.

---

## 1. Editing the slider content (correct way)

1. Go to **Sliders**
2. Find the slider you want — for the homepage this is **Home Slider**
3. Click **Edit** next to it
4. Make your changes (slides, images, text, links)
5. Click **Save**

✅ Changes appear on the website immediately.

---

## 2. Turning a slider on or off

1. Go to **Sliders**
2. Use the **Status** switch next to the slider
3. **Enabled** = slider shows on the website
4. **Disabled** = slider is hidden

---

## 3. About shortcodes

A **shortcode** is a small text code (for example `[shortcode="homeslider"]`) that you place inside a **ShortCode** block on a page. The block then pulls the content from the source and displays it.

### Important

- A shortcode is only a **placeholder**. It does not hold the content — the content stays in its own module.
- **Always edit the content from its original module** (Sliders, Gallery, Forms, etc.). Do not try to build the content inside the shortcode block.
- If you replace a real block with a shortcode, that block will **no longer be visible on the page**, because the page is now showing the shortcode source instead. The original block can still be found and edited from its own module or from the **Components** list.

### When to use a shortcode

Use one when the **same content must appear on more than one page**. If it is only needed on one page, use a normal block instead.

---

## Quick reminders

- To change slider slides, images or text → **Sliders → Edit → Save**.
- To hide a slider → turn off its **Status** switch.
- Shortcodes only reference content. They never store it.
- A shortcode and a normal block must **not** be used for the same content on the same page, otherwise the content will appear twice.
