"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { ThemeAdminCard } from "@/styles/Theme";
import {
  ADMIN_MODULE_GUIDES,
  COMMON_TASKS,
  DOCUMENTATION_GROUPS,
  getGuideById,
} from "@/lib/documentation/adminGuidesData";
import { getSectionAnchor, plainGuideText } from "@/components/admin/documentation/guideText";

function sectionHref(guideId, sectionTitle) {
  return `/admin/documentation/${guideId}#${getSectionAnchor(sectionTitle)}`;
}

/** Guides matching the search, each with the tasks inside it that matched. */
function searchGuides(query) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const matches = (text) => {
    const haystack = plainGuideText(text).toLowerCase();
    return words.every((word) => haystack.includes(word));
  };

  return ADMIN_MODULE_GUIDES.map((guide) => {
    const sections = guide.sections.filter((section) =>
      matches([section.title, section.paragraph, ...(section.steps || [])].join(" ")),
    );
    const guideMatches = matches([guide.title, guide.summary].join(" "));
    return guideMatches || sections.length ? { guide, sections } : null;
  }).filter(Boolean);
}

export default function DocumentationHub() {
  const [query, setQuery] = useState("");
  const trimmed = query.trim();
  const results = useMemo(() => (trimmed ? searchGuides(trimmed) : []), [trimmed]);

  return (
    <ThemeAdminCard title="Documentation">
      <div className="doc-hub">
        <p className="doc-hub-intro">
          How to do things in the MESCO admin panel. Search for what you need, or pick a topic below.
        </p>

        <Input
          allowClear
          size="large"
          prefix={<SearchOutlined />}
          placeholder="Search, for example: publish a page"
          aria-label="Search the documentation"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="doc-hub-search"
        />

        {trimmed ? (
          <section aria-live="polite">
            <h2 className="doc-hub-heading">
              {results.length
                ? `${results.length} ${results.length === 1 ? "guide" : "guides"} found`
                : "Nothing found"}
            </h2>
            {results.length ? (
              <ul className="doc-hub-results">
                {results.map(({ guide, sections }) => (
                  <li key={guide.id}>
                    <Link href={`/admin/documentation/${guide.id}`} className="doc-hub-link">
                      {guide.title}
                    </Link>
                    <p>{plainGuideText(guide.summary)}</p>
                    {sections.length ? (
                      <ul className="doc-hub-sections">
                        {sections.map((section) => (
                          <li key={section.title}>
                            <Link href={sectionHref(guide.id, section.title)}>{section.title}</Link>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="doc-hub-empty">Try a shorter word, like “menu” or “photo”.</p>
            )}
          </section>
        ) : (
          <>
            <section>
              <h2 className="doc-hub-heading">Common tasks</h2>
              <ul className="doc-hub-tasks">
                {COMMON_TASKS.map((task) => (
                  <li key={task.label}>
                    <Link href={sectionHref(task.guide, task.section)}>{task.label}</Link>
                  </li>
                ))}
              </ul>
            </section>

            <div className="doc-hub-groups">
              {DOCUMENTATION_GROUPS.map((group) => (
                <section key={group.key}>
                  <h2 className="doc-hub-heading">{group.label}</h2>
                  <ul className="doc-hub-list">
                    {group.guides.map((id) => {
                      const guide = getGuideById(id);
                      return (
                        <li key={id}>
                          <Link href={`/admin/documentation/${id}`} className="doc-hub-link">
                            {guide.title}
                          </Link>
                          <p>{plainGuideText(guide.summary)}</p>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          </>
        )}
      </div>

      <style jsx global>{`
        .doc-hub {
          max-width: 1040px;
        }
        .doc-hub-intro {
          margin: 0 0 16px;
          font-size: 15px;
          color: #374151;
        }
        .doc-hub-search {
          max-width: 520px;
          margin-bottom: 28px;
        }
        .doc-hub-heading {
          margin: 0 0 10px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e5e7eb;
          font-size: 15px;
          font-weight: 600;
          color: #111827;
        }
        .doc-hub-tasks {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 6px 24px;
          margin: 0 0 32px;
          padding: 0;
          list-style: none;
          font-size: 14px;
        }
        .doc-hub-groups {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 32px 40px;
        }
        .doc-hub-list,
        .doc-hub-results {
          margin: 0;
          padding: 0;
          list-style: none;
        }
        .doc-hub-list > li,
        .doc-hub-results > li {
          padding: 8px 0;
        }
        .doc-hub-link {
          font-size: 14.5px;
          font-weight: 600;
        }
        .doc-hub-list p,
        .doc-hub-results p {
          margin: 2px 0 0;
          font-size: 13px;
          line-height: 1.5;
          color: #6b7280;
        }
        .doc-hub-sections {
          margin: 6px 0 0;
          padding-left: 18px;
          font-size: 13.5px;
        }
        .doc-hub-empty {
          color: #6b7280;
        }
        @media (max-width: 768px) {
          .doc-hub-groups {
            grid-template-columns: minmax(0, 1fr);
          }
        }
      `}</style>
    </ThemeAdminCard>
  );
}
