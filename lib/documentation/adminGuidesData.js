/**
 * In-app admin guides, shown at /admin/documentation.
 *
 * Written for MESCO's office staff, in the voice of docs/admin-manual: plain,
 * direct, task first. Every button and field named here was checked against the
 * real admin screens, so update the guide when a screen changes, and leave out
 * anything you can't confirm exists. `npm run test:documentation` rejects
 * filler language and links to screens that don't exist.
 *
 * Inline markup: **on-screen labels** and `typed values` (see guideText.js).
 */

export const DOCUMENTATION_GROUPS = [
  {
    key: "content",
    label: "Website content",
    guides: [
      "pages",
      "blogs",
      "events",
      "faqs",
      "components"
    ]
  },
  {
    key: "design",
    label: "Look and navigation",
    guides: [
      "menus",
      "appearance-header",
      "appearance-header-ribbon",
      "appearance-footer",
      "sliders"
    ]
  },
  {
    key: "visitors",
    label: "Visitor features",
    guides: [
      "form-builder",
      "popups",
      "push-notifications",
      "chatbot",
      "social-wall"
    ]
  },
  {
    key: "library",
    label: "Photos and people",
    guides: [
      "media",
      "gallery",
      "team",
      "testimonials"
    ]
  },
  {
    key: "admin",
    label: "Running the admin",
    guides: [
      "dashboard",
      "submissions",
      "settings",
      "users",
      "rbac"
    ]
  }
];

export const COMMON_TASKS = [
  {
    label: "Publish a page",
    guide: "pages",
    section: "Publishing a page"
  },
  {
    label: "Add a page to the menu",
    guide: "menus",
    section: "Adding a page to the menu"
  },
  {
    label: "Change the homepage slides",
    guide: "sliders",
    section: "Changing the slides"
  },
  {
    label: "Write a blog post",
    guide: "blogs",
    section: "Writing a new post"
  },
  {
    label: "Add an event",
    guide: "events",
    section: "Adding an event"
  },
  {
    label: "Collect RSVPs for an event",
    guide: "events",
    section: "Collecting replies with RSVP"
  },
  {
    label: "Upload a photo or PDF",
    guide: "media",
    section: "Uploading files"
  },
  {
    label: "Export submissions",
    guide: "submissions",
    section: "Exporting a list"
  },
  {
    label: "Add a staff account",
    guide: "users",
    section: "Adding a user"
  }
];

