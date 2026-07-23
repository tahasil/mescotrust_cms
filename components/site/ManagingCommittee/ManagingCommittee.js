"use client";

import {
  FullWidthBackground,
  getColor,
  PageContainer,
} from "@/styles/Theme";
import SafeHtml from "@/components/cms/SafeHtml";

/**
 * Site component: ManagingCommittee.
 * Two-column layout: image left, title + paragraph right.
 */
export default function ManagingCommittee(props) {
  const subTitle = (props?.managingCommitteeSubTitle ?? "").toString().trim();
  const mainTitle = (props?.managingCommitteeMainTitle ?? "Managing Committee").toString().trim();
  const paragraph = (props?.managingCommitteeParagraph ?? "").toString().trim();
  const imageDesktop = (
    props?.managingCommitteeImageDesktop ??
    props?.managingCommitteeImageUrl ??
    "/images/good-governance-2.png"
  )
    .toString()
    .trim();
  const imageMobile = (props?.managingCommitteeImageMobile ?? "").toString().trim();
  const imageAlt = (props?.managingCommitteeImageAlt ?? "Managing Committee").toString().trim();

  const titleColorKey = (props?.managingCommitteeTitleColorKey ?? "").toString().trim();
  const titleColor = titleColorKey ? getColor(titleColorKey) : undefined;
  const textColorKey = (props?.managingCommitteeTextColorKey ?? "").toString().trim();
  const textColor = textColorKey ? getColor(textColorKey) : undefined;
  const subTitleColorKey = (props?.managingCommitteeSubTitleColorKey ?? "").toString().trim();
  const subTitleColor = subTitleColorKey ? getColor(subTitleColorKey) : getColor("primary");

  const PREFIX = "managingCommittee";

  const sectionBgType = (props?.[PREFIX + "SectionBgType"] ?? "default").toString();
  const sectionBgImage = (props?.[PREFIX + "SectionBgImage"] ?? "").toString().trim();
  const sectionBgColorKey = (props?.[PREFIX + "SectionBgColorKey"] ?? "").toString().trim();
  const sectionBgClassName = sectionBgType === "default" ? "defaultBackground" : undefined;
  const sectionBgStyleBase =
    sectionBgType === "image" && sectionBgImage
      ? { backgroundImage: `url(${sectionBgImage})`, backgroundSize: "cover", backgroundPosition: "center center", backgroundRepeat: "no-repeat" }
      : sectionBgType === "color" && sectionBgColorKey
        ? { backgroundColor: getColor(sectionBgColorKey), backgroundImage: "none" }
        : undefined;
  const sectionPaddingTop = props?.[PREFIX + "SectionPaddingTop"] != null ? Number(props[PREFIX + "SectionPaddingTop"]) : null;
  const sectionPaddingBottom = props?.[PREFIX + "SectionPaddingBottom"] != null ? Number(props[PREFIX + "SectionPaddingBottom"]) : null;
  const sectionMarginTop = props?.[PREFIX + "SectionMarginTop"] != null ? Number(props[PREFIX + "SectionMarginTop"]) : null;
  const sectionMarginBottom = props?.[PREFIX + "SectionMarginBottom"] != null ? Number(props[PREFIX + "SectionMarginBottom"]) : null;
  const sectionBgStyle =
    sectionBgStyleBase || sectionPaddingTop != null || sectionPaddingBottom != null || sectionMarginTop != null || sectionMarginBottom != null
      ? {
          ...(sectionBgStyleBase || {}),
          ...(sectionPaddingTop != null && sectionPaddingTop >= 0 ? { paddingTop: `${sectionPaddingTop}px` } : {}),
          ...(sectionPaddingBottom != null && sectionPaddingBottom >= 0 ? { paddingBottom: `${sectionPaddingBottom}px` } : {}),
          ...(sectionMarginTop != null && sectionMarginTop >= 0 ? { marginTop: `${sectionMarginTop}px` } : {}),
          ...(sectionMarginBottom != null && sectionMarginBottom >= 0 ? { marginBottom: `${sectionMarginBottom}px` } : {}),
        }
      : undefined;

  const pageContainerBgType = (props?.[PREFIX + "PageContainerBgType"] ?? "default").toString();
  const pageContainerBgImage = (props?.[PREFIX + "PageContainerBgImage"] ?? "").toString().trim();
  const pageContainerBgColorKey = (props?.[PREFIX + "PageContainerBgColorKey"] ?? "").toString().trim();
  const pageContainerBgStyleBase =
    pageContainerBgType === "image" && pageContainerBgImage
      ? { backgroundImage: `url(${pageContainerBgImage})`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }
      : pageContainerBgType === "color" && pageContainerBgColorKey
        ? { backgroundColor: getColor(pageContainerBgColorKey), backgroundImage: "none" }
        : undefined;
  const containerPaddingTop = props?.[PREFIX + "PageContainerPaddingTop"] != null ? Number(props[PREFIX + "PageContainerPaddingTop"]) : null;
  const containerPaddingRight = props?.[PREFIX + "PageContainerPaddingRight"] != null ? Number(props[PREFIX + "PageContainerPaddingRight"]) : null;
  const containerPaddingBottom = props?.[PREFIX + "PageContainerPaddingBottom"] != null ? Number(props[PREFIX + "PageContainerPaddingBottom"]) : null;
  const containerPaddingLeft = props?.[PREFIX + "PageContainerPaddingLeft"] != null ? Number(props[PREFIX + "PageContainerPaddingLeft"]) : null;
  const containerMarginTop = props?.[PREFIX + "PageContainerMarginTop"] != null ? Number(props[PREFIX + "PageContainerMarginTop"]) : null;
  const containerMarginBottom = props?.[PREFIX + "PageContainerMarginBottom"] != null ? Number(props[PREFIX + "PageContainerMarginBottom"]) : null;
  const pageContainerBgStyle =
    pageContainerBgStyleBase || containerPaddingTop != null || containerPaddingRight != null || containerPaddingBottom != null || containerPaddingLeft != null || containerMarginTop != null || containerMarginBottom != null
      ? {
          ...(pageContainerBgStyleBase || {}),
          ...(containerPaddingTop != null && containerPaddingTop >= 0 ? { paddingTop: `${containerPaddingTop}px` } : {}),
          ...(containerPaddingRight != null && containerPaddingRight >= 0 ? { paddingRight: `${containerPaddingRight}px` } : {}),
          ...(containerPaddingBottom != null && containerPaddingBottom >= 0 ? { paddingBottom: `${containerPaddingBottom}px` } : {}),
          ...(containerPaddingLeft != null && containerPaddingLeft >= 0 ? { paddingLeft: `${containerPaddingLeft}px` } : {}),
          ...(containerMarginTop != null && containerMarginTop >= 0 ? { marginTop: `${containerMarginTop}px` } : {}),
          ...(containerMarginBottom != null && containerMarginBottom >= 0 ? { marginBottom: `${containerMarginBottom}px` } : {}),
        }
      : undefined;

  return (
    <FullWidthBackground className={sectionBgClassName} style={sectionBgStyle}>
      <PageContainer style={pageContainerBgStyle}>
        <div className="fable-section fable-scheme fable-split">
          <div className="fable-media fable-media--intrinsic">
            {imageDesktop || imageMobile ? (
              <picture>
                {imageMobile ? (
                  <source media="(max-width: 767px)" srcSet={imageMobile} />
                ) : null}
                <img
                  loading="lazy"
                  src={imageDesktop || imageMobile}
                  alt={imageAlt}
                />
              </picture>
            ) : (
              <div aria-hidden="true" />
            )}
          </div>
          <div>
            {subTitle ? <p className="fable-eyebrow" style={{ color: subTitleColor }}>{subTitle}</p> : null}
            <h2
              className="fable-heading"
              style={titleColor ? { color: titleColor } : undefined}
            >
              {String(mainTitle).split(/(\*[^*]+\*)/g).map((part, index) => part.startsWith("*") && part.endsWith("*") ? <em key={index}>{part.slice(1, -1)}</em> : <span key={index}>{part}</span>)}
            </h2>
            {paragraph && (
              <div
                className="fable-prose"
                style={textColor ? { color: textColor } : undefined}
              >
                <SafeHtml html={paragraph} />
              </div>
            )}
          </div>
        </div>
      </PageContainer>
    </FullWidthBackground>
  );
}
