# 14. Navigation Menu (Navbar)

> Audit reference: Item 9 — *Navigation (Process Note): "Navbar state before adding a new item from the admin panel."*

---

## Where the navigation lives

Sidebar → **Menus**

This screen has two levels:

- **Menus list** — shows every menu (for example *Primary menu*, *Footer menu*) with its item count, plus **Add menu**.
- **Menu structure** — opens when you click a menu, and is where you add and arrange items.

---

## 1. Opening a menu

1. Go to **Menus**
2. Click the menu name you want to edit (for example **Primary menu**)
3. The **Menu structure** screen opens

---

## 2. Adding a menu item

1. In **Menu structure**, click **Add Menu** (the dashed button at the bottom)
2. A new item called **"New item"** is added
3. Click the **arrow (>)** on the left of the item to expand it
4. Fill in the details:

| Field | What to enter |
|---|---|
| **Navigation Label** | The text visitors will see (for example "About Us") |
| **Type** | `Page`, `Custom Link`, or `Modal` |
| **Page** | (If Type = Page) Choose the page from the dropdown — the URL fills in automatically |
| **URL** | (If Type = Custom Link) Type the full web address |
| **PDF Link / Document** | (If Type = Modal) Pick a PDF from the Media Library |
| **Target** | Open in the same tab, or open in a new tab |

5. Click **Save menu**

✅ The item now appears in the navigation bar.

---

## 3. Reordering items

- **Drag and drop** an item to move it up or down.
- Dragging an item **below** another item makes it a **sub-item** (dropdown) of that item.
- To move an item one level to the left (out of a dropdown), use the **left arrow** button on the item.
- To move an item one level to the right (into a dropdown), use the **right arrow** button.
- Click **Save menu** to apply the new order.

---

## 4. Removing an item

1. Expand the item
2. Click the **trash icon**
3. Click **Save menu**

To delete several items at once, tick the checkboxes on the left and click **Remove selected**.

---

## 5. Managing whole menus

On the **Menus list** screen you can also **Copy** a menu (to create a duplicate) and **Delete** an entire menu.

---

## Quick reminders

- Publishing a page does **not** add it to the navigation bar. You must add it here under **Menus**.
- Choose **Type = Page** whenever the link points to a page on this website — the URL then stays correct even if the page slug changes later.
- Use **Type = Custom Link** for external websites (for example a WhatsApp link or another domain).
- Changes take effect only after clicking **Save menu**.
