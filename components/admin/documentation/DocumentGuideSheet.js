"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button, Space } from "antd";
import { LinkOutlined, PrinterOutlined } from "@ant-design/icons";
import {
  ADMIN_MODULE_GUIDES,
  DOCUMENTATION_GROUPS,
  getGuideById,
} from "@/lib/documentation/adminGuidesData";
import { getSectionAnchor, renderGuideText } from "@/components/admin/documentation/guideText";
import { ThemeAdminCard } from "@/styles/Theme";

// Same order as the documentation page, so Next follows the groups people see.
const GUIDE_ORDER = DOCUMENTATION_GROUPS.flatMap((group) => group.guides);

function GuideTable({ table }) {
  return (
    <div className="doc-block">
      {table.title ? <h3>{table.title}</h3> : null}
      {table.subtitle ? <p>{renderGuideText(table.subtitle)}</p> : null}
      <div className="doc-table-scroll">
        <table>
          <thead>
            <tr>
              {table.headers.map((header) => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{renderGuideText(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function DocumentGuideSheet({ moduleKey }) {
  const pathname = usePathname();
  const guide = getGuideById(moduleKey) || ADMIN_MODULE_GUIDES[0];

  const position = GUIDE_ORDER.indexOf(guide.id);
  const previous = position > 0 ? getGuideById(GUIDE_ORDER[position - 1]) : null;
  const next = position < GUIDE_ORDER.length - 1 ? getGuideById(GUIDE_ORDER[position + 1]) : null;
  const tasks = guide.sections || [];
  const tables = guide.tables || [];
  const callouts = guide.callouts || [];
  const keepInMind = guide.keepInMind || [];

  return (
    <div className="admin-doc-sheet-root" style={{ padding: "8px 0 50px 0" }}>
      <ThemeAdminCard
        title={
          <>
            <span className="doc-crumb no-print">
              <Link href="/admin/documentation">Documentation</Link> / {guide.title}
            </span>
            <span className="doc-print-label">MESCO Trust admin guide</span>
          </>
        }
        extra={
          <Space wrap className="no-print">
            <Button icon={<PrinterOutlined />} onClick={() => window.print()}>
              Print or save as PDF
            </Button>
            <Link href={guide.adminRoute}>
              <Button type="primary" icon={<LinkOutlined />}>
                Open {guide.title}
              </Button>
            </Link>
          </Space>
        }
      >
        <div className="doc-layout">
          <nav className="doc-nav no-print" aria-label="All guides">
            {DOCUMENTATION_GROUPS.map((group) => (
              <div key={group.key} className="doc-nav-group">
                <div className="doc-nav-label">{group.label}</div>
                <ul>
                  {group.guides.map((id) => {
                    const href = `/admin/documentation/${id}`;
                    const current = pathname === href || id === guide.id;
                    return (
                      <li key={id}>
                        <Link href={href} aria-current={current ? "page" : undefined}>
                          {getGuideById(id).title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          <article className="doc-article">
            <h2>{guide.title}</h2>
            <div className="doc-divider-line" />
            <p className="doc-summary">{renderGuideText(guide.summary)}</p>
            {guide.whereManaged ? <p>{renderGuideText(guide.whereManaged)}</p> : null}

            {tasks.length > 2 ? (
              <div className="doc-contents no-print">
                <div className="doc-nav-label">On this page</div>
                <ul>
                  {tasks.map((section) => (
                    <li key={section.title}>
                      <a href={`#${getSectionAnchor(section.title)}`}>{section.title}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {tasks.map((section) => (
              <section key={section.title} id={getSectionAnchor(section.title)} className="doc-block">
                <h3>{section.title}</h3>
                {section.paragraph ? <p>{renderGuideText(section.paragraph)}</p> : null}
                {section.steps?.length ? (
                  <ol>
                    {section.steps.map((step, index) => (
                      <li key={index}>{renderGuideText(step)}</li>
                    ))}
                  </ol>
                ) : null}
              </section>
            ))}

            {callouts.map((callout, index) => (
              <div key={index} className={`doc-callout doc-callout-${callout.type || "note"}`}>
                <strong>{callout.type === "warning" ? "Careful: " : "Note: "}</strong>
                {renderGuideText(callout.text)}
              </div>
            ))}

            {tables.map((table, index) => (
              <GuideTable key={index} table={table} />
            ))}

            {keepInMind.length ? (
              <div className="doc-block">
                <h3>Good to know</h3>
                <ul>
                  {keepInMind.map((item, index) => (
                    <li key={index}>{renderGuideText(item)}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="doc-pager no-print">
              {previous ? (
                <Link href={`/admin/documentation/${previous.id}`}>Previous: {previous.title}</Link>
              ) : (
                <span />
              )}
              {next ? <Link href={`/admin/documentation/${next.id}`}>Next: {next.title}</Link> : null}
            </div>
          </article>
        </div>
      </ThemeAdminCard>

      <style jsx global>{`
        .doc-crumb {
          font-size: 15px;
          font-weight: 600;
          color: #111827;
        }
        .doc-crumb a {
          font-weight: 400;
        }
        .doc-print-label {
          display: none;
        }
        .doc-layout {
          display: grid;
          grid-template-columns: 210px minmax(0, 1fr);
          gap: 40px;
          align-items: start;
        }
        .doc-nav {
          position: sticky;
          top: 88px;
          max-height: calc(100vh - 110px);
          overflow-y: auto;
          font-size: 13.5px;
        }
        .doc-nav-group {
          margin-bottom: 16px;
        }
        .doc-nav-label {
          margin-bottom: 4px;
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
        }
        .doc-nav ul,
        .doc-contents ul {
          margin: 0;
          padding: 0;
          list-style: none;
        }
        .doc-nav a {
          display: block;
          padding: 3px 8px;
          margin-left: -8px;
          border-radius: 6px;
          color: #374151;
        }
        .doc-nav a:hover {
          background: #f3f4f6;
          color: #111827;
        }
        .doc-nav a[aria-current="page"] {
          background: #fdecea;
          color: #b92e27;
          font-weight: 600;
        }
        .doc-article {
          max-width: 720px;
          font-size: 15px;
          line-height: 1.65;
          color: #374151;
        }
        .doc-article h2 {
          margin: 0 0 12px;
          font-size: 24px;
          font-weight: 700;
          color: #111827;
        }
        .doc-divider-line {
          margin-bottom: 16px;
          border-bottom: 1.5px solid #111827;
        }
        .doc-article p {
          margin: 0 0 10px;
        }
        .doc-summary {
          font-size: 16px;
          color: #111827;
        }
        .doc-contents {
          margin: 18px 0 8px;
          padding: 12px 16px;
          border-radius: 8px;
          background: #f9fafb;
          font-size: 14px;
        }
        .doc-block {
          margin-top: 26px;
          scroll-margin-top: 90px;
        }
        .doc-block h3 {
          margin: 0 0 8px;
          font-size: 17px;
          font-weight: 600;
          color: #111827;
        }
        .doc-block ol,
        .doc-block ul {
          margin: 0;
          padding-left: 22px;
        }
        .doc-block li {
          margin-bottom: 6px;
        }
        .doc-article strong {
          color: #111827;
          font-weight: 600;
        }
        .doc-article code {
          padding: 1px 5px;
          border-radius: 4px;
          background: #f3f4f6;
          font-size: 13px;
          color: #111827;
        }
        .doc-table-scroll {
          overflow-x: auto;
        }
        .doc-article table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        .doc-article th,
        .doc-article td {
          padding: 9px 12px;
          border: 1px solid #e5e7eb;
          text-align: left;
          vertical-align: top;
        }
        .doc-article th {
          background: #f9fafb;
          font-weight: 600;
          color: #111827;
        }
        .doc-callout {
          margin: 22px 0 0;
          padding: 12px 16px;
          border-left: 3px solid #9ca3af;
          border-radius: 0 6px 6px 0;
          background: #f9fafb;
          font-size: 14.5px;
        }
        .doc-callout-warning {
          border-left-color: #e03c33;
          background: #fdf3f2;
        }
        .doc-pager {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          margin-top: 36px;
          padding-top: 14px;
          border-top: 1px solid #e5e7eb;
          font-size: 14px;
        }
        @media (max-width: 991px) {
          .doc-layout {
            grid-template-columns: minmax(0, 1fr);
          }
          .doc-nav {
            display: none;
          }
        }
      `}</style>

      {/* Print Stylesheet */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 15mm 15mm 15mm 15mm;
          }
          html {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          body {
            background: #ffffff !important;
            color: #111417 !important;
            font-family: Calibri, "Segoe UI", Arial, sans-serif !important;
            font-size: 11pt !important;
            line-height: 1.55 !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-font-smoothing: antialiased;
          }
          .admin-doc-sheet-root {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .no-print,
          .admin-sidebar,
          .admin-sidebar-backdrop,
          .admin-header,
          .admin-route-loader,
          header,
          aside,
          nav {
            display: none !important;
            visibility: hidden !important;
          }
          .admin-content {
            margin: 0 !important;
            margin-left: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: auto !important;
            left: 0 !important;
            background: #ffffff !important;
          }
          .admin-content > div {
            margin-top: 0 !important;
            min-height: auto !important;
            padding: 0 !important;
          }
          .admin-content .ant-layout-content {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .ant-card {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            background: #ffffff !important;
          }
          .ant-card-head {
            border-bottom: none !important;
            padding: 0 !important;
            margin: 0 0 4px 0 !important;
            min-height: auto !important;
          }
          .ant-card-head-title {
            padding: 0 !important;
            font-size: 10.5pt !important;
            color: #6b7076 !important;
            font-weight: 600 !important;
            text-transform: uppercase !important;
            letter-spacing: 0.5px !important;
          }
          .ant-card-body {
            padding: 0 !important;
            margin: 0 !important;
          }
          .doc-layout {
            display: block !important;
          }
          .doc-print-label {
            display: inline !important;
          }
          .doc-article {
            max-width: 100% !important;
          }
          .doc-divider-line {
            border-bottom: 1.5px solid #22262b !important;
            height: 0 !important;
            width: 100% !important;
            display: block !important;
            margin: 6px 0 18px 0 !important;
          }
          h2, .ant-typography h2 {
            font-size: 16pt !important;
            font-weight: 700 !important;
            color: #111417 !important;
            margin: 0 0 6px 0 !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          h3, h4, .ant-typography h4 {
            font-size: 11.5pt !important;
            font-weight: 700 !important;
            color: #111417 !important;
            margin: 16px 0 6px 0 !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          p, .ant-typography {
            font-size: 10.5pt !important;
            color: #22262b !important;
            line-height: 1.5 !important;
            margin-bottom: 8px !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin: 0 0 14px 0 !important;
            font-size: 10pt !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          th, td {
            border: 1px solid #d3d6da !important;
            padding: 6px 10px !important;
            text-align: left !important;
            vertical-align: top !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          th {
            background: #f4f5f6 !important;
            font-weight: 700 !important;
            color: #111417 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          ol, ul {
            margin: 0 0 12px 0 !important;
            padding-left: 20px !important;
          }
          li {
            font-size: 10.5pt !important;
            color: #22262b !important;
            line-height: 1.5 !important;
            margin-bottom: 4px !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .doc-callout {
            background: #f4f5f6 !important;
            border-left: 3px solid #4a5057 !important;
            padding: 10px 14px !important;
            margin: 12px 0 !important;
            font-size: 10pt !important;
            color: #22262b !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
