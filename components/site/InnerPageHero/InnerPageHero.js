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
  const titleColorKey = (props?.titleColorKey ?? "").toString().trim();
  const titleColor = titleColorKey ? getColor(titleColorKey) : undefined;
  const descriptionColorKey = (props?.innerPageHeroDescriptionColorKey ?? "")
    .toString()
    .trim();
  const descriptionColor = descriptionColorKey
    ? getColor(descriptionColorKey)
    : undefined;
  const breadcrumbLegacyColorKey = (
    props?.innerPageHeroBreadcrumbColorKey ?? ""
  )
    .toString()
    .trim();
  const breadcrumbColor1Key = (
    props?.innerPageHeroBreadcrumbColor1Key || breadcrumbLegacyColorKey
  )
    .toString()
    .trim();
  const breadcrumbColor2Key = (
    props?.innerPageHeroBreadcrumbColor2Key || breadcrumbLegacyColorKey
  )
    .toString()
    .trim();
  const breadcrumbColor1 = breadcrumbColor1Key
    ? getColor(breadcrumbColor1Key)
    : undefined;
  const breadcrumbColor2 = breadcrumbColor2Key
    ? getColor(breadcrumbColor2Key)
    : undefined;
  const breadcrumbPrimaryStyle = breadcrumbColor1
    ? { color: breadcrumbColor1 }
    : undefined;
  const breadcrumbCurrentStyle = breadcrumbColor2
    ? { color: breadcrumbColor2 }
    : undefined;
  const breadcrumbSeparator = (
    <span style={breadcrumbPrimaryStyle}>{"/"}</span>
  );

  /* ── Breadcrumb ── */
  const rawBreadcrumb = props?.breadcrumbItems;
  const baseBreadcrumbItems =
    Array.isArray(rawBreadcrumb) && rawBreadcrumb.length > 0
      ? rawBreadcrumb
      : [{ label: "Home", href: "/" }, { label: title, href: "" }];
  const lastIndex = Math.max(0, baseBreadcrumbItems.length - 1);
  const breadcrumbItems = baseBreadcrumbItems.map((item, index) => {
    const label = item?.label || (index === 0 ? "Home" : "");
    const href = item?.href || "";
    const isCurrent = index === lastIndex;
    const textStyle = isCurrent ? breadcrumbCurrentStyle : breadcrumbPrimaryStyle;

    if (index === 0) {
      return {
        title: href ? (
          <Link href={href} style={textStyle}>
            <HomeOutlined /> {label}
          </Link>
        ) : (
          <span style={textStyle}>
            <HomeOutlined /> {label}
          </span>
        ),
      };
    }

    return {
      title:
        href && !isCurrent ? (
          <Link href={href} style={textStyle}>
            {label}
          </Link>
        ) : (
          <span style={textStyle}>{label}</span>
        ),
    };
  });

  /* ── Background image ── */
  const bgImageDesktop = (
    props?.bgImageDesktop ?? props?.bgImage ?? ""
  )
    .toString()
    .trim();
  const bgImageMobile = (props?.bgImageMobile ?? "").toString().trim();
  const bannerStyle = {
    ...(bgImageDesktop ? { "--inner-banner-bg": `url(${bgImageDesktop})` } : {}),
    ...(bgImageMobile
      ? { "--inner-banner-bg-mobile": `url(${bgImageMobile})` }
      : {}),
  };

  return (
    <InnerBanner style={bannerStyle}>
      <PageContainer>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={14} className="inner-banner-content">
            <Breadcrumb
              className="inner-banner-breadcrumb"
              separator={breadcrumbSeparator}
              items={breadcrumbItems}
            />
            <MainTitle className="mb-0" color={titleColor}>
              {title}
            </MainTitle>
          </Col>
          <Col xs={24} md={10}>
            {description && (
              <p
                className="innerBannerDesc"
                style={descriptionColor ? { color: descriptionColor } : undefined}
              >
                {description}
              </p>
            )}
          </Col>
        </Row>
      </PageContainer>
    </InnerBanner>
  );
}
