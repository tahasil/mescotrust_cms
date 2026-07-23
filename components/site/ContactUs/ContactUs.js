"use client";

import { Row, Col } from "antd";
import {
  FullWidthBackground,
  getColor,
  MainTitle,
  PageContainer,
  SubTitle,
} from "@/styles/Theme";
import ContactForm from "@/components/forms/ContactForm";

/**
 * Site component: ContactUs.
 * Wraps ContactForm so it can be used from the Page Builder.
 * All contact info, subject options, and colors are managed from the drawer.
 */
export default function ContactUs(props) {
  /* ── Title fields ── */
  const mainTitle = (props?.mainTitle ?? "").toString().trim();
  const subTitle = (props?.subTitle ?? "").toString().trim();
  const titleEnabled = props?.contactUsTitleEnabled !== false;
  const subTitleEnabled = props?.contactUsSubTitleEnabled !== false;
  const titleColorKey = (props?.titleColorKey ?? "").toString().trim();
  const titleColor = titleColorKey ? getColor(titleColorKey) : getColor("primary");
  const subTitleColorKey = (props?.contactUsSubTitleColorKey ?? "").toString().trim();
  const subTitleColor = subTitleColorKey ? getColor(subTitleColorKey) : undefined;

  /* ── Contact info ── */
  const contactInfo = {
    regdOffice: (props?.contactUsRegdOffice ?? "").toString().trim(),
    adminOffice: (props?.contactUsAdminOffice ?? "").toString().trim(),
    email: (props?.contactUsEmail ?? "").toString().trim(),
    phone: (props?.contactUsPhone ?? "").toString().trim(),
  };

  /* ── Subject options ── */
  const subjectOptions = (props?.contactUsSubjects ?? "").toString().trim()
    ? props.contactUsSubjects.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  /* ── Colors ── */
  const formHeadingColorKey = (props?.contactUsFormHeadingColorKey ?? "").toString().trim();
  const formHeadingColor = formHeadingColorKey ? getColor(formHeadingColorKey) : undefined;
  const formDescColorKey = (props?.contactUsFormDescColorKey ?? "").toString().trim();
  const formDescColor = formDescColorKey ? getColor(formDescColorKey) : undefined;
  const btnBgColorKey = (props?.contactUsBtnBgColorKey ?? "").toString().trim();
  const btnBgColor = btnBgColorKey ? getColor(btnBgColorKey) : undefined;
  const btnTextColorKey = (props?.contactUsBtnTextColorKey ?? "").toString().trim();
  const btnTextColor = btnTextColorKey ? getColor(btnTextColorKey) : undefined;
  const iconColorKey = (props?.contactUsIconColorKey ?? "").toString().trim();
  const iconColor = iconColorKey ? getColor(iconColorKey) : undefined;

  /* ── Map ── */
  const mapEmbedUrl = (props?.contactUsMapEmbedUrl ?? "").toString().trim();

  /* ── Section bg ── */
  const PREFIX = "contactUs";
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
    <FullWidthBackground className={sectionBgClassName} $managedStyle={sectionBgStyle}>
      <PageContainer $managedStyle={pageContainerBgStyle}>
        <div className="fable-section">
        {(titleEnabled || subTitleEnabled) && (mainTitle || subTitle) && (
          <Row gutter={[16, 16]}>
            <Col span={24} className="mb-4">
              {subTitleEnabled && subTitle && (
                <SubTitle className="fable-eyebrow" style={subTitleColor ? { color: subTitleColor } : undefined}>{subTitle}</SubTitle>
              )}
              {titleEnabled && mainTitle && (
                <MainTitle className="fable-heading" color={titleColor}>{mainTitle}</MainTitle>
              )}
            </Col>
          </Row>
        )}
        <ContactForm
          page="contact-us"
          source="page-builder"
          contactInfo={contactInfo}
          infoTitle={(props?.contactUsInfoTitle ?? "Visit, call or write.").toString().trim()}
          subjectOptions={subjectOptions}
          btnBgColor={btnBgColor}
          btnTextColor={btnTextColor}
          iconColor={iconColor}
          formHeadingColor={formHeadingColor}
          formDescColor={formDescColor}
          mapEmbedUrl={mapEmbedUrl}
        />
        </div>
      </PageContainer>
    </FullWidthBackground>
  );
}
