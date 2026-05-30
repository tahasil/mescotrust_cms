# Form Builder Module - Admin Step-by-Step Guide

This guide explains how to create, publish, embed, and manage forms using the Form Builder module in Mesco Trust CMS.

## 1. Access the Module

1. Sign in to Admin panel.
2. Open `Form Builder` from the left sidebar.
3. You will see the forms listing table with:
   - `Form ID`
   - `Form Name`
   - `Shortcode`
   - `Status`
   - `Created Date`
   - Actions (`Edit`, `View`, `Delete`, `Copy`)

## 2. Create a New Form

1. Click `Add Form`.
2. Enter:
   - `Form Name`
   - `Initial Status` (`Draft`, `Published`, or `Archived`)
3. Click `Create & Open Builder`.

What happens automatically:
- System generates immutable `Form ID` like `FORM_001`.
- System generates immutable shortcodes:
  - `[form id="FORM_001"]`
  - `[form_builder id="FORM_001"]`

## 3. Build Form Fields (Drag-and-Drop)

In the builder screen:

1. From `Field Palette`, drag field types into `Form Canvas` (or click to add).
2. Supported fields:
   - Text
   - Email
   - Number
   - Mobile
   - Password
   - Textarea
   - Select
   - Radio Group
   - Checkbox Group
   - Date
   - File
   - URL
   - Hidden
   - Section Heading
   - Divider
3. Reorder fields by dragging existing field cards.
4. Use field actions:
   - Duplicate
   - Delete
5. Click `Save` to persist schema.

Tip:
- You can drag from the palette directly into an empty canvas or between existing fields.
- Use the drag handle on each field card to reorder fields.

## 4. Configure Field Settings

Select any field in canvas and configure:

- `Field Label`
- `Field Name`
- `Placeholder`
- `Help Text`
- `Default Value`
- `Column Width`:
  - Full width (1 column)
  - Half width (2 columns)
  - One-third width (3 columns)
- `CSS Class` (optional)
- Toggles:
  - `Required`
  - `Read only`
- `Hidden`

Notes:
- New fields and duplicated fields get auto-generated unique field names.
- Field names are normalized to lowercase snake_case (`a-z`, `0-9`, `_`).

For option-based fields (Select/Radio/Checkbox):
- Add, edit, remove options.

## 5. Configure Validation Rules

Depending on field type, configure:

- Min/Max length
- Min/Max value
- Mobile min/max digits
- Checkbox min/max selections
- Regex pattern
- File max size (MB)
- File allowed types (comma-separated, e.g. `.pdf,image/png`)

Custom validation messages can be configured for:
- Required
- Format/type rules
- Min/Max rules
- Regex
- File type/size
- Option errors
- Checkbox min/max selection

## 6. Configure Form-Level Settings

Open `Form Configuration` section:

1. Set `Submit Button Text`.
2. Set `Success Message`.
3. Toggle `Allow archived form to render publicly` if needed.

Then click `Save`.

Live preview:
- The `Live Form Preview` panel updates instantly as you edit field settings.
- Use Desktop / Tablet / Mobile preview toggle to verify responsive layout behavior before publishing.

## 7. Publish the Form

Set form `Status`:

- `Draft`: Not available on public site.
- `Published`: Public rendering + submissions enabled.
- `Archived`: Blocked by default unless archived render is explicitly allowed.

Click `Save`.

## 8. Use the Form on Website Pages

You have 2 ways to embed a form:

### Option A: Page Builder Form Embed Block (Recommended)

1. Open page in Page Builder.
2. Add `Form Embed` block.
3. Either:
   - Select form from dropdown, or
   - Paste shortcode manually
4. Save page.
5. Preview page and submit test entry.

### Option B: Shortcode Usage

Use either shortcode:
- `[form id="FORM_001"]`
- `[form_builder id="FORM_001"]`

Copy shortcode from form listing or form editor copy buttons.

## 9. Test Frontend Submission

1. Open the public page containing the form.
2. Fill required fields and submit.
3. For file fields:
   - Upload supported file types only.
   - Check size limits.
4. Verify success message appears.

## 10. Manage Submissions

1. Go to `Form Submissions` in sidebar.
2. Select a form from dropdown.
3. Use search and unread filter.
4. Open submission details:
   - View submitted values
   - View files (open/download)
   - See legacy fields (if schema changed after older submissions)
5. Mark unread entries as read.
6. Delete submission (Admin only).

Important behavior:
- Forms automatically appear in submissions module after creation.
- Column labels follow latest field labels/names.
- Old data remains intact using field snapshot/legacy mapping.

## 11. Notifications

New form submissions appear in Admin notification bell:
- Count updates
- Item shows form info + timestamp
- Click opens related submission detail
- Read state updates after view/mark-read

## 12. Edit, View, and Delete Forms

From `Form Builder` listing:

- `Edit`: Full editable builder.
- `View`: Read-only preview mode.
- `Delete`: Removes form schema + linked submissions/files (Admin only).

## 13. Permissions Summary

- `Admin`:
  - Full create/edit/delete on forms and submissions.
- `Editor`:
  - Create/edit/publish forms
  - View/mark-read submissions
  - No delete actions.
- `Author`:
  - No Form Builder/Form Submissions access.

## 14. Common Troubleshooting

### Form not visible on frontend
- Check status is `Published`.
- If `Archived`, ensure archived rendering is enabled.

### Submission blocked
- Verify required fields and validation rules.
- Check form is not `Draft`.

### File upload fails
- Check allowed file types.
- Check max size limit.

### Form not in page builder dropdown
- Refresh editor.
- Confirm form exists and is not archived (default picker hides archived forms).

### Submission columns changed
- This is expected when labels/names are edited.
- Use details view for historical/legacy values.

## 15. Recommended Admin Workflow

1. Create form as `Draft`.
2. Build fields + validation.
3. Save and test in preview page.
4. Publish form.
5. Embed via `Form Embed` block.
6. Verify one real test submission.
7. Monitor `Form Submissions` + notifications.