export const ADMIN_MODULE_GUIDES = [
  {
    id: "pages",
    aliases: [
      "page-publishing",
      "page-builder"
    ],
    title: "Pages",
    adminRoute: "/admin/pages",
    summary: "Create, edit, publish and delete the pages of the website.",
    whereManaged: "In the left menu, click **Pages**.",
    sections: [
      {
        title: "Editing a page that already exists",
        steps: [
          "In the **Pages** list, click **Edit** next to the page. If the list is long, type in **Search pages...** first.",
          "Click a block to select it, then click the pencil icon on the block.",
          "Make your changes in the panel that opens.",
          "Click **Update** or **Apply** at the top of the panel.",
          "Click **Save** at the top of the screen. **Update** and **Apply** only change the screen you're looking at. Nothing is stored until you click **Save**."
        ]
      },
      {
        title: "Adding, moving and removing blocks",
        steps: [
          "Open the page and click **Add Component**. To add a block in a particular spot, click the small plus button between two blocks instead.",
          "Find the block in the panel, using **Search components...** if you need to, and click it.",
          "To move a block, drag it up or down. You can also click **Layers** and drag it in that list.",
          "To copy or remove a block, click it, then use the **Duplicate** or **Delete** icon on the block.",
          "Click **Save**."
        ]
      },
      {
        title: "Creating a new page",
        steps: [
          "On the **Pages** screen, click **Add page**. The **New Page** screen opens.",
          "Click **Page Settings**, then open the **Page settings** section in the panel.",
          "Type the **Title** as it should appear on the site, for example `Annual Report 2025`.",
          "Check the **Slug**. It fills in from the title and becomes the page's address. It can only use lowercase letters, numbers and hyphens, so a slash won't work.",
          "To put the page inside a section of the site, choose that section in **Parent Menu**. The panel shows the full address, for example `/media/annual-report-2025`. Leave it empty for a top-level page.",
          "Leave **Status** as **Draft** for now.",
          "Close the panel and add your content with **Add Component**.",
          "Click **Save**. You'll see **Page created** and the page stays open for more editing."
        ]
      },
      {
        title: "Publishing a page",
        paragraph: "The page goes online the moment you save it as **Published**. There's nothing else to press.",
        steps: [
          "In the **Pages** list, click **Edit** next to the page.",
          "Click **Page Settings**, then open the **Page settings** section.",
          "Change **Status** from **Draft** to **Published**.",
          "Click **Update** at the top of the panel."
        ]
      },
      {
        title: "Taking a page offline again",
        paragraph: "The page disappears from the website but nothing is lost. Set it back to **Published** to bring it back. If the page is in a menu, the link stays there and leads to a not-found page, so remove it under **Appearance** then **Menu**.",
        steps: [
          "In the **Pages** list, click **Edit** next to the page.",
          "Click **Page Settings**, then open the **Page settings** section.",
          "Change **Status** from **Published** to **Draft**.",
          "Click **Update**."
        ]
      },
      {
        title: "Changing a page's address",
        paragraph: "Menus follow the change, and the old address redirects to the new one, so existing links keep working.",
        steps: [
          "In the **Pages** list, click **Edit** next to the page.",
          "Click **Page Settings**, then open the **Page settings** section.",
          "Change the **Slug**, the **Parent Menu**, or both.",
          "Click **Update**. A message shows the old and new address.",
          "If a yellow warning appears, read it. It says what couldn't be moved or which menu to check under **Appearance** then **Menu**."
        ]
      },
      {
        title: "Deleting a page",
        steps: [
          "In the **Pages** list, click **Delete** next to the page.",
          "In the **Delete page?** box, click **Delete**."
        ]
      }
    ],
    tables: [
      {
        title: "Draft and Published",
        subtitle: "Every page has one of these two statuses. You set it in **Page Settings**.",
        headers: [
          "Status",
          "What it means"
        ],
        rows: [
          [
            "**Draft**",
            "The page is saved but isn't on the website. Anyone who opens its address gets a not-found page."
          ],
          [
            "**Published**",
            "The page is live for everyone. Saving with this status is what puts it online."
          ]
        ]
      }
    ],
    callouts: [
      {
        type: "warning",
        text: "A deleted page can't be restored, and it's removed from every menu too. If you only want it out of the way for a while, set it to **Draft** instead."
      }
    ],
    keepInMind: [
      "Publishing a page doesn't add it to the navigation. Do that under **Appearance** then **Menu**.",
      "On an existing page, changing the **Title** also rewrites the **Slug**, unless you've typed in the **Slug** box yourself. Check the **Slug** before you save.",
      "**Preview** opens the page's public address in a new tab, so it shows what was last saved. On a **Draft** page you'll get a not-found page.",
      "The homepage is the page with the slug `home`. Don't change that slug.",
      "If you leave the screen before clicking **Save**, your changes are gone."
    ]
  },
  {
    id: "blogs",
    aliases: [
      "news",
      "blog-posts"
    ],
    title: "Blogs",
    adminRoute: "/admin/blogs",
    summary: "Write, review and publish blog posts, and look after categories and reader comments.",
    whereManaged: "In the left menu, open **Blogs**. Inside are **View All Posts**, **Add Post**, **Categories** and **Comments**.",
    sections: [
      {
        title: "Writing a new post",
        steps: [
          "In the left menu, go to **Blogs** then **Add Post**.",
          "Type the **Title**. The **Slug** fills in from it and becomes the post's address, for example `/blog/your-post-title`.",
          "Pick a **Category** and add **Tags** if you want them. Press Enter after each tag.",
          "Write a **Short description**, then the full post in **Description**.",
          "Under **Featured Images**, add a **Desktop Image**. It must be exactly 1200 × 1000 px or the form won't save. The **Mobile Image** is optional.",
          "To control how the post looks when shared on social media, fill in **Meta title** and **Meta description**.",
          "Click **Create**. The post is saved as a draft and **Edit Post** opens. Admins can flip the **Status** switch at the top to **Published** before clicking **Create**, and the post goes live straight away."
        ]
      },
      {
        title: "Publishing a post",
        paragraph: "Only Admin and Super Admin accounts can publish.",
        steps: [
          "In **View All Posts**, click **Edit** next to the post.",
          "If you've changed anything, click **Save Changes** first. Changing the status reloads the post and drops anything you haven't saved.",
          "In the **Status** dropdown at the top, choose **Published**. The post goes live right away."
        ]
      },
      {
        title: "Editing a post",
        steps: [
          "In **View All Posts**, click **Edit** next to the post. You can search by title, slug or creator, or filter by status and category.",
          "Make your changes.",
          "Click **Save Changes**. If the post is live, the website updates when you save."
        ]
      },
      {
        title: "Taking a post offline",
        steps: [
          "In **View All Posts**, click **Edit** next to the post.",
          "Click **Unpublish** at the bottom of the screen. The post goes back to **Draft** and leaves the website."
        ]
      },
      {
        title: "Approving or rejecting comments",
        paragraph: "New comments wait as **Pending** and only **Approved** ones appear on the website.",
        steps: [
          "In the left menu, go to **Blogs** then **Comments**.",
          "In the **All status** filter, choose **Pending**.",
          "Click the eye icon to read a comment, then click **Approve** or **Reject**. The tick and cross icons in the row do the same thing.",
          "To remove a comment completely, click the bin icon and confirm."
        ]
      },
      {
        title: "Sending a post for review (Author accounts)",
        paragraph: "Authors can't publish. An Admin checks the post first.",
        steps: [
          "Write the post and click **Create**.",
          "On **Edit Post**, click **Submit for Review**. The post becomes **Pending Review** and you can't edit it until an Admin has looked at it.",
          "If an Admin asks for changes, you'll see their comments at the top of **Edit Post**, and a **Feedback** button in the list.",
          "Make the changes and click **Resubmit for Review**."
        ]
      },
      {
        title: "Changing a live post (Author accounts)",
        paragraph: "The website keeps showing the published version until an Admin approves your changes.",
        steps: [
          "In **View All Posts**, click **Edit Revision** next to the post.",
          "Make your changes.",
          "Click **Save Revision Draft**. The post shows **Revision Pending** in the list until an Admin approves it."
        ]
      },
      {
        title: "Reviewing a post (Admins)",
        steps: [
          "In **View All Posts**, click **Pending Review** at the top of the list.",
          "Click **Edit** next to the post and read it.",
          "Click **Approve**, **Request Changes** or **Reject**. **Request Changes** needs a comment and **Reject** needs a reason.",
          "An approved new post isn't live yet. Click **Publish Post** to put it online. An approved change to a post that's already live goes online as soon as you click **Approve**."
        ]
      },
      {
        title: "Managing categories",
        steps: [
          "In the left menu, go to **Blogs** then **Categories**.",
          "Click **Add category**, or **Edit** next to an existing one.",
          "Fill in the **Name** and **Slug**. **Description** and **Order** are optional.",
          "Click **Save**."
        ]
      },
      {
        title: "Deleting a post",
        steps: [
          "In **View All Posts**, click **Delete** next to the post.",
          "In the **Delete post?** box, click **Delete**. A deleted post can't be restored."
        ]
      }
    ],
    tables: [
      {
        title: "Post statuses",
        headers: [
          "Status",
          "What it means"
        ],
        rows: [
          [
            "**Draft**",
            "Being written or edited. Not on the website."
          ],
          [
            "**Pending Review**",
            "Sent to an Admin for approval. The author can't edit it for now."
          ],
          [
            "**Changes Requested**",
            "An Admin wants changes before approving it."
          ],
          [
            "**Approved**",
            "Cleared by an Admin and ready to publish. Not on the website yet."
          ],
          [
            "**Published**",
            "Live on the website."
          ],
          [
            "**Rejected**",
            "Turned down by an Admin. The reason shows at the top of **Edit Post**."
          ]
        ]
      }
    ],
    callouts: [
      {
        type: "warning",
        text: "In the **Status** dropdown on **Edit Post**, only **Published** does what it says. Every other option sets the post to **Draft**, which takes it off the website if it was live."
      }
    ],
    keepInMind: [
      "Editor accounts can add a post, but it stays a draft and they don't get an **Edit** button. An Admin has to finish and publish it.",
      "The **Comments enabled** switch on the **Comments** screen stops new comments across the whole site.",
      "Deleting a category doesn't delete its posts. They become uncategorized."
    ]
  },
  {
    id: "events",
    title: "Events",
    adminRoute: "/admin/events",
    summary: "Add events to the website and collect Yes, Maybe and No replies from visitors.",
    whereManaged: "In the left menu, open **Events** for **View All Events** and **Add Event**. Replies are under **Submissions** then **Event Register**.",
    sections: [
      {
        title: "Adding an event",
        steps: [
          "In the left menu, go to **Events** then **Add Event**.",
          "Type the **Title**. The **Slug** fills in from it and becomes the event's address, for example `/events/your-event-title`.",
          "Pick the start and end in **Event date & time range**.",
          "Type the **Location**, or turn on **Online event**.",
          "Write a **Short description** for listings, then the full details in **Description**.",
          "Under **Featured Images**, add a **Desktop Image**. It must be exactly 800 × 400 px or the form won't save.",
          "Turn on **Featured Event** if the event should appear in the Events Slider.",
          "If you want replies from visitors, fill in the **RSVP (Yes / Maybe / No)** card. The next section explains it. If registration happens somewhere else, paste the address into **Event / registration link** instead.",
          "Click **Create**. The event is saved as a draft and **Edit Event** opens. Admins can flip the **Status** switch at the top to **Published** before clicking **Create**, and the event goes live straight away."
        ]
      },
      {
        title: "Collecting replies with RSVP",
        paragraph: "**Enable RSVP** replaces the Register button on the event page with Yes, Maybe and No buttons. Visitors get a confirmation email with a link to change their reply.",
        steps: [
          "Open the event, or start a new one, and find the **RSVP (Yes / Maybe / No)** card.",
          "Turn on **Enable RSVP**.",
          "If seats are limited, enter the number in **Capacity**. Yes and Maybe each use a seat. No never does. Leave it empty for no limit.",
          "If replies should stop early, pick a date in **Close replies on**. Replies close on that date or when the event ends, whichever comes first.",
          "Click **Create**, or **Save Changes** on an existing event. Visitors only see the buttons once the event is **Published**."
        ]
      },
      {
        title: "Seeing who replied",
        paragraph: "The **Yes**, **Maybe**, **No** and **Seats taken** cards appear once there's at least one RSVP reply.",
        steps: [
          "In the left menu, go to **Submissions** then **Event Register**.",
          "The cards at the top show totals for all events together.",
          "To see one event, choose it in the **Event** filter. The cards change to that event, and **Seats taken** shows the capacity too, for example `12 / 50`.",
          "Use the **Reply** and **Status** filters or **Search name, email, event** to narrow the list.",
          "Click the eye icon on a row to see the full details. Rows that came from a registration form show a dash under **Reply**."
        ]
      },
      {
        title: "Freeing a seat",
        paragraph: "Setting a reply to **Cancelled** or **Waitlisted** frees its seat.",
        steps: [
          "In **Event Register**, find the reply.",
          "In the **Status** column, choose **Cancelled** or **Waitlisted**. It saves right away and you'll see **Status updated**."
        ]
      },
      {
        title: "Exporting the list",
        steps: [
          "In **Event Register**, set any filters you want.",
          "Click **Export**.",
          "Choose **Export as CSV** for the filtered list, **Export as Excel (All)** for everything, or **Custom Export** to pick the columns and dates."
        ]
      },
      {
        title: "Publishing an event",
        paragraph: "Only Admin and Super Admin accounts can publish.",
        steps: [
          "In **View All Events**, click **Edit** next to the event.",
          "If you've changed anything, click **Save Changes** first. Changing the status reloads the event and drops anything you haven't saved.",
          "In the **Status** dropdown at the top, choose **Published**. The event goes live right away."
        ]
      },
      {
        title: "Taking an event offline",
        steps: [
          "In **View All Events**, click **Edit** next to the event.",
          "Click **Unpublish** at the bottom of the screen. The event goes back to **Draft** and leaves the website."
        ]
      },
      {
        title: "Sending an event for review (Author accounts)",
        paragraph: "Authors can't publish. On a live event, the website keeps showing the published version until an Admin approves your changes.",
        steps: [
          "Add the event and click **Create**.",
          "On **Edit Event**, click **Submit for Review**. You can't edit the event until an Admin has looked at it.",
          "If an Admin asks for changes, make them and click **Resubmit for Review**."
        ]
      },
      {
        title: "Reviewing an event (Admins)",
        steps: [
          "In **View All Events**, click **Pending Review** at the top of the list.",
          "Click **Edit** next to the event and read it.",
          "Click **Approve**, **Request Changes** or **Reject**. **Request Changes** needs a comment and **Reject** needs a reason.",
          "An approved new event isn't live yet. Click **Publish Event** to put it online."
        ]
      },
      {
        title: "Deleting an event",
        steps: [
          "In **View All Events**, click **Delete** next to the event.",
          "In the **Delete event?** box, click **Delete**. A deleted event can't be restored."
        ]
      }
    ],
    tables: [
      {
        title: "Which replies use a seat",
        headers: [
          "Reply",
          "Status in Event Register",
          "Uses a seat?"
        ],
        rows: [
          [
            "Yes or Maybe",
            "**New** or **Confirmed**",
            "Yes"
          ],
          [
            "Yes or Maybe",
            "**Waitlisted** or **Cancelled**",
            "No"
          ],
          [
            "No",
            "Any",
            "No"
          ]
        ]
      }
    ],
    callouts: [
      {
        type: "warning",
        text: "In the **Status** dropdown on **Edit Event**, only **Published** does what it says. Every other option sets the event to **Draft**, which takes it off the website if it was live."
      }
    ],
    keepInMind: [
      "If someone replies again from the public form with the same email, their first reply isn't overwritten. They're emailed a link to change it instead.",
      "When an event is full, visitors can't answer Yes or Maybe, but they can still answer No.",
      "Without RSVP, the Register button only shows if **Event / registration link** is filled in, and only from the event's start until it ends.",
      "An event with no dates and no **Close replies on** date keeps taking replies until you turn off **Enable RSVP**.",
      "Editor accounts can add an event, but it stays a draft and they don't get an **Edit** button. An Admin has to finish and publish it."
    ]
  },
  {
    id: "faqs",
    title: "FAQs",
    adminRoute: "/admin/faqs",
    summary: "Add, edit and organise the questions and answers shown on the website.",
    whereManaged: "In the left menu, click **FAQs**.",
    sections: [
      {
        title: "Adding a question",
        steps: [
          "Click **Add FAQ**.",
          "Type the **Question**.",
          "Pick a **Category**.",
          "Write the **Answer**.",
          "Change **Display Order** if the question should sit higher or lower. Lower numbers come first.",
          "Leave **Status** as **Published** to put it online, or choose **Draft** to hold it back.",
          "Click **Create FAQ**."
        ]
      },
      {
        title: "Editing a question",
        steps: [
          "Find the question with **Search questions or answers...**, or the **All Categories** and **All Statuses** filters.",
          "Click **Edit** next to it.",
          "Make your changes and click **Update FAQ**."
        ]
      },
      {
        title: "Hiding or showing a question",
        steps: [
          "Find the question in the list.",
          "Click the switch in the **Status** column. Off means **Draft** and the question leaves the website. It saves right away."
        ]
      },
      {
        title: "Showing FAQs on a page",
        steps: [
          "To show every category, click the green `[shortcode=\"faqs\"]` button at the top of the screen. To show one category, click the button in the **Contextual Shortcode** column on any question in that category. It copies something like `[shortcode=\"faqs:Donations\"]`.",
          "In **Pages**, open the page and click **Add Component**.",
          "Type `short` in **Search components...** and click the short code component.",
          "Click the new block, then click the pencil icon on it.",
          "Open the **Content** section and paste into **Shortcode**.",
          "Click **Update**, then click **Save** at the top of the screen."
        ]
      },
      {
        title: "Changing the FAQ colours",
        steps: [
          "Click **Edit Colors**.",
          "Change the colours in the panel.",
          "Click **Save Colors**."
        ]
      },
      {
        title: "Deleting a question",
        steps: [
          "Click **Delete** next to the question.",
          "Click **Yes, delete**. A deleted question can't be restored."
        ]
      }
    ],
    tables: [
      {
        title: "What the FAQ form fields do",
        headers: [
          "Field",
          "What it does"
        ],
        rows: [
          [
            "**Question**",
            "The question as visitors see it. Required."
          ],
          [
            "**Category**",
            "Which group it sits in: About MESCO, Donations, Scholarships, Medical Assistance, Relief of Poverty, Volunteering, Partnerships or Contact. Required."
          ],
          [
            "**Display Order**",
            "The position in the list. Lower numbers come first."
          ],
          [
            "**Answer**",
            "The answer. You can use bold, lists and links. Required."
          ],
          [
            "**Tags / Keywords**",
            "Extra words that help visitors find the question in the FAQ search."
          ],
          [
            "**Status**",
            "**Published** is on the website. **Draft** isn't."
          ],
          [
            "**Featured**",
            "Adds a **Featured** tag in this admin list. It doesn't change anything on the website."
          ]
        ]
      }
    ],
    callouts: [],
    keepInMind: [
      "A new question is set to **Published** unless you change it, so it goes online as soon as you click **Create FAQ**.",
      "The hint under **Category** says you can type a new one, but the box only lets you pick from the list.",
      "If you delete every question, the 12 default ones come back by themselves."
    ]
  },
  {
    id: "components",
    aliases: [
      "site-components"
    ],
    title: "Components",
    adminRoute: "/admin/components",
    summary: "Lists the building blocks you can add to pages, and holds the starting content each one uses.",
    whereManaged: "In the left menu, click **Components**.",
    sections: [
      {
        title: "Changing a component's starting content",
        paragraph: "What you save here is used when someone adds this component to a page from now on. Blocks already on a page keep their own content, so change those in **Pages**.",
        steps: [
          "Find the component, using **Search components...** if you need to, and click **Edit** next to it.",
          "The next screen shows a preview. Click **Edit** at the top of that screen.",
          "Make your changes in the panel that opens.",
          "Click **Update** at the top of the panel. You'll see a saved message and the preview updates."
        ]
      },
      {
        title: "Showing a component on a page with a shortcode",
        paragraph: "A shortcode shows the component with the content saved on this screen, so it follows any change you make here later.",
        steps: [
          "Click **Copy Shortcode** next to the component. This copies something like `[shortcode=\"Subscribe\"]`.",
          "In **Pages**, open the page and click **Add Component**.",
          "Type `short` in **Search components...** and click the short code component.",
          "Click the new block, then click the pencil icon on it.",
          "Open the **Content** section and paste into **Shortcode**.",
          "Click **Update**, then click **Save** at the top of the screen."
        ]
      },
      {
        title: "Renaming a component",
        steps: [
          "Click **Edit** next to the component.",
          "Click the component's name at the top of the screen and type the new one.",
          "Press Enter, then click **Save**."
        ]
      },
      {
        title: "Adding a new component",
        paragraph: "This needs a developer. It creates an empty component, and it stays empty until someone writes the code for it.",
        steps: [
          "Click **New component**.",
          "Type the **Display name**. The **Component ID** fills in by itself and can't be changed afterwards.",
          "Turn on **Show on all pages (global)** only if the component should appear across the whole site.",
          "Click **Create**. The component's edit screen opens."
        ]
      }
    ],
    tables: [],
    callouts: [
      {
        type: "warning",
        text: "There are two save buttons on the edit screen. **Update** in the panel saves the content. **Save** at the top only saves the name. If you close the panel without clicking **Update**, your content changes are lost."
      }
    ],
    keepInMind: [
      "To put a component on a page, use **Add Component** in **Pages**. You don't need to do anything here first.",
      "**Show on all pages** says **Yes** for components that appear across the site without being added to a page. You can only set this when you create a component.",
      "Sliders and committee members aren't listed here. Sliders have their own screen under **Sliders**, and people are managed under **Team**."
    ]
  },
  {
    id: "menus",
    aliases: [
      "appearance-menu",
      "navigation-menu"
    ],
    title: "Menus",
    adminRoute: "/admin/menus",
    summary: "Build the menu shown in the website header, and control where each page sits and what its address is.",
    whereManaged: "In the left menu, go to **Appearance** then **Menu**.",
    sections: [
      {
        title: "Adding a page to the menu",
        steps: [
          "On the **Menus** screen, press **Edit** next to the menu you want. The **Menu structure** screen opens.",
          "Press **Add Menu**, the dashed button under the list. A new row called **New item** appears at the bottom, already open.",
          "Set **Type** to **Page**.",
          "Pick the page in **Page**. **Navigation Label** fills in with the page's title, so change the wording after this step, not before.",
          "Move the row to where it belongs. See Changing the order below, because this sets the page's address.",
          "Press **Save menu**. You'll see **Menu saved**."
        ]
      },
      {
        title: "Changing the order",
        paragraph: "A page's address comes from where it sits in the menu. A page called `annual-reports` under `Media` lives at `/media/annual-reports`. Move it under `About Us` and its address becomes `/about-us/annual-reports`. Any pages nested under it move too. The old address keeps working, because visitors who use it are redirected to the new one. Moving a page up or down under the same parent only changes the order. The address stays the same.",
        steps: [
          "To move a row, drag it by the handle on its left. It lands at the same level as the row above it.",
          "To make a row a sub-item of the row above, click the arrow on the far right of the row to open it, then press **Indent**.",
          "To bring a sub-item out one level, open it and press **Move up level**.",
          "Press **Save menu**. Nothing changes on the website until you do.",
          "Read the messages that appear. Every page that moved gets one showing its old and new address."
        ]
      },
      {
        title: "Renaming a menu item",
        paragraph: "The folder in a page's address comes from the **Navigation Label** of the items above it. Renaming `About Us` to `Who We Are` moves every page under it to `/who-we-are/...`. The old addresses redirect, but check you want this before you save.",
        steps: [
          "Click the arrow on the far right of the row to open it.",
          "Change **Navigation Label**.",
          "Press **Save menu**."
        ]
      },
      {
        title: "Adding a link to another website or a PDF",
        steps: [
          "Press **Add Menu**.",
          "Set **Type** to **Custom Link** for a web address, or **Modal** for a PDF.",
          "For a **Custom Link**, type the address in **URL**. For a **Modal**, press **Choose** under **PDF Link / Document** and pick the PDF.",
          "Type the wording in **Navigation Label**.",
          "Press **Save menu**."
        ]
      },
      {
        title: "Removing an item",
        paragraph: "This only takes the link out of the menu. The page itself isn't deleted and it keeps its address.",
        steps: [
          "Open the row and press **Remove**. Any sub-items under it go too.",
          "Press **Save menu**."
        ]
      },
      {
        title: "Removing several items at once",
        paragraph: "**Remove selected** only removes the rows you ticked. Sub-items you didn't tick stay in the menu.",
        steps: [
          "Tick the box on each row, or tick **Bulk Select** for all of them.",
          "Press **Remove selected**.",
          "Press **Save menu**."
        ]
      },
      {
        title: "Adding, copying or deleting a whole menu",
        paragraph: "The header shows one menu, chosen under **Appearance** then **Header**, in the **Navigation** section. If you rename or delete that menu, go back there and choose it again, otherwise the website falls back to a different menu.",
        steps: [
          "To add a menu, press **Add menu** on the **Menus** screen and type a new **Menu Name**. If the name matches an existing menu, saving replaces that menu's items.",
          "To copy a menu, press **Copy** on its row. The copy is named after the original with `(copy)` added.",
          "To rename a menu, press **Edit**, change **Menu Name** and press **Save menu**.",
          "To delete a menu, press **Delete** on its row and confirm. This can't be undone. Pages in the menu aren't deleted."
        ]
      }
    ],
    tables: [
      {
        title: "The three item types",
        headers: [
          "Type",
          "Use it for",
          "Field that appears"
        ],
        rows: [
          [
            "**Page**",
            "Any page on this website.",
            "**Page**. Pick from the list."
          ],
          [
            "**Custom Link**",
            "Another website, or a heading that only opens a dropdown.",
            "**URL**. Type the address."
          ],
          [
            "**Modal**",
            "A PDF that opens over the current page.",
            "**PDF Link / Document**. Pick a PDF."
          ]
        ]
      }
    ],
    callouts: [
      {
        type: "warning",
        text: "Dragging moves one row only. Sub-items don't travel with their parent. They stay put and attach to whatever is now above them, which can change their addresses. After moving a parent, check its sub-items before you press **Save menu**."
      }
    ],
    keepInMind: [
      "Publishing a page doesn't add it to the menu. You have to add it here.",
      "If a new address is already taken, you'll see a warning that items could not change address. No page moves in that save, and the menu links keep pointing at the existing pages.",
      "Use **Page** rather than **Custom Link** for pages on this website. A **Page** item follows the page when its address changes. A typed address doesn't.",
      "The **Page** list includes drafts. A link to a draft gives visitors a page not found error until the page is published.",
      "The footer doesn't use this screen. Its links are under **Appearance** then **Footer**."
    ]
  },
  {
    id: "appearance-header",
    aliases: [
      "header"
    ],
    title: "Header",
    adminRoute: "/admin/appearance/header",
    summary: "Change the logo, the menu and the buttons that sit at the top of every page of the website.",
    whereManaged: "In the left menu, go to **Appearance** then **Header**.",
    sections: [
      {
        title: "Making any change to the header",
        paragraph: "The main screen shows a preview of the header. All the settings are in a panel that slides in from the right.",
        steps: [
          "Press **Edit** at the top right. The **Edit Header** panel opens.",
          "Click a section to open it, for example **Logo** or **Membership Button**.",
          "Make your change. The preview behind the panel updates as you go.",
          "Press **Update** at the top of the panel. You'll see **Header saved** and the change is live."
        ]
      },
      {
        title: "Changing the logo",
        paragraph: "Keep **Logo type** on **Image**. If you set it to **Site title**, the logo is replaced by the site's name as plain text.",
        steps: [
          "Press **Edit** and open **Logo**.",
          "Under **Desktop logo**, press **Replace** and pick an image from the Media Library.",
          "Do the same under **Tablet/mobile logo**. If you leave this one empty, phones and tablets use the desktop logo.",
          "Press **Update**."
        ]
      },
      {
        title: "Choosing which menu the header shows",
        paragraph: "This only decides which menu the header uses. The links inside it are edited under **Appearance** then **Menu**.",
        steps: [
          "Press **Edit** and open **Navigation**.",
          "Pick the menu in **Menu**.",
          "Press **Update**."
        ]
      },
      {
        title: "Changing or hiding the Membership button",
        steps: [
          "Press **Edit** and open **Membership Button**.",
          "To hide the button, turn off **Show Membership button**.",
          "To change the wording, edit **Membership label**.",
          "To change where it goes, pick a page in **Select internal page** and **Membership URL** fills in. You can also type it yourself, for example `/membership` or a full `https://` address.",
          "Press **Update**."
        ]
      },
      {
        title: "Changing or hiding the Volunteer and Donate buttons",
        paragraph: "These two have no on/off switch. If the URL is empty, the button disappears from the header.",
        steps: [
          "Press **Edit** and open **Volunteer Button** or **Donate Button**.",
          "Change the wording in **Volunteer label** or **Donate label**.",
          "Change the address in **Volunteer URL** or **Donate URL**, or clear it to hide the button.",
          "Press **Update**."
        ]
      },
      {
        title: "Changing or hiding the Search button",
        steps: [
          "Press **Edit** and open **Search**.",
          "Turn **Show Search button** on or off.",
          "Change **Button label** for the wording on the button, and **Input placeholder** for the hint inside the search box.",
          "Press **Update**."
        ]
      }
    ],
    tables: [
      {
        title: "What's in each section of the panel",
        headers: [
          "Section",
          "What it changes"
        ],
        rows: [
          [
            "**Logo**",
            "The desktop and mobile logos, and where the logo links to."
          ],
          [
            "**Navigation**",
            "Which menu the header shows."
          ],
          [
            "**Search**",
            "The Search button, its colors, and the messages visitors see while searching."
          ],
          [
            "**Membership Button**",
            "Whether the button shows, its wording, link and colors."
          ],
          [
            "**Volunteer Button**",
            "The button's wording, link, icon and colors."
          ],
          [
            "**Donate Button**",
            "The button's wording, link, icon and colors."
          ],
          [
            "**Colors**",
            "**Navigation background**, **Menu text color** and two button border colors."
          ],
          [
            "**Responsive Buttons**",
            "Colors of the round Volunteer and Donate buttons on phones and tablets."
          ]
        ]
      }
    ],
    callouts: [
      {
        type: "warning",
        text: "**Update** inside the panel is what saves your work. The **Save** button on the main screen doesn't save panel changes, and closing the panel without pressing **Update** loses them."
      }
    ],
    keepInMind: [
      "The preview on this screen shows the menu as it was when you last pressed **Update** here. The live website always uses the latest menu, so check the website itself after a menu change.",
      "The notice strip above the header has its own screen, **Appearance** then **Header Ribbon**."
    ]
  },
  {
    id: "appearance-header-ribbon",
    aliases: [
      "header-ribbon",
      "ribbon"
    ],
    title: "Header Ribbon",
    adminRoute: "/admin/appearance/header-ribbon",
    summary: "Show short notices in the thin strip above the header, with a link beside each one.",
    whereManaged: "In the left menu, go to **Appearance** then **Header Ribbon**.",
    sections: [
      {
        title: "Changing a notice",
        steps: [
          "Press **Edit** at the top right. The **Edit Header Ribbon** panel opens.",
          "Open **Content**, then click the notice you want to change.",
          "Edit **Notice Text**. This is the wording visitors read.",
          "Edit **Link Text**, for example `View Notice`, and **URL**, for example `/get-involved/notices`.",
          "Press **Update** at the top of the panel. You'll see **Header Ribbon saved** and the change is live."
        ]
      },
      {
        title: "Adding another notice",
        paragraph: "One notice sits still in the strip. With two or more, the strip scrolls, and it pauses when a visitor points at it.",
        steps: [
          "Press **Edit** and open **Content**.",
          "Press **Add item**.",
          "Fill in **Notice Text**, **Link Text** and **URL**. All three are required.",
          "Press **Update**."
        ]
      },
      {
        title: "Reordering or removing notices",
        paragraph: "The bin icon doesn't show when only one notice is left. To take the last one down, hide the ribbon instead.",
        steps: [
          "Press **Edit** and open **Content**.",
          "Drag a notice by the handle on its left, or use the up and down arrows.",
          "To remove a notice, press its bin icon.",
          "Press **Update**."
        ]
      },
      {
        title: "Hiding the ribbon",
        paragraph: "Your notices stay saved, so you can switch the ribbon back on later without typing them again.",
        steps: [
          "Press **Edit** and open **Ribbon Settings**.",
          "Turn off **Display Header Ribbon**.",
          "Press **Update**."
        ]
      },
      {
        title: "Changing the colors",
        steps: [
          "Press **Edit** and open **Colors**.",
          "Pick a color for **Background**, **Notice text**, **Link text** or any of the other items listed.",
          "Press **Update**."
        ]
      }
    ],
    tables: [
      {
        title: "What's in Ribbon Settings",
        headers: [
          "Setting",
          "What it does"
        ],
        rows: [
          [
            "**Display Header Ribbon**",
            "Shows or hides the whole ribbon."
          ],
          [
            "**Display View Notice link**",
            "Shows or hides the link beside every notice."
          ],
          [
            "**Show notice icon**",
            "Shows the small icon before the notice."
          ],
          [
            "**Show link arrow**",
            "Shows the arrow after the link."
          ],
          [
            "**Scrolling Direction**",
            "Which way the strip scrolls. Only matters with two or more notices."
          ],
          [
            "**Marquee Speed**",
            "How fast the strip scrolls. A higher number is faster. Only matters with two or more notices."
          ],
          [
            "**Accessible label**",
            "Read out by screen readers. Visitors don't see it."
          ]
        ]
      }
    ],
    callouts: [
      {
        type: "warning",
        text: "**Update** inside the panel is what saves your work. The **Save** button on the main screen doesn't save panel changes."
      }
    ],
    keepInMind: [
      "A notice stays on one line. On a phone a long single notice gets cut off, so keep the wording short.",
      "**Notice Text** is plain text. Only **Link Text** is clickable."
    ]
  },
  {
    id: "appearance-footer",
    aliases: [
      "footer"
    ],
    title: "Footer",
    adminRoute: "/admin/appearance/footer",
    summary: "Edit the logo, contact details, link columns, social icons and legal links at the bottom of every page.",
    whereManaged: "In the left menu, go to **Appearance** then **Footer**.",
    sections: [
      {
        title: "Updating the address, phone or email",
        paragraph: "Anything you leave empty is hidden from the footer.",
        steps: [
          "Press **Edit** at the top right. The **Edit Footer** panel opens.",
          "Open **Contact**.",
          "Change **Address**, **Email** or **Phone**.",
          "Press **Update** at the top of the panel. You'll see **Footer saved** and the change is live."
        ]
      },
      {
        title: "Adding the WhatsApp number",
        paragraph: "The number shows in the Contact column as a link that opens a WhatsApp chat in a new tab. A 10-digit number is treated as an Indian number, so `91` is added to the link for you. For any other country, type the number with its country code. Leave the field empty to hide it.",
        steps: [
          "Press **Edit** and open **Contact**.",
          "Type the number in **WhatsApp number**, for example `+91 98765 43210`.",
          "Press **Update**."
        ]
      },
      {
        title: "Changing the footer links",
        paragraph: "These links are typed here by hand. They don't come from the **Menu** screen, so changing a menu won't change the footer.",
        steps: [
          "Press **Edit** and open **Link Column 1** or **Link Column 2**.",
          "Change the column heading in **Title** if you need to.",
          "To add a link, press **Add link**, then fill in **Label** and **URL**.",
          "To reorder links, drag them by the handle or use the up and down arrows. To remove one, press its bin icon.",
          "Press **Update**."
        ]
      },
      {
        title: "Adding or changing social media icons",
        paragraph: "The icons show under the logo and description.",
        steps: [
          "Press **Edit** and open **Social Links**.",
          "Press **Add social link**, or click an existing one to change it.",
          "Pick the **Platform** and paste the profile address into **URL**.",
          "Press **Update**."
        ]
      },
      {
        title: "Changing the copyright line and legal links",
        paragraph: "If **Privacy URL** or **Refund URL** is empty, that link is hidden.",
        steps: [
          "Press **Edit** and open **Copyright & Legal Links**.",
          "Edit **Copyright text**.",
          "Change **Privacy label** and **Privacy URL**, or **Refund label** and **Refund URL**.",
          "Press **Update**."
        ]
      }
    ],
    tables: [
      {
        title: "What's in each section of the panel",
        headers: [
          "Section",
          "What it changes"
        ],
        rows: [
          [
            "**Brand**",
            "The footer logo, where it links to, and the **Organisation description** under it."
          ],
          [
            "**Contact**",
            "The column heading, address, email, phone and WhatsApp number."
          ],
          [
            "**Link Column 1**",
            "The first column of links. Hidden if it has no links."
          ],
          [
            "**Link Column 2**",
            "The second column of links. Hidden if it has no links."
          ],
          [
            "**Social Links**",
            "The social media icons."
          ],
          [
            "**Copyright & Legal Links**",
            "The copyright line, and the privacy and refund links."
          ],
          [
            "**Background & Colors**",
            "Background color or image, text colors and border colors."
          ]
        ]
      }
    ],
    callouts: [
      {
        type: "warning",
        text: "**Update** inside the panel is what saves your work. The **Save** button on the main screen doesn't save panel changes, and closing the panel without pressing **Update** loses them."
      }
    ],
    keepInMind: [
      "The bin icon doesn't show on the last row of a list, so you can't empty a link column or the social links from here.",
      "For a link to another website, type the full address starting with `https://`."
    ]
  },
  {
    id: "sliders",
    aliases: [
      "home-slider",
      "homepage-slider"
    ],
    title: "Sliders",
    adminRoute: "/admin/sliders",
    summary: "Change the slides in the four sliders used on the website, and control how each one moves.",
    whereManaged: "In the left menu, go to **Sliders**.",
    sections: [
      {
        title: "Changing the slides",
        steps: [
          "On the **Sliders** screen, press **Edit** on the row for your slider.",
          "On the next screen, press **Edit** at the top right. A panel opens.",
          "Open **Manage Slides** for the Home Slider, **Manage Images** for the Circular Slider, or **Manage Stories** for the Stories Slider.",
          "Click a slide to open it and change its image or text. To add one, press **Add slide**, or **Add story** on the Stories Slider.",
          "To reorder, drag a slide by its handle or use the up and down arrows. To remove one, press its bin icon.",
          "Press **Update** at the top of the panel. You'll see a saved message."
        ]
      },
      {
        title: "Turning off one slide in the Home Slider",
        paragraph: "The slide stays saved, so you can bring it back later. Leave at least one slide on, otherwise visitors see a box that says **No active slides.**",
        steps: [
          "Open the Home Slider's panel, then **Manage Slides**.",
          "Open the slide and turn off **Active** under **Status & Background**.",
          "Press **Update**."
        ]
      },
      {
        title: "Choosing what the Events Slider shows",
        paragraph: "You don't add slides to this one. It shows published events with **Featured Event** turned on, so that switch on the event itself decides what appears.",
        steps: [
          "Open the Events Slider's panel, then **Slider Settings**.",
          "Set **Number of slides** and **Event order**.",
          "Press **Update**."
        ]
      },
      {
        title: "Changing how a slider moves",
        paragraph: "Times are in milliseconds, so `6000` means 6 seconds.",
        steps: [
          "Open the slider's panel, then **Slider Settings**.",
          "Turn **Autoplay** on or off and change the other switches listed there.",
          "Change the delay in **Autoplay delay (ms)**. On the Circular Slider this is **Auto interval (ms)**.",
          "Press **Update**."
        ]
      },
      {
        title: "Hiding a slider",
        paragraph: "The **Status** switch on the **Sliders** screen doesn't take a slider off the website. Turning it off only stops that slider being offered under **Add Component** in the Page Builder. Pages already showing the slider keep showing it. To take a slider off a page, delete its block from that page. If it's a **ShortCode** block, the slides stay safe on the **Sliders** screen. If it's a normal slider block, that block's copy of the slides is deleted with it.",
        steps: [
          "Go to **Pages** and open the page.",
          "Find the slider's block and press its **Delete** icon, then confirm with **Delete**.",
          "Press **Save** on the page."
        ]
      },
      {
        title: "Why a page might not change after you edit a slider",
        paragraph: "A slider gets onto a page in one of two ways. A **ShortCode** block holds a short piece of text such as `[shortcode=\"HomeSlider\"]` and shows whatever is saved on the **Sliders** screen. A normal slider block, added from **Add Component**, copies the slides when it's added and keeps its own copy from then on. Changes on the **Sliders** screen don't reach a normal block. To change one of those, open the page in **Pages**, edit the block there, and press **Save**."
      },
      {
        title: "Showing a slider on another page",
        paragraph: "Use a **ShortCode** block when the same slider belongs on more than one page, so you only edit it in one place. Don't put a **ShortCode** block and a normal block for the same slider on one page, or it shows twice.",
        steps: [
          "Open the page in **Pages** and press **Add Component**.",
          "Add a **ShortCode** block.",
          "Edit the block and type the code in **Shortcode**, using the Component ID from the table, for example `[shortcode=\"HomeSlider\"]`.",
          "Press **Update**, then press **Save** on the page."
        ]
      }
    ],
    tables: [
      {
        title: "The sliders available",
        headers: [
          "Slider",
          "Component ID",
          "What it holds"
        ],
        rows: [
          [
            "Home Slider",
            "`HomeSlider`",
            "Large slides with an image or video, headings and buttons."
          ],
          [
            "Circular Slider",
            "`ImageSlider`",
            "Images only. Each desktop image must be exactly 350 × 450 px."
          ],
          [
            "Stories Slider",
            "`StoriesSlider`",
            "Quotes with a name, role and photo. Each desktop image must be exactly 800 × 415 px."
          ],
          [
            "Events Slider",
            "`EventsSlider`",
            "Published events marked **Featured Event**."
          ]
        ]
      }
    ],
    callouts: [
      {
        type: "warning",
        text: "**Update** inside the panel is what saves your slides. The **Save** button on the screen behind it only saves the slider's name and placement settings."
      }
    ],
    keepInMind: [
      "The Circular and Stories sliders refuse a desktop image that isn't the exact size shown under the field. For the Home Slider, use at least 1440 × 900 px.",
      "Mobile images are optional. Without one, the slider uses the desktop image."
    ]
  },
  {
    id: "form-builder",
    aliases: [
      "forms"
    ],
    title: "Form Builder",
    adminRoute: "/admin/form-builder",
    summary: "Build your own forms, put them on website pages, and read what people send in.",
    whereManaged: "In the left menu, click **Form Builder**.",
    sections: [
      {
        title: "Creating a form",
        steps: [
          "Click **Create Form**, type a name and click **Create**. The editor opens with one empty section.",
          "Click **Add Question**.",
          "Fill in **Label**, which is the question visitors see, and pick a **Type**.",
          "Change **Field name** to something short and readable, like `full_name`.",
          "Turn on **Required** if the question must be answered.",
          "For **Single Choice** and **Multiple Choice**, type your answers under **Options**. Click **Add option** for more.",
          "Repeat for each question. To split a long form into parts, click **Add Section**.",
          "Click **Save**."
        ]
      },
      {
        title: "Publishing a form",
        paragraph: "A new form is a draft. Visitors can't use it until it's published.",
        steps: [
          "Click **Save** first. Publishing doesn't save unsaved changes.",
          "Click **Status Action**, then **Publish**."
        ]
      },
      {
        title: "Adding a form to a page",
        steps: [
          "Open the page under **Pages**.",
          "Click **Add Component**, search for `Form Embed` and add it.",
          "Click the **Edit** icon on the block.",
          "Choose your form under **Select Form**.",
          "Click **Update**, then click **Save** on the page."
        ],
        paragraph: "These steps use the Form Embed component. The other way is a shortcode, which is a short piece of text, like `[shortcode=\"volunteer-form\"]`, that tells a page which form to show. Click the copy icon in the **Shortcode** column of the form list, then paste it into a Short Code block on the page."
      },
      {
        title: "Changing a published form",
        paragraph: "There's no separate step to republish. When you click **Save**, the changes appear on the website.",
        steps: [
          "Click **Edit** on the form's row in the list.",
          "Make your changes.",
          "Click **Save**."
        ]
      },
      {
        title: "Changing the submit button, thank-you message or captcha",
        steps: [
          "In the form editor, click **Edit** at the top.",
          "Change what you need under **Form Title**, **Submission Settings**, **Captcha** or **Colors**.",
          "Click **Update** to close the panel.",
          "Click **Save** at the top of the editor."
        ]
      },
      {
        title: "Reading submissions",
        paragraph: "No email is sent when someone submits a form. New submissions show up under the bell at the top of the admin.",
        steps: [
          "In the form list, click **Submissions** on the form's row.",
          "Click **View** to read one. Opening it marks it as read.",
          "To narrow the list, use the search box, the **All**, **Unread** and **Read** filter, or the date boxes."
        ]
      },
      {
        title: "Exporting submissions",
        steps: [
          "On the submissions screen, click **Export**.",
          "Choose an option. The table on this page explains each one. For **Custom Export**, pick your **Columns** and **Date Range**, then click **Export**."
        ]
      },
      {
        title: "Taking a form off the website",
        steps: [
          "Open the form in the editor.",
          "Click **Status Action**, then **Unpublish**. The form goes back to draft and you can publish it again later."
        ],
        paragraph: "After this, the block stays on the page and shows a warning where the form was, so remove the block from the page as well."
      },
      {
        title: "Deleting a form",
        paragraph: "You can only delete a form that has never had a submission. Deleting its submissions doesn't change this.",
        steps: [
          "Click the delete icon on the form's row.",
          "Click **Delete** to confirm."
        ]
      }
    ],
    tables: [
      {
        title: "Question types",
        headers: [
          "Type",
          "Use it for"
        ],
        rows: [
          [
            "**Short Text**",
            "A one-line answer."
          ],
          [
            "**Paragraph**",
            "A longer answer."
          ],
          [
            "**Email**, **Number**, **Mobile / Phone**, **URL**, **Date**",
            "Answers of that kind."
          ],
          [
            "**Single Choice**",
            "Picking one option."
          ],
          [
            "**Multiple Choice**",
            "Picking several options."
          ],
          [
            "**File Upload**",
            "Attaching a file, up to 5 MB."
          ],
          [
            "**Hidden**",
            "A field visitors don't see."
          ],
          [
            "**Divider**",
            "A heading and line between questions. Not a question."
          ]
        ]
      },
      {
        title: "Form statuses",
        headers: [
          "Status",
          "What visitors see"
        ],
        rows: [
          [
            "**published**",
            "The form, ready to fill in."
          ],
          [
            "**draft**",
            "A warning saying `Form not found or not published`."
          ],
          [
            "**archived**",
            "The same warning, and you can't undo it from this screen."
          ]
        ]
      },
      {
        title: "Export options",
        headers: [
          "Option",
          "What you get"
        ],
        rows: [
          [
            "**Export as CSV**",
            "The submissions matching your current filters."
          ],
          [
            "**Export as Excel (All)**",
            "Every submission."
          ],
          [
            "**Custom Export**",
            "An Excel file with only the columns and dates you choose."
          ]
        ]
      }
    ],
    callouts: [
      {
        type: "warning",
        text: "**Update** in the settings panel doesn't save anything. Your changes are lost unless you also click **Save** in the editor."
      },
      {
        type: "warning",
        text: "Archiving can't be undone from this screen. Once a form is archived, **Unpublish** is greyed out and **Publish** gives an error. If you might need the form again, use **Unpublish** instead."
      }
    ],
    keepInMind: [
      "**Field name** is the label you'll see beside each answer in **Submission Detail**. A new question starts as `question`, `question_2` and so on, which is hard to read later. Exports use the **Label** instead.",
      "If you turn off **Success notify**, visitors get no thank-you message at all, because that pop-up is the only place it shows.",
      "**Preview** only lists your sections and questions. To see the real form, look at the page it's on.",
      "A form's shortcode can't be changed after the form is created.",
      "By default, Editors can read submissions but **Export** is locked for them."
    ]
  },
  {
    id: "popups",
    title: "Popups",
    adminRoute: "/admin/popups",
    summary: "Create popups that open over chosen pages of the website, showing an image, a form, or both.",
    whereManaged: "In the left menu, go to **Popups**.",
    sections: [
      {
        title: "Creating a popup",
        steps: [
          "Press **Add Popup**, type a **Popup name** and press **Create Popup**. It's added to the list as a draft.",
          "Press **Edit** on its row, then **Edit** again at the top right of the next screen. A panel opens.",
          "Open **Target Pages** and choose the pages in **Show popup on**. A new popup starts with **Home / Landing**.",
          "Open **Popup Content**. Press **Choose** under **Popup image** and pick an image that's exactly 600 × 600 px.",
          "To show a form, paste its Form Builder shortcode into **Shortcode**, for example `[shortcode=\"form-name\"]`.",
          "To make the image clickable, open **Redirect Link**, turn on **Enable popup redirect link**, then fill in **Popup URL** and **Link Target**.",
          "Press **Update** at the top of the panel. You'll see **Popup settings saved**.",
          "Press **Publish** at the top of the screen. The popup is now live on the pages you chose."
        ]
      },
      {
        title: "Editing a popup",
        paragraph: "If the popup is already published, your changes go live as soon as you press **Update**. You don't need to publish it again.",
        steps: [
          "Press **Edit** on its row, then **Edit** again at the top right.",
          "Make your changes.",
          "Press **Update** at the top of the panel."
        ]
      },
      {
        title: "Taking a popup down",
        paragraph: "Either button below stops the popup showing, and both keep its settings.",
        steps: [
          "On the **Popups** screen, press **Disable** or **Unpublish** on its row.",
          "To bring it back, press **Enable** or **Publish**."
        ]
      },
      {
        title: "Deleting a popup",
        paragraph: "A deleted popup can't be restored. **Marketing Popup** is a system popup and can't be deleted, so disable it instead.",
        steps: [
          "Press **Delete** on its row.",
          "Press **Delete** again to confirm."
        ]
      }
    ],
    tables: [
      {
        title: "When a popup shows",
        subtitle: "A popup needs both of these before visitors see it.",
        headers: [
          "Publish",
          "Enabled",
          "On the website"
        ],
        rows: [
          [
            "**Published**",
            "**Enabled**",
            "Shows on its target pages."
          ],
          [
            "**Published**",
            "**Disabled**",
            "Hidden."
          ],
          [
            "**Draft**",
            "**Enabled** or **Disabled**",
            "Hidden."
          ]
        ]
      },
      {
        title: "What's in Behavior",
        headers: [
          "Setting",
          "What it does"
        ],
        rows: [
          [
            "**Re-show behavior**",
            "**Always show on matched page visits** brings the popup back each time the visitor returns to the page. **Hide after close until browser is closed (session)** keeps it closed until they close their browser."
          ],
          [
            "**Priority (lower shows first)**",
            "If two popups target the same page, the lower number opens first. The other opens when the first is closed."
          ],
          [
            "**Animation duration (ms)**",
            "How long the popup takes to open and close."
          ],
          [
            "**Modal width**",
            "**Small**, **Medium**, **Large**, **Full Width** or **Custom**."
          ]
        ]
      }
    ],
    callouts: [
      {
        type: "warning",
        text: "The live popup shows only the image and the form. **Title** and **Description** appear in the preview here but not on the website, so put any wording visitors need into the image. The one exception is a popup with the Component ID `ModalForm`, which shows them above its form."
      }
    ],
    keepInMind: [
      "A popup opens only on the exact pages you chose. Sub-pages aren't included, and blog posts and events aren't in the list.",
      "If a page moves in the menu, its address changes and the popup stops matching it. Open the popup and choose the page again in **Target Pages**.",
      "Turning off **Auto-open on page load** stops the popup opening at all. Nothing else on the website opens it.",
      "Leave **Allow manual close** on. With it off there's no close button and visitors can't dismiss the popup.",
      "A popup with no image and no form opens as an empty box."
    ]
  },
  {
    id: "push-notifications",
    title: "Push Notifications",
    adminRoute: "/admin/push-notifications",
    summary: "Send short alerts to the browsers of visitors who have allowed notifications from the MESCO website.",
    whereManaged: "In the left menu, click **Push Notifications**.",
    sections: [
      {
        title: "Sending a notification",
        steps: [
          "Check **Active Subscribers** at the top. If it says 0, nobody will get your notification.",
          "Click **Create Notification**.",
          "Fill in **Notification Title** (up to 120 characters) and **Notification Message** (up to 300).",
          "Pick a **Notification Type**.",
          "In **Click URL (Destination)**, enter the page that opens when someone clicks, like `/events/annual-meet`.",
          "Add an image under **Notification Image / Banner (Optional)** if you want one.",
          "Click **Send Now**, then **Send Now** again in the box that pops up. It goes out straight away to every active subscriber and can't be called back."
        ]
      },
      {
        title: "Saving a draft and sending it later",
        steps: [
          "Fill in the notification and click **Save as Draft**.",
          "To change the draft, click the edit icon on its row, make your changes and click **Save as Draft**.",
          "When you're ready, click **Send** on its row in the table, then **Send** in the box that pops up."
        ]
      },
      {
        title: "Checking how a send went",
        steps: [
          "Look at the **Delivery Stats** column. `45 / 50` means 45 of the 50 sends were delivered.",
          "Click **Details** on the row for the full numbers."
        ]
      },
      {
        title: "Sending something similar again",
        paragraph: "A sent notification can't be edited or sent twice, but you can copy it.",
        steps: [
          "Click the copy icon on the row. A new form opens with the same content.",
          "Delete `(Copy)` from the title, or visitors will see it.",
          "Make your changes and click **Save as Draft** or **Send Now**."
        ]
      },
      {
        title: "Changing the sign-up card",
        paragraph: "This is how visitors sign up. The card opens by itself for anyone who hasn't decided yet. If they close it, it stays closed for 30 days.",
        steps: [
          "Click **Settings**.",
          "Change **Card Title**, **Card Body Content (Description)**, **Enable Button Label** or **Dismiss Button Label**.",
          "Turn on **Show Bell Icon on Frontend** to add a bell at the bottom left of the website, so visitors can open the card at any time.",
          "Click **Save Settings**."
        ]
      }
    ],
    tables: [
      {
        title: "Notification statuses",
        headers: [
          "Status",
          "What it means"
        ],
        rows: [
          [
            "**Draft**",
            "Saved but not sent."
          ],
          [
            "**Sending**",
            "Going out now."
          ],
          [
            "**Sent**",
            "Finished. A notification sent to 0 subscribers still shows as **Sent**."
          ],
          [
            "**Failed**",
            "Nobody was reached. Click **Details** to see why, then **Retry**."
          ]
        ]
      },
      {
        title: "Delivery numbers",
        headers: [
          "Number",
          "What it means"
        ],
        rows: [
          [
            "**Targeted**",
            "Subscribers it was sent to."
          ],
          [
            "**Delivered**",
            "Handed over to the browser's notification service. This doesn't prove the person saw it."
          ],
          [
            "**Pruned Expired**",
            "Subscriptions that no longer work. They've been removed from your active count."
          ],
          [
            "**Failed**",
            "Sends that went wrong for another reason."
          ]
        ]
      }
    ],
    callouts: [
      {
        type: "warning",
        text: "Notifications reach Chrome, Edge and Firefox on Mac, Windows and Android, and Safari 16 or newer on Mac. They can't reach iPhones or iPads at the moment, because the site has no web app manifest. Visitors only get a notification if they've allowed it in their browser."
      },
      {
        type: "warning",
        text: "To send a saved draft, use **Send** in the table. **Send Now** inside the edit panel saves your changes but doesn't send, even though the message says the broadcast is complete. If the row still says **Draft**, nothing went out."
      }
    ],
    keepInMind: [
      "There's no test send. **Send** and **Send Now** always go to every active subscriber, so check the wording first.",
      "There's no scheduling. A notification goes out when you click send.",
      "**Active Subscribers** counts browsers, not people. Someone signed up on a laptop and a phone counts twice.",
      "If a visitor blocks notifications, you can't ask them again. They have to change it in their browser settings, and the card tells them how.",
      "Deleting a sent notification only removes it from this list."
    ]
  },
  {
    id: "chatbot",
    aliases: [
      "appearance-chatbot"
    ],
    title: "Chatbot",
    adminRoute: "/admin/chatbot",
    summary: "Write the questions and answers for the chat box on the public website, and set how it looks.",
    whereManaged: "In the left menu, go to **Appearance** then **Chatbot**.",
    sections: [
      {
        title: "Adding a question",
        paragraph: "The chatbot only gives the answers you write here. It doesn't make up replies.",
        steps: [
          "Click **Add Question**. The panel on the right switches to **ADD MODE**.",
          "Type what the visitor would ask in **Question Title**.",
          "Leave **Parent Question** on **Root question (New)** to make it a top-level question.",
          "Write the reply in **Answer (Rich Text)**.",
          "Click **Create**."
        ]
      },
      {
        title: "Adding a follow-up question",
        paragraph: "Follow-ups appear as buttons under the parent question's answer.",
        steps: [
          "Click the parent question in the **FAQ Tree** on the left.",
          "Click **Add Child Question**. **Parent Question** is filled in for you.",
          "Fill in **Question Title** and **Answer (Rich Text)**.",
          "Click **Create**."
        ]
      },
      {
        title: "Editing a question",
        steps: [
          "Click the question in the **FAQ Tree**.",
          "Make your changes. To move it under a different question, change **Parent Question**.",
          "Click **Update**. Nothing is saved until you do."
        ]
      },
      {
        title: "Changing the order",
        steps: [
          "In the **FAQ Tree**, drag a question up or down and drop it between two others. The new order saves on its own."
        ],
        paragraph: "You can only drag between questions at the same level. To move a question to another level, change its **Parent Question** instead."
      },
      {
        title: "Hiding or deleting a question",
        paragraph: "To hide a question and keep it for later, click it and flip the switch at the top of the panel to **Inactive**. This saves straight away. To remove it for good, follow these steps.",
        steps: [
          "Click the question in the **FAQ Tree**.",
          "Click **Delete**.",
          "Choose a **Delete mode**. The table on this page explains each one.",
          "Click **Delete** in the box."
        ]
      },
      {
        title: "Helping search find a question",
        steps: [
          "Click the question in the **FAQ Tree**.",
          "Add words people might type to **Keywords**, **Search Tags** or **Synonyms**. Press Enter after each one.",
          "Click **Update**."
        ]
      },
      {
        title: "Choosing the questions on the welcome screen",
        paragraph: "Visitors see up to 8 question buttons when they open the chat: featured ones first, then popular ones, then top-level questions.",
        steps: [
          "Click **Settings**.",
          "Open **Welcome Screen**.",
          "Pick questions in **Featured Questions** and **Popular Questions**.",
          "Click **Update** at the top of the panel."
        ]
      },
      {
        title: "Setting up the Need more info? buttons",
        paragraph: "The **Need more info?** block appears when a search finds nothing, and under the answer of any question that has **Show \"Need more info?\" for this question** turned on.",
        steps: [
          "Click **Settings**.",
          "Open **Contact Actions**.",
          "Click **Add Contact Action**, or change one that's already there.",
          "Fill in **Label** and **URL**, and set **Type** to **Contact Page**.",
          "Click **Update** at the top of the panel."
        ]
      },
      {
        title: "Turning the chatbot off, or changing how it looks",
        steps: [
          "Click **Settings**.",
          "Open a section and make your changes. The table on this page lists what each one holds. To take the chat box off the website, open **General** and turn off **Enable chatbot**.",
          "Click **Update** at the top of the panel."
        ]
      }
    ],
    tables: [
      {
        title: "Delete modes",
        headers: [
          "Mode",
          "What it does"
        ],
        rows: [
          [
            "**Block delete if children exist**",
            "Stops the delete if the question has follow-ups."
          ],
          [
            "**Delete entire subtree**",
            "Deletes the question and all its follow-ups."
          ],
          [
            "**Move children to parent, then delete node**",
            "Keeps the follow-ups by moving them up one level, then deletes the question."
          ]
        ]
      },
      {
        title: "What's in Settings",
        headers: [
          "Section",
          "What you can change"
        ],
        rows: [
          [
            "**General**",
            "**Enable chatbot**, **Position** (left or right), **Font Size**, **Bot Name**, **Welcome Message**, **Welcome Subtitle**, **Avatar**."
          ],
          [
            "**Appearance**",
            "Size, spacing, colors and shadows."
          ],
          [
            "**Features**",
            "Switches for search, breadcrumb, Home and Back buttons, related questions, typing animation and the contact block."
          ],
          [
            "**Search**",
            "**Minimum Search Characters**, **Maximum Search Results**, and which fields search looks in."
          ],
          [
            "**Welcome Screen**",
            "**Banner Image (Optional)**, **Featured Questions**, **Popular Questions**."
          ],
          [
            "**Contact Actions**",
            "The buttons shown in the **Need more info?** block."
          ]
        ]
      }
    ],
    callouts: [
      {
        type: "warning",
        text: "A deleted question can't be restored. If you might want it back, set it to **Inactive** instead."
      }
    ],
    keepInMind: [
      "Only actions with **Type** set to **Contact Page**, or with the word contact in the **Label**, show in the **Need more info?** block. If none match, the first enabled action shows. So a **Call** or **WhatsApp** action won't appear next to a **Contact Page** action.",
      "Turning off **Enable Related Questions** also removes the question buttons from the welcome screen, which leaves visitors with search only.",
      "The **Need more info?** block needs **Enable Contact Block** turned on under **Features**.",
      "Only Admins can open **Settings** or use **Delete**. Editors can add and change questions.",
      "**Duplicate** copies one question. **Duplicate + Children** copies it with its follow-ups."
    ]
  },
  {
    id: "social-wall",
    aliases: [
      "appearance-social-wall"
    ],
    title: "Social Wall",
    adminRoute: "/admin/social-wall",
    summary: "Bring in posts from MESCO's social accounts, approve the ones you want, and show them on the website.",
    whereManaged: "In the left menu, go to **Appearance** then **Social Wall**.",
    sections: [
      {
        title: "Approving new posts",
        paragraph: "Posts come into the admin first. A post only reaches the website once it's approved.",
        steps: [
          "Open the **Moderation** tab. It lists every post waiting for a decision.",
          "Click **Approve** to show a post on the website, or **Reject** to keep it off."
        ]
      },
      {
        title: "Changing your mind about a post",
        steps: [
          "Open the **Posts** tab.",
          "Use the filters and click **Apply** to find the post.",
          "Click **Approve** or **Reject** on its row."
        ]
      },
      {
        title: "Fetching the latest posts",
        paragraph: "After a manual sync, each platform has to wait 5 minutes before it can sync again. If you try too soon you'll see a message telling you how many seconds are left.",
        steps: [
          "On the **Dashboard** tab, click **Run Manual Sync**.",
          "Wait for the **Sync completed** message.",
          "Open the **Moderation** tab to review what came in."
        ]
      },
      {
        title: "Fetching from one platform only",
        steps: [
          "Open the **Sync** tab.",
          "Tick the platform under **Select platforms (optional)**.",
          "Click **Run Manual Sync**."
        ]
      },
      {
        title: "Showing the wall on a page",
        steps: [
          "Open the page under **Pages**.",
          "Click **Add Component**, search for `Social Wall` and add it.",
          "To change it, click the **Edit** icon on the block, make your changes under **Feed Configuration** or **Display Settings**, and click **Update**.",
          "Click **Save** on the page."
        ]
      },
      {
        title: "Connecting a platform",
        steps: [
          "Open the **Platforms** tab.",
          "On the platform's card, paste the details listed in the table on this page. The small grey text in each box tells you what goes there.",
          "Turn on **Active** and set **Mode** to **Live**.",
          "Click **Save Platforms**.",
          "Run a sync to test it. If it fails, a red message appears on the card."
        ]
      },
      {
        title: "Fixing a feed that stopped updating",
        paragraph: "The usual cause is an expired access token.",
        steps: [
          "Open the **Platforms** tab and look for a red message on the platform's card. **Last Sync** shows when it last worked.",
          "For more detail, open the **Logs** tab, choose **Sync Logs**, and read the **Error/Details** column.",
          "If the token has expired, paste a new one on the card and click **Save Platforms**.",
          "Click **Run Manual Sync** on the **Dashboard** tab."
        ]
      },
      {
        title: "Changing the wall's settings",
        steps: [
          "Open the **Settings** tab.",
          "Change what you need. The table on this page explains the main options.",
          "Click **Save Settings**."
        ]
      }
    ],
    tables: [
      {
        title: "Post statuses",
        headers: [
          "Status",
          "What it means"
        ],
        rows: [
          [
            "**Pending**",
            "Waiting in **Moderation**. Not on the website."
          ],
          [
            "**Approved**",
            "Shown on the website."
          ],
          [
            "**Rejected**",
            "Kept off the website. You can still approve it later from the **Posts** tab."
          ]
        ]
      },
      {
        title: "What each platform needs",
        headers: [
          "Platform",
          "Details to paste"
        ],
        rows: [
          [
            "Instagram",
            "**ACCESS_TOKEN** and **USER_ID**"
          ],
          [
            "Facebook",
            "**PAGE_ACCESS_TOKEN** and **PAGE_ID**. An App ID or App Secret won't fetch posts."
          ],
          [
            "YouTube",
            "**YOUTUBE_API_KEY** and **CHANNEL_ID**"
          ],
          [
            "X (Twitter)",
            "**BEARER_TOKEN** and **USER_ID**"
          ],
          [
            "LinkedIn, Pinterest, Snapchat",
            "These can't fetch posts. **Mode** is locked to **Manual-only**, and there's no screen here for adding posts by hand."
          ]
        ]
      },
      {
        title: "Main settings",
        headers: [
          "Setting",
          "What it does"
        ],
        rows: [
          [
            "**Module enabled**",
            "Turn this off and the wall stops showing posts on every page."
          ],
          [
            "**Moderation mode**",
            "**Manual Approval** holds new posts for review. **Auto Publish** puts them on the website without review."
          ],
          [
            "**Default post limit**",
            "How many posts a wall shows unless the block on the page says otherwise."
          ],
          [
            "**Default sort by**",
            "**Latest**, **Platform Priority** or **Engagement**."
          ],
          [
            "**Filters enabled**",
            "Lets visitors filter the wall."
          ]
        ]
      }
    ],
    callouts: [
      {
        type: "warning",
        text: "There's an older component called SocialMediaWall. It fetches posts straight from the platforms and ignores your approvals. Use the **Social Wall** component so that only approved posts appear."
      }
    ],
    keepInMind: [
      "Turning off **Active** for a platform also hides its approved posts from the website.",
      "When you save the **Platforms** tab, an empty box keeps the value already saved. You only need to fill in what's changing.",
      "**Refresh Tokens** on the **Sync** tab only works for Instagram.",
      "The **Featured** switch on the **Posts** tab only marks a post inside the admin. The wall on the website doesn't treat featured posts differently.",
      "By default, Editors can approve and reject posts but don't get the **Settings**, **Platforms** or **Sync** tabs."
    ]
  },
  {
    id: "media",
    title: "Media",
    adminRoute: "/admin/media",
    summary: "Store the images, PDFs and videos used across the website, and control how images are compressed.",
    whereManaged: "In the left menu, open **Media**, then click **Library**, **Bulk Optimize** or **Settings**.",
    sections: [
      {
        title: "Uploading files",
        paragraph: "You can upload JPG, PNG, WebP, AVIF, GIF, SVG, PDF, MP4 and WEBM files. The size limit is 20 MB per file unless it's been changed in Media Settings.",
        steps: [
          "Go to **Media** then **Library** and click **Upload**.",
          "Drag your files onto **Click or drag files to upload**, or click that box to pick them from your computer.",
          "For each JPG, PNG, WebP or AVIF image, a crop window opens. Adjust the crop and click **Confirm crop**. If you click **Cancel**, that file isn't uploaded.",
          "When the upload finishes, click **Close**. New files appear at the start of the library."
        ]
      },
      {
        title: "Finding a file and copying its link",
        steps: [
          "Use the **All media items** dropdown to show only **Images** or **Documents**, the **All dates** dropdown to pick a month, or type in **Search media**.",
          "Click the file. The **Attachment details** panel opens.",
          "Click **Copy URL**, then paste the link where you need it."
        ]
      },
      {
        title: "Editing a file's title and ALT text",
        steps: [
          "Click the file to open **Attachment details**.",
          "Change the **Title**, **ALT text**, **Caption** or **Description**.",
          "Click **Save** at the top of the panel."
        ]
      },
      {
        title: "Replacing a file",
        paragraph: "Use this instead of deleting and re-uploading. The library item stays the same, so links made with **Copy URL** keep working.",
        steps: [
          "Click the file to open **Attachment details**.",
          "Click **Choose replacement** and pick the new file.",
          "Click **Replace file**. For most images, you'll need to confirm a crop first."
        ]
      },
      {
        title: "Deleting a file",
        steps: [
          "Click the file to open **Attachment details**.",
          "Click **Delete file** and confirm. This can't be undone.",
          "If you see **Media is in use**, the file is on a page, blog or event. Click **Cancel** and swap it out there first. **Force Delete** removes it anyway and leaves a broken image behind."
        ]
      },
      {
        title: "Working on several files at once",
        steps: [
          "Click **Bulk Select**.",
          "Tick the files you want, or click **Select page** to tick everything on the current page.",
          "In **Bulk actions**, choose **Delete selected**, **Optimize selected**, **Convert WebP / AVIF** or **Download selected metadata**.",
          "Click **Apply**. Click **Cancel Select** when you're done."
        ]
      },
      {
        title: "Compressing older images",
        paragraph: "This goes through JPG, PNG, WebP and AVIF images that are missing their compressed versions. Images that already have them are left alone.",
        steps: [
          "Go to **Media** then **Bulk Optimize**.",
          "Click **Optimize All**. If you only want missing WebP and AVIF versions created, click **Convert Missing Formats** instead.",
          "Watch the progress bar. Click **Cancel** to stop the job. Both buttons stay disabled until the job ends."
        ]
      },
      {
        title: "Changing upload and compression settings",
        paragraph: "These apply to files uploaded after you save. They don't change what's already in the library.",
        steps: [
          "Go to **Media** then **Settings**.",
          "Change the fields you need. The table below covers the common ones.",
          "Click **Save settings**."
        ]
      }
    ],
    tables: [
      {
        title: "Common media settings",
        headers: [
          "Setting",
          "What it does"
        ],
        rows: [
          [
            "**Max upload size (MB)**",
            "The largest file the library accepts, from 1 to 100. The default is 20."
          ],
          [
            "**Compression mode**",
            "Choose **Lossless**, **Glossy** or **Lossy**. **Lossless** keeps the most detail and **Lossy** makes the smallest files. The default is **Glossy**."
          ],
          [
            "**Quality (40-100)**",
            "Higher looks better but makes bigger files. The default is 75."
          ],
          [
            "**Enable WebP** and **Enable AVIF**",
            "Create these smaller image versions on upload. Both are on by default."
          ]
        ]
      }
    ],
    callouts: [
      {
        type: "warning",
        text: "The **Media is in use** check only knows about pages, blogs and events. A file used somewhere else, such as a gallery or the header, gets deleted with no warning."
      }
    ],
    keepInMind: [
      "Editors can't use **Force Delete**, and they don't see **Bulk Optimize** or **Settings** under Media by default.",
      "To compress or convert one file, open it and click **Re-optimize** or **Convert WebP / AVIF** in the **Optimization** section of the panel."
    ]
  },
  {
    id: "gallery",
    title: "Gallery",
    adminRoute: "/admin/gallery",
    summary: "Create the photo and video galleries that appear on the website, then place them on pages with a shortcode.",
    whereManaged: "In the left menu, click **Gallery**.",
    sections: [
      {
        title: "Creating a gallery",
        steps: [
          "Click **Create Gallery**.",
          "Under **Select Gallery Type**, choose **Image Gallery** or **Video Gallery**. You can't change the type later.",
          "Type a **Gallery Name** and click **Create & Configure**.",
          "The edit screen opens with one sample item in the gallery. Fill it in with your own album or video. A gallery has to keep at least one item, so edit the sample instead of trying to remove it."
        ]
      },
      {
        title: "Adding albums to an image gallery",
        steps: [
          "In the gallery list, click the gallery name.",
          "Click **Edit** at the top right. The settings panel opens.",
          "Open **Manage Albums** and click **Add gallery item**.",
          "Leave **Type** as **Album**. Enter the **Item Title** and pick the **Categories**.",
          "Under **Cover Image**, choose the picture for the album card. The required size is 446 × 334 px.",
          "Under **Album Images**, click **Upload Album Images** to add photos from your computer, or **Media Library** to pick files you've already uploaded.",
          "Click **Save** in the panel. You'll see **Gallery saved successfully**."
        ]
      },
      {
        title: "Adding videos to a video gallery",
        paragraph: "Video galleries take YouTube videos only.",
        steps: [
          "In the gallery list, click the gallery name, then click **Edit** at the top right.",
          "Open **Manage Videos** and click **Add video**.",
          "In **YouTube Video ID**, paste the ID, which is the part after `v=` in the YouTube link. For example `Mny8ziStg4w`. Pasting the full YouTube link also works.",
          "Enter the **Title** and pick the **Categories**.",
          "Click **Save** in the panel."
        ]
      },
      {
        title: "Putting a gallery on a page",
        steps: [
          "In the gallery list, click the copy icon in the **Shortcode** column.",
          "Open the page in the Page Builder and add a shortcode block.",
          "Paste into the block's **Shortcode** field. It looks like `[shortcode=\"annual-sports-meet-2025\"]`.",
          "Save the page."
        ]
      },
      {
        title: "Changing the filter categories",
        paragraph: "These are the filter buttons visitors see above the gallery.",
        steps: [
          "Open the gallery and click **Edit**.",
          "For an image gallery, open **Filters & Item Limit** and click **Add category**. The first category, `All`, can't be changed.",
          "For a video gallery, open **Manage Tabs**. In **Category Tabs**, type a name and press Enter.",
          "Click **Save** in the panel, then assign the new category to your albums or videos under **Categories**."
        ]
      },
      {
        title: "Showing only some items with a View More link",
        steps: [
          "Open the gallery and click **Edit**.",
          "For an image gallery, open **Filters & Item Limit**, turn on **Limit visible albums**, and fill in **Visible album count**, **View More text** and **View More URL**.",
          "For a video gallery, open **View More Button**, turn on **Enable item limit**, and fill in **Items to show**, **Button text** and **Button link**.",
          "Click **Save** in the panel."
        ]
      },
      {
        title: "Hiding a gallery from the website",
        steps: [
          "Open the gallery.",
          "In the status dropdown at the top right, choose **Archived**.",
          "Click **Edit**, then click **Save** in the panel. Use this order, because the **Save** button at the top of the screen does nothing until the panel has been opened once."
        ]
      },
      {
        title: "Deleting a gallery",
        steps: [
          "In the gallery list, click the delete icon in the **Actions** column.",
          "Click **Yes**. The gallery can't be restored, and any page using its shortcode stops showing it."
        ]
      }
    ],
    tables: [
      {
        title: "What each status does",
        headers: [
          "Status",
          "On the website"
        ],
        rows: [
          [
            "**Published**",
            "Shows on any page that has its shortcode. New galleries start as Published."
          ],
          [
            "**Draft**",
            "Still shows on any page that has its shortcode. It's only a label in the admin."
          ],
          [
            "**Archived**",
            "Doesn't show. You can only set this on the gallery's edit screen."
          ]
        ]
      }
    ],
    callouts: [
      {
        type: "warning",
        text: "The switch in the **Status** column only moves a gallery between **Published** and **Draft**, and neither hides it. To take a gallery off the website, use **Archived**."
      }
    ],
    keepInMind: [
      "The gallery name and shortcode are set when you create the gallery. The admin has no field for changing either one.",
      "If another gallery already uses the same shortcode, you'll get an error when you create it. Pick a different name.",
      "On an album image, click **Feature** to add that photo to the latest images feed. Unmarked photos stay in their album only."
    ]
  },
  {
    id: "team",
    title: "Team",
    adminRoute: "/admin/team",
    summary: "Manage groups of people, such as Committee Members, and show each group on a page with a shortcode.",
    whereManaged: "In the left menu, click **Team**.",
    sections: [
      {
        title: "Adding or changing a member",
        steps: [
          "Click **Edit Team** on the team's row.",
          "Click **Edit** at the top right.",
          "Open **Manage Members**.",
          "Click **Add member**, or find the person you want to change.",
          "Fill in **Name**, **Qualification**, **Title / Role** and **Bio**. Only **Name** is required.",
          "Choose a **Desktop Image**. It must be exactly 290 × 400 px or it won't save.",
          "Add a **Mobile Image** if you want a different photo on phones. If you leave it empty, the desktop image is used.",
          "Click **Update**. This saves the team."
        ]
      },
      {
        title: "Changing the order or removing a member",
        paragraph: "Members appear on the website in the order shown here.",
        steps: [
          "Click **Edit Team**, then **Edit**, and open **Manage Members**.",
          "Drag a member by the handle, or use the up and down arrows. To remove someone, click the delete icon.",
          "Click **Update**."
        ]
      },
      {
        title: "Creating a new team",
        steps: [
          "Click **Add New Team**.",
          "Type the **Team Name**. **Shortcode** fills in by itself, and you can change it.",
          "Fill in **Subtitle (Optional)** and **Section Heading (Main Title)** if you want them.",
          "Click **Create Team**. The team's edit page opens.",
          "Click **Edit**, open **Manage Members**, replace the four starter members with your own, and click **Update**."
        ]
      },
      {
        title: "Showing a team on a page",
        paragraph: "A shortcode is a short piece of text, like `[shortcode=\"committee-members\"]`, that tells a page which team to show. The page only holds that text. The people stay here, so when you change a member, every page using the shortcode changes too.",
        steps: [
          "In the team list, click the copy icon in the **Shortcode** column.",
          "Open the page under **Pages** and click **Add Component**.",
          "Search for `short` and add the Short Code component.",
          "Click the **Edit** icon on the block and open **Content**.",
          "Paste into **Shortcode** and click **Update**.",
          "Click **Save** on the page."
        ]
      },
      {
        title: "Changing the heading or colors",
        steps: [
          "Click **Edit Team**, then **Edit**.",
          "Open **Title & Colors** and change **Subtitle**, **Main title** or the colors.",
          "Click **Update**."
        ]
      },
      {
        title: "Deleting a team",
        steps: [
          "Click the delete icon on the team's row.",
          "Click **Delete** to confirm."
        ]
      }
    ],
    tables: [],
    callouts: [
      {
        type: "warning",
        text: "Deleting a team permanently removes it and all its members. Any page using its shortcode shows a warning instead, so take the Short Code block off those pages too."
      }
    ],
    keepInMind: [
      "A new team isn't empty. It starts with four members from the default committee list, so replace them before you put the team on a page.",
      "You can't rename a team or change its shortcode after creating it, so get both right on the **Add New Team** screen.",
      "There's no way to hide a team here. To take one off the website, remove its Short Code block from the page.",
      "The **Bio** shows in the pop-up when a visitor clicks **View Profile**.",
      "The preview on the edit page shows the last saved version, so it changes after you click **Update** or **Save**."
    ]
  },
  {
    id: "testimonials",
    title: "Testimonials",
    adminRoute: "/admin/testimonials",
    summary: "Keep one shared list of quotes, and control how it looks in the card and slider sections.",
    whereManaged: "In the left menu, click **Testimonials**.",
    sections: [
      {
        title: "Adding a testimonial",
        paragraph: "There's one list of testimonials, and every group on the website reads from it. Groups don't have their own quotes.",
        steps: [
          "Open the **Manage Testimonials** tab.",
          "Click **Add Testimonial**.",
          "Type the **Quote** and **Name**, and the **Role / Title** if there is one.",
          "Leave **Show in Slider** on if it should appear in Slider View.",
          "Click **Add**. It saves straight away and goes to the end of the list."
        ]
      },
      {
        title: "Editing a testimonial",
        steps: [
          "Open the **Manage Testimonials** tab.",
          "Click **Edit** on the row.",
          "Make your changes and click **Update**."
        ]
      },
      {
        title: "Changing the order",
        paragraph: "The website shows testimonials in the same order as this table.",
        steps: [
          "Open the **Manage Testimonials** tab and clear the search box. Dragging is switched off during a search.",
          "If the list runs over more than one page, choose more rows per page at the bottom of the table so the rows you're moving are on the same page.",
          "Drag the row by the handle on its left. The new order saves when you let go."
        ]
      },
      {
        title: "Choosing what shows in the slider",
        steps: [
          "Open the **Manage Testimonials** tab.",
          "Flip the **Show in Slider** switch on the row. It saves straight away."
        ]
      },
      {
        title: "Deleting a testimonial",
        steps: [
          "Open the **Manage Testimonials** tab.",
          "Click the delete icon on the row.",
          "Click **Delete** to confirm."
        ]
      },
      {
        title: "Changing how a group looks",
        paragraph: "A group doesn't hold quotes. It sets the style, headings and font sizes for one section. The site comes with a Card View group (`donor-testimonials`) and a Slider View group (`testimonials-slider`). There's no button to add or delete groups.",
        steps: [
          "Open the **Testimonial Groups** tab.",
          "Click **Edit** on the row.",
          "Change **Display Style**, **Small Title / Subtitle** or **Section Heading (Main Title)**. Font sizes are under **Typography**.",
          "Click **Update**."
        ]
      },
      {
        title: "Showing testimonials on a page",
        paragraph: "A shortcode is a short piece of text, like `[shortcode=\"donor-testimonials\"]`, that tells a page which group to show. The page only holds that text. The quotes stay here, so when you change one, every page using a shortcode changes too.",
        steps: [
          "On the **Testimonial Groups** tab, click the copy icon in the **Shortcode** column.",
          "Open the page under **Pages** and click **Add Component**.",
          "Search for `short` and add the Short Code component.",
          "Click the **Edit** icon on the block and open **Content**.",
          "Paste into **Shortcode** and click **Update**.",
          "Click **Save** on the page."
        ]
      }
    ],
    tables: [
      {
        title: "Display styles",
        headers: [
          "Style",
          "What it shows"
        ],
        rows: [
          [
            "**Card View**",
            "A grid of cards with every testimonial in the list."
          ],
          [
            "**Slider View**",
            "A slider with only the testimonials that have **Show in Slider** turned on."
          ]
        ]
      },
      {
        title: "Group status",
        headers: [
          "Status",
          "What happens on the website"
        ],
        rows: [
          [
            "**Published**",
            "The group shows."
          ],
          [
            "**Draft**",
            "The group still shows. Draft doesn't hide it."
          ],
          [
            "**Archived**",
            "The group stops showing and a warning appears in its place, so take the Short Code block off the page too."
          ]
        ]
      }
    ],
    callouts: [
      {
        type: "warning",
        text: "Deleting a testimonial removes it from every section that shows testimonials, and it can't be restored. If you only want it out of the slider, turn off **Show in Slider** instead."
      }
    ],
    keepInMind: [
      "Changes on the **Manage Testimonials** tab save as you make them. There's no Save button to click afterwards.",
      "A Testimonials component added straight to a page keeps its own quotes and doesn't read this list. Use a Short Code block to show the shared list.",
      "If you change a group's **Shortcode**, any page using the old one stops showing it until you paste in the new one."
    ]
  },
  {
    id: "dashboard",
    aliases: [
      "overview"
    ],
    title: "Dashboard",
    adminRoute: "/admin",
    summary: "Shows how much content the site has, what's waiting for you, and what was changed most recently.",
    whereManaged: "In the left menu, click **Dashboard**. It's also where you land after signing in.",
    sections: [
      {
        title: "Checking what's waiting for you",
        paragraph: "Each card has a big total and a smaller line under it. The smaller line is usually the one that matters.",
        steps: [
          "In the left menu, click **Dashboard**.",
          "On the **Blog Comments** card, look at the **Pending** number. These comments are waiting for approval. Deal with them under **Blogs** then **Comments**.",
          "On the **Event Registrations** card, look at the **New** number. Deal with these under **Submissions** then **Event Register**."
        ]
      },
      {
        title: "Seeing what changed recently",
        paragraph: "**Recent Updates** lists the last six changes to pages, blog posts, events and forms. It doesn't say who made them.",
        steps: [
          "Scroll down to **Recent Updates**, below the cards.",
          "Read from the top. The newest change comes first.",
          "Each row shows the area (**Pages**, **Blogs**, **Events** or **Forms**), the item's name and how long ago it was saved. Pages, blog posts and events also show their status."
        ]
      }
    ],
    tables: [
      {
        title: "What the cards count",
        headers: [
          "Card",
          "Big number",
          "Line underneath"
        ],
        rows: [
          [
            "**Pages**",
            "All pages, including drafts.",
            "**Published**: pages that are live."
          ],
          [
            "**Blog Posts**",
            "All posts, whatever their status.",
            "**Published**: posts that are live."
          ],
          [
            "**Blog Comments**",
            "All comments, whatever their status.",
            "**Pending**: comments waiting for approval."
          ],
          [
            "**Events**",
            "All events, whatever their status.",
            "**Published**: events that are live."
          ],
          [
            "**Event Registrations**",
            "All registrations and RSVP replies.",
            "**New**: the ones whose status is still New."
          ],
          [
            "**Users**",
            "Active accounts, not counting Super Admins.",
            "**New Users**: accounts added in the last 7 days."
          ],
          [
            "**Forms**",
            "All forms in the Form Builder.",
            "**Active**: forms that are published."
          ]
        ]
      }
    ],
    callouts: [],
    keepInMind: [
      "The numbers refresh by themselves about once a minute, and again when you come back to the tab. The badge beside the **Dashboard** title shows how long ago that was.",
      "If the badge says **Database offline**, the admin can't reach the database and every card shows 0. Tell whoever looks after the site.",
      "The cards aren't links, and the small line drawing on each one is decoration, not a real trend.",
      "The **New** number on **Event Registrations** only drops when you change a registration's status. **Mark read** doesn't change it."
    ]
  },
  {
    id: "submissions",
    title: "Submissions",
    adminRoute: "/admin/donations",
    summary: "Read and export what visitors send through the website: donations, event replies, messages, volunteer forms and job applications.",
    whereManaged: "In the left menu, open **Submissions**, then click the list you need.",
    sections: [
      {
        title: "Exporting a list",
        paragraph: "Every list under Submissions has the same **Export** button.",
        steps: [
          "Open the list. If you want only some records, set the filters and search first.",
          "Click **Export** and choose one of the options in the table below.",
          "For **Custom Export**, pick your **Columns** and **Date Range**, then click **Export** in the window. Leave the dates empty to include everything.",
          "The file downloads to your computer."
        ]
      },
      {
        title: "Checking donations",
        steps: [
          "Go to **Submissions** then **Donate**.",
          "Narrow the list with the date range, the **All status** dropdown or the search box. Search covers donor name, email, mobile, order ID, purpose, transaction ID and bank reference. It doesn't search PAN.",
          "Click the eye icon in **Actions** to open **Donation Details**. That's where you'll find the PAN, address, selected schemes and payment details."
        ]
      },
      {
        title: "Working through event registrations",
        paragraph: "**Seats taken** counts **Yes** and **Maybe** replies with a **Status** of **New** or **Confirmed**. Moving someone to **Waitlisted** or **Cancelled** frees their seat.",
        steps: [
          "Go to **Submissions** then **Event Register**. The screen is titled **Registered Applicants**.",
          "Pick an event in the **Event** filter. You can also filter by **Reply** and **Status**, or search by name, email or event.",
          "Read the **Yes**, **Maybe**, **No** and **Seats taken** cards above the table. They total all events until you pick one in the **Event** filter, and the other filters don't change them. With one event chosen, **Seats taken** also shows its capacity if the event has one.",
          "Check the **Reply** column for each person's answer. A dash means they registered without giving a reply.",
          "Change a person's **Status** in their row. It saves as soon as you pick it, and the person doesn't get an email.",
          "Click the eye icon to see the full **Registration details**."
        ]
      },
      {
        title: "Reading Contact Us, Volunteer Form and Volunteers Feedback messages",
        steps: [
          "Go to **Submissions** and click **Contact Us**, **Volunteer Form** or **Volunteers Feedback**.",
          "Click the eye icon to read the whole message.",
          "On **Contact Us** and **Volunteer Form**, click **Mark read** when you've dealt with it. On **Volunteers Feedback**, opening the message marks it as read."
        ]
      },
      {
        title: "Reviewing career and internship applications",
        paragraph: "Career and internship applications have separate lists, but they work the same way.",
        steps: [
          "Go to **Submissions** and click **Career Submissions** or **Internship Submissions**.",
          "Type in the search box and click **Search**, or use the status and position or role filters.",
          "Click the eye icon to read the application. This marks it as read.",
          "Click **Download Resume** in the details window, or the file name in the **Resume / CV** column.",
          "Set the **Status** to **Reviewed**, **Shortlisted** or **Rejected**. It saves as soon as you pick it. Career applications can also be set to **Archived**, and those show only under **All Statuses**."
        ]
      },
      {
        title: "Managing subscribers",
        steps: [
          "Go to **Submissions** then **Subscribers**.",
          "Use the **All status** dropdown to see **Active** or **Unsubscribed** people, or type in **Search email...**.",
          "To remove someone from the list, click the delete icon on their row and click **Delete**."
        ]
      }
    ],
    tables: [
      {
        title: "What's under Submissions",
        headers: [
          "Menu item",
          "What's in it"
        ],
        rows: [
          [
            "**Subscribers**",
            "Email addresses of newsletter subscribers."
          ],
          [
            "**Event Register**",
            "Event registrations and Yes, Maybe or No replies."
          ],
          [
            "**Donate**",
            "Donations with payment status and donor details."
          ],
          [
            "**Volunteer Form**",
            "Volunteer sign-up forms."
          ],
          [
            "**Volunteers Feedback**",
            "Feedback sent in by volunteers."
          ],
          [
            "**Contact Us**",
            "Messages from the contact form."
          ],
          [
            "**Career Submissions**",
            "Job applications with CVs."
          ],
          [
            "**Internship Submissions**",
            "Internship applications with CVs."
          ]
        ]
      },
      {
        title: "Export options",
        headers: [
          "Option",
          "What you get"
        ],
        rows: [
          [
            "**Export as CSV**",
            "A CSV of the records matching the filters and search on screen."
          ],
          [
            "**Export as Excel (All)**",
            "An Excel file of every record. Your filters are ignored."
          ],
          [
            "**Custom Export**",
            "An Excel file with only the columns and dates you pick. The filters on screen are ignored."
          ]
        ]
      },
      {
        title: "Donation payment status",
        headers: [
          "Status",
          "Meaning"
        ],
        rows: [
          [
            "**SUCCESS**",
            "The payment went through."
          ],
          [
            "**PENDING**",
            "The donor started the payment and there's no final result yet."
          ],
          [
            "**FAILED**",
            "The payment didn't go through."
          ],
          [
            "**CANCELLED**",
            "The payment was cancelled before it finished."
          ]
        ]
      }
    ],
    callouts: [
      {
        type: "note",
        text: "If **Export** is greyed out with a padlock, your role doesn't have export permission. Editors don't have it by default. Ask your Super Admin."
      }
    ],
    keepInMind: [
      "**Contact Us** and **Volunteer Form** only show the newest 50 records on screen. Use **Export** to get older ones.",
      "Deleting a submission can't be undone from the admin. For career and internship applications, the attached CV goes too.",
      "There's no resend receipt button on **Donate**. Donors can have a receipt re-sent from `/my-donations`.",
      "PAN can be blank on donations under ₹50,000, because it's only required from that amount.",
      "Submissions from forms made in **Form Builder** aren't here. Open them from **Form Builder**."
    ]
  },
  {
    id: "settings",
    title: "Settings",
    adminRoute: "/admin/settings/admin-theme",
    summary: "Change how the admin panel and website look, and manage the sitemap and robots files search engines read.",
    whereManaged: "In the left menu, open **Settings**, then click **Admin Setting**, **Frontend Setting**, **Sitemap** or **Robots**.",
    sections: [
      {
        title: "Regenerating the sitemap",
        paragraph: "Search engines read your sitemap at `/sitemap.xml`. The website serves a saved copy, and nothing updates that copy by itself. Regenerate it after a deploy, and after publishing pages, blogs or events you want search engines to find.",
        steps: [
          "Go to **Settings** then **Sitemap**.",
          "Click **Generate Sitemap**. If you've typed changes that aren't saved, you'll see **Replace unsaved sitemap changes?** Click **Generate** to carry on.",
          "Wait for **Sitemap generated and published**. It's live now, so you don't need to click **Save Sitemap**.",
          "Check that the addresses in the box start with the live website address. If you see `localhost` or an old address, tell your developer."
        ]
      },
      {
        title: "Changing website branding and colors",
        steps: [
          "Go to **Settings** then **Frontend Setting**.",
          "Click a panel to open it. The table below shows what's in each one.",
          "Make your changes.",
          "Click **Save** at the top right. You'll see **Theme saved**."
        ]
      },
      {
        title: "Changing how the admin panel looks",
        paragraph: "This only affects the admin panel, not the public website.",
        steps: [
          "Go to **Settings** then **Admin Setting**.",
          "Open **Identity & Branding** to change the **Admin panel title** or logo, **Colors & Buttons** or **Sidebar** for colors, or **Admin Loader** for the loading spinner.",
          "Click **Save** at the top right."
        ]
      },
      {
        title: "Regenerating the robots file",
        paragraph: "The robots file at `/robots.txt` tells search engines what to stay out of and where the sitemap is. Like the sitemap, it's a saved copy.",
        steps: [
          "Go to **Settings** then **Robots**.",
          "Click **Generate Robots**.",
          "Wait for **Robots generated and published**."
        ]
      },
      {
        title: "Editing the sitemap or robots file by hand",
        paragraph: "You'll rarely need this. Anything you type here is replaced the next time someone clicks generate.",
        steps: [
          "Open **Sitemap** or **Robots** under **Settings**.",
          "Edit the text in the box.",
          "Click **Save Sitemap** or **Save Robots**. The button stays disabled until you've changed something. The change is live once it saves."
        ]
      }
    ],
    tables: [
      {
        title: "What each settings page is for",
        headers: [
          "Page",
          "What it controls"
        ],
        rows: [
          [
            "**Admin Setting**",
            "The title, logo, colors and loader of the admin panel."
          ],
          [
            "**Frontend Setting**",
            "The public website's branding, colors, layout, page loader, default SEO text and custom code."
          ],
          [
            "**Sitemap**",
            "The list of website addresses given to search engines."
          ],
          [
            "**Robots**",
            "The rules that tell search engines what not to crawl."
          ]
        ]
      },
      {
        title: "Panels on Frontend Setting",
        headers: [
          "Panel",
          "What's in it"
        ],
        rows: [
          [
            "**Identity & Branding**",
            "**Branding name** and **Favicon (Title icon)**."
          ],
          [
            "**Layout & Locale**",
            "**Container max-width (px)**, **Default locale**, **Direction**, smooth scroll and scroll animation."
          ],
          [
            "**Colors**",
            "The website's named colors. Use **Add color** for a new one."
          ],
          [
            "**Page Loader**",
            "**Enable page loader**, its colors and **Minimum duration (ms)**."
          ],
          [
            "**Advanced**",
            "**Global SEO & Performance** for default meta text and image. **Custom Code & Integrations** for custom code and the **Google Analytics ID**."
          ]
        ]
      }
    ],
    callouts: [
      {
        type: "warning",
        text: "Keep the `Disallow: /admin` line in the robots file. Generating the file includes it, so the only risk is deleting it while editing by hand."
      }
    ],
    keepInMind: [
      "Don't paste anything into **Custom Code & Integrations** unless your developer gave it to you. Bad code there can break the website.",
      "The sitemap only lists published content. Draft pages, blogs and events are left out.",
      "Editors don't see **Settings** by default."
    ]
  },
  {
    id: "users",
    title: "Users",
    adminRoute: "/admin/users",
    summary: "Add staff accounts, set each person's role, change passwords, and turn off access when someone leaves.",
    whereManaged: "In the left menu, click **Users**.",
    sections: [
      {
        title: "Adding a user",
        steps: [
          "Click **Add user**.",
          "Fill in **Name** and **Email**.",
          "Enter a **Password** of at least 6 characters.",
          "Choose a **Role**. It starts on Editor.",
          "Leave **Status** as **Active** and click **Create**.",
          "Give the person their email and password yourself. The system doesn't send them anything."
        ]
      },
      {
        title: "Changing someone's role",
        steps: [
          "Find the person. You can search by name or email, or use the **Role** and **Status** filters.",
          "Click **Edit** on their row.",
          "Choose the new **Role** and click **Save**. They're signed out and have to sign in again."
        ]
      },
      {
        title: "Changing a password",
        paragraph: "There's no separate reset button. You set the new password yourself and pass it on.",
        steps: [
          "Click **Edit** on the person's row.",
          "Type the new password in **New password (leave blank to keep)**. It needs at least 6 characters.",
          "Click **Save**. This doesn't sign them out. The new password is needed next time they sign in."
        ]
      },
      {
        title: "Turning off an account",
        paragraph: "Use this when someone leaves or shouldn't have access for a while. The account stays and you can turn it back on later.",
        steps: [
          "Click **Edit** on the person's row.",
          "Set **Status** to **Inactive** and click **Save**."
        ]
      },
      {
        title: "Deleting a user",
        steps: [
          "Click **Delete** on the person's row.",
          "Click **Delete** in the **Delete user?** window. This can't be undone."
        ]
      }
    ],
    tables: [
      {
        title: "Account status",
        headers: [
          "Status",
          "What it means"
        ],
        rows: [
          [
            "**Active**",
            "The person can sign in."
          ],
          [
            "**Inactive**",
            "The person can't sign in. If they're signed in now, they're sent to the sign-in page with **Your account is inactive**."
          ]
        ]
      }
    ],
    callouts: [
      {
        type: "warning",
        text: "Changing someone's **Role** or **Status** signs them out. Their next page load or save sends them to the sign-in page, and anything unsaved is lost. Tell them before you do it."
      }
    ],
    keepInMind: [
      "You can't give one person an extra permission. Access comes from their role, so create a role in **Roles & Permissions** if none fits.",
      "The Super Admin's email, role and status can't be changed, and the account can't be deleted. Only a Super Admin sees that account in this list.",
      "The last active administrator can't be deleted, deactivated or moved to another role.",
      "If you change your own role, you'll see **Your access changed. Sign in again to continue with the new role.**"
    ]
  },
  {
    id: "rbac",
    aliases: [
      "roles"
    ],
    title: "Roles & Permissions",
    adminRoute: "/admin/rbac/roles",
    summary: "Decide what each staff role can see and do in the admin, and create custom roles when you need them.",
    whereManaged: "In the left menu, click **Roles & Permissions**. By default, only the Super Admin sees this.",
    sections: [
      {
        title: "Creating a custom role",
        steps: [
          "Click **Create role**.",
          "Enter a **Role name**, for example `Donations Auditor`.",
          "Leave **Role key** blank and it's made from the name. You can't change it later.",
          "Leave **Priority** at 50 unless you have a reason to change it.",
          "Under **Permission Matrix**, tick what the role needs. Each module has **Select all** and **Clear** links.",
          "Click **Create role**.",
          "Go to **Users**, click **Edit** on the person, and choose the new **Role**."
        ]
      },
      {
        title: "Changing what a role can do",
        paragraph: "Do this when people aren't in the middle of editing, because saving signs out everyone on the role.",
        steps: [
          "Click **Edit** on the role.",
          "Tick or untick permissions under **Permission Matrix**.",
          "Click **Save changes**."
        ]
      },
      {
        title: "Turning off a custom role",
        steps: [
          "Click **Edit** on the role.",
          "Untick **Role is active** and click **Save changes**.",
          "Anyone on the role loses all access until you turn it back on or move them to another role. The role also drops out of the **Role** list on **Users**."
        ]
      },
      {
        title: "Deleting a custom role",
        steps: [
          "Go to **Users** and move everyone off the role. If anyone still has it, the delete is refused with a message saying how many users are on it.",
          "Back in **Roles & Permissions**, click **Delete** on the role.",
          "Click **Delete** in the confirmation."
        ]
      }
    ],
    tables: [
      {
        title: "System roles",
        subtitle: "These four always exist. They show **System** in the **Type** column. Higher priority outranks lower.",
        headers: [
          "Role",
          "Priority",
          "Default access",
          "What can be changed"
        ],
        rows: [
          [
            "Super Admin",
            "1000",
            "Everything, including this screen.",
            "Nothing that limits it. It keeps full access whatever is ticked."
          ],
          [
            "Admin",
            "500",
            "Every module except **Roles & Permissions**.",
            "Its ticks, by the Super Admin only."
          ],
          [
            "Editor",
            "200",
            "Content and submissions. No **Users**, **Settings** or **Roles & Permissions**. Also no exporting, no creating components, no Media **Bulk Optimize** or **Settings**, no **Manage** or settings access on Social Wall, and no settings access on Chatbot.",
            "Its ticks, by the Super Admin only."
          ],
          [
            "Author",
            "100",
            "Dashboard, Documentation, Blogs and Events. Can view, add and edit blogs and events, but can't publish or delete them, or manage blog categories and comments.",
            "Its ticks, by the Super Admin only."
          ]
        ]
      },
      {
        title: "What the permissions mean",
        subtitle: "Not every module has every permission. The matrix only shows the ones that apply.",
        headers: [
          "Permission",
          "What it allows"
        ],
        rows: [
          [
            "**View Access**",
            "Open the module and see its records."
          ],
          [
            "**Add/Create**",
            "Add new records."
          ],
          [
            "**Edit**",
            "Change existing records."
          ],
          [
            "**Delete**",
            "Remove records."
          ],
          [
            "**Manage**",
            "Extra tools in that module, such as blog categories and comments, or Media **Bulk Optimize**."
          ],
          [
            "**Publish**",
            "Put content live. Applies to Pages, Form Builder, Popups, Blogs and Events."
          ],
          [
            "**Export Data**",
            "Use the **Export** button. Applies to Submissions and Form Builder."
          ],
          [
            "**Settings Access**",
            "Open a module's settings. **Theme** covers **Admin Setting** and **Frontend Setting**. **Settings** covers **Sitemap** and **Robots**."
          ],
          [
            "**User Management**",
            "Open the **Users** screen and manage accounts."
          ],
          [
            "**Roles & Permissions Management**",
            "Open this screen. Only the Super Admin can give this to a role."
          ]
        ]
      }
    ],
    callouts: [
      {
        type: "warning",
        text: "Saving a role signs out everyone who has it, even if you only changed the description. Their next page load or save sends them to the sign-in page with **Your role or permissions changed**, and anything unsaved is lost. If it's your own role, you're signed out too."
      }
    ],
    keepInMind: [
      "System roles can't be deleted or deactivated, and their **Role key** can't change. Their name, description and priority go back to the defaults when the server restarts, so don't bother editing those.",
      "If a software update changes the permission list, system roles go back to their default ticks and everyone on them is signed out. Custom roles keep their ticks.",
      "Permissions belong to roles. You can't set them for one person.",
      "Anyone other than the Super Admin can only give out roles at or below their own priority, and can only create or edit roles below it.",
      "A deleted role's key can't be used again, so a new role with the same name needs a different **Role key**."
    ]
  }
];

export function getGuideById(identifier) {
  if (!identifier) return null;
  const target = String(identifier).trim().toLowerCase();
  return (
    ADMIN_MODULE_GUIDES.find(
      (m) =>
        m.id.toLowerCase() === target ||
        (Array.isArray(m.aliases) && m.aliases.some((a) => a.toLowerCase() === target)),
    ) || null
  );
}
