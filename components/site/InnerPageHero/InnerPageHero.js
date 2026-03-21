"use client";

import Link from "next/link";
import { Row, Col, Breadcrumb } from "antd";
import { HomeOutlined } from "@ant-design/icons";
import {
  InnerBanner,
  getColor,
  MainTitle,
  PageContainer,
} from "@/styles/Theme";

/**
 * Site component: InnerPageHero.
 * Inner page banner with breadcrumb, title, and description.
 * All elements are editable via EditForm.
 */
export default function InnerPageHero(props) {
  /* ── Content ── */
  const title = (props?.title ?? "Page Title").toString().trim();
  const description = (props?.description ?? "").toString().trim();

  /* ── Breadcrumb ── */
  const rawBreadcrumb = props?.breadcrumbItems;
  const breadcrumbItems = Array.isArray(rawBreadcrumb) && rawBreadcrumb.length > 0
    ? rawBreadcrumb.map((item, i) => ({
        title: i === 0 ? (
          item.href ? (
            <Link href={item.href}>
              <HomeOutlined /> {item.label || "Home"}
            </Link>
          ) : (
            <><HomeOutlined /> {item.label || "Home"}</>
          )
        ) : item.href ? (
          <Link href={item.href}>{item.label || ""}</Link>
        ) : (
          item.label || ""
        ),
      }))
    : [
        { title: <Link href="/"><HomeOutlined /> Home</Link> },
        { title: title },
      ];

  /* ── Background image ── */
  const bgImage = (props?.bgImage ?? "").toString().trim();
  const bannerStyle = bgImage
    ? { backgroundImage: `url(${bgImage})` }
    : undefined;

  return (
    <InnerBanner style={bannerStyle}>
      <PageContainer>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={14} className="inner-banner-content">
            <Breadcrumb
              className="inner-banner-breadcrumb"
              items={breadcrumbItems}
            />
            <MainTitle className="mb-0">{title}</MainTitle>
          </Col>
          <Col xs={24} md={10}>
            {description && (
              <p className="innerBannerDesc">{description}</p>
            )}
          </Col>
        </Row>
      </PageContainer>
    </InnerBanner>
  );
}
