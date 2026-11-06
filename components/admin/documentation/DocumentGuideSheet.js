"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Typography,
  Button,
  Space,
} from "antd";
import {
  ArrowLeftOutlined,
  PrinterOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import {
  ADMIN_MODULE_GUIDES,
  getGuideById,
} from "@/lib/documentation/adminGuidesData";
import { ThemeAdminCard } from "@/styles/Theme";

const { Title, Text, Paragraph } = Typography;

export default function DocumentGuideSheet({ moduleKey }) {
  const guide = useMemo(() => {
    return getGuideById(moduleKey) || ADMIN_MODULE_GUIDES[0];
  }, [moduleKey]);

  const currentIndex = ADMIN_MODULE_GUIDES.findIndex((m) => m.id === guide.id);
  const prevModule =
    ADMIN_MODULE_GUIDES[
      (currentIndex - 1 + ADMIN_MODULE_GUIDES.length) %
        ADMIN_MODULE_GUIDES.length
    ];
  const nextModule =
    ADMIN_MODULE_GUIDES[(currentIndex + 1) % ADMIN_MODULE_GUIDES.length];

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="admin-doc-sheet-root" style={{ padding: "8px 0 50px 0" }}>
      <ThemeAdminCard
        title={
          <span style={{ fontSize: 16, fontWeight: 600, color: "#111827" }}>
            Admin panel guide
          </span>
        }
        extra={
          <Space wrap className="no-print">
            <Button icon={<PrinterOutlined />} onClick={handlePrint}>
              Print / Save PDF
            </Button>
            <Link href={guide.adminRoute}>
              <Button type="primary" icon={<LinkOutlined />}>
                Open page
              </Button>
            </Link>
          </Space>
        }
      >
        {/* Module Title inside the card */}
        <div style={{ marginBottom: 24 }}>
          <Title
            level={2}
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "#111827",
              margin: "4px 0 16px 0",
            }}
          >
            {guide.documentTitle || guide.title}
          </Title>
          {/* Bottom border dividing line */}
          <div
            className="doc-divider-line"
            style={{
              borderBottom: "1.5px solid #111827",
              width: "100%",
              marginBottom: 20,
            }}
          />
        </div>

        {/* Where Managed Context */}
        {guide.whereManaged && (
          <div style={{ marginBottom: 24 }}>
            <Title level={4} style={{ fontSize: 15, fontWeight: 600, margin: "0 0 8px 0" }}>
              Where the module is managed
            </Title>
            <Paragraph style={{ fontSize: 14, color: "#374151", lineHeight: 1.6, margin: 0 }}>
              {guide.whereManaged}
            </Paragraph>
          </div>
        )}

        {/* Tables (e.g. Draft and Published, Slider Component IDs, Fields) */}
        {guide.tables &&
          guide.tables.map((table, tIdx) => (
            <div key={tIdx} style={{ marginBottom: 26 }}>
              {table.title && (
                <Title level={4} style={{ fontSize: 15, fontWeight: 600, margin: "0 0 6px 0" }}>
                  {table.title}
                </Title>
              )}
              {table.subtitle && (
                <Paragraph style={{ fontSize: 13.5, color: "#4b5563", marginBottom: 12 }}>
                  {table.subtitle}
                </Paragraph>
              )}

              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 13.5,
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <thead>
                    <tr style={{ background: "#f9fafb" }}>
                      {table.headers.map((h, hIdx) => (
                        <th
                          key={hIdx}
                          style={{
                            padding: "10px 14px",
                            textAlign: "left",
                            fontWeight: 600,
                            color: "#111827",
                            borderBottom: "1px solid #e5e7eb",
                            borderRight:
                              hIdx < table.headers.length - 1
                                ? "1px solid #e5e7eb"
                                : "none",
                            width: hIdx === 0 ? "35%" : "auto",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        style={{
                          background: rIdx % 2 === 0 ? "#ffffff" : "#fdfdfd",
                        }}
                      >
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            style={{
                              padding: "10px 14px",
                              color: "#374151",
                              lineHeight: 1.5,
                              borderBottom:
                                rIdx < table.rows.length - 1
                                  ? "1px solid #e5e7eb"
                                  : "none",
                              borderRight:
                                cIdx < row.length - 1
                                  ? "1px solid #e5e7eb"
                                  : "none",
                              fontWeight: cIdx === 0 ? 500 : 400,
                            }}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

        {/* Numbered Sections & Action Workflows */}
        {guide.sections &&
          guide.sections.map((sec, sIdx) => (
            <div key={sIdx} style={{ marginBottom: 24 }}>
              <Title
                level={4}
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#111827",
                  margin: "0 0 10px 0",
                }}
              >
                {sec.title}
              </Title>

              {sec.paragraph && (
                <Paragraph
                  style={{
                    fontSize: 14,
                    color: "#374151",
                    lineHeight: 1.6,
                    marginBottom: sec.steps ? 12 : 0,
                  }}
                >
                  {sec.paragraph}
                </Paragraph>
              )}

              {sec.steps && (
                <ol
                  style={{
                    margin: 0,
                    paddingLeft: 20,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  {sec.steps.map((st, stepIdx) => (
                    <li
                      key={stepIdx}
                      style={{
                        fontSize: 14,
                        color: "#374151",
                        lineHeight: 1.6,
                      }}
                    >
                      {st}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ))}

        {/* Callout Boxes (Cautions / Important Rules) */}
        {guide.callouts &&
          guide.callouts.map((c, cIdx) => (
            <div
              key={cIdx}
              className="doc-callout"
              style={{
                background: "#f9fafb",
                borderLeft: "4px solid #4b5563",
                padding: "14px 18px",
                margin: "20px 0",
                borderRadius: "0 6px 6px 0",
                fontSize: 13.5,
                color: "#1f2937",
                lineHeight: 1.6,
                fontStyle: "italic",
              }}
            >
              {c.text}
            </div>
          ))}

        {/* "A few things to keep in mind" Section */}
        {guide.keepInMind && guide.keepInMind.length > 0 && (
          <div style={{ marginTop: 24, marginBottom: 12 }}>
            <Title
              level={4}
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "#111827",
                margin: "0 0 10px 0",
              }}
            >
              A few things to keep in mind
            </Title>

            <ul
              style={{
                margin: 0,
                paddingLeft: 20,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {guide.keepInMind.map((item, kIdx) => (
                <li
                  key={kIdx}
                  style={{
                    fontSize: 14,
                    color: "#374151",
                    lineHeight: 1.6,
                  }}
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Bottom Fast Navigation Bar (Only Previous and Next buttons) */}
        <div
          className="no-print"
          style={{
            marginTop: 36,
            paddingTop: 16,
            borderTop: "1px solid #f0f0f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Link href={`/admin/documentation/${prevModule.id}`}>
            <Button icon={<ArrowLeftOutlined />}>
              Previous
            </Button>
          </Link>

          <Link href={`/admin/documentation/${nextModule.id}`}>
            <Button type="primary">
              Next →
            </Button>
          </Link>
        </div>
      </ThemeAdminCard>

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
          h4, .ant-typography h4 {
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
