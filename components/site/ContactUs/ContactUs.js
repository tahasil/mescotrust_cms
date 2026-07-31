"use client";

import {
  FullWidthBackground,
  getColor,
  PageContainer,
} from "@/styles/Theme";
import ContactForm from "@/components/forms/ContactForm";

function numberInRange(value, fallback, min, max) {
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? Math.min(max, Math.max(min, parsed))
    : fallback;
}

/**
 * Site component: ContactUs.
 * Wraps ContactForm so it can be used from the Page Builder.
 * All contact info, subject options, and colors are managed from the drawer.
 */
export default function ContactUs(props) {
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
  const btnBgColorKey = (props?.contactUsBtnBgColorKey ?? "").toString().trim();
  const btnBgColor = btnBgColorKey ? getColor(btnBgColorKey) : undefined;
  const btnTextColorKey = (props?.contactUsBtnTextColorKey ?? "").toString().trim();
  const btnTextColor = btnTextColorKey ? getColor(btnTextColorKey) : undefined;
  const resolveColor = (key, fallback) => {
    const value = (props?.[key] ?? "").toString().trim();
    return value ? getColor(value) : getColor(fallback);
  };
  const typography = {
    formHeadingSize: numberInRange(props?.contactUsFormHeadingFontSize, 24, 16, 64),
    formHeadingWeight: numberInRange(props?.contactUsFormHeadingFontWeight, 620, 100, 900),
    formHeadingLineHeight: numberInRange(props?.contactUsFormHeadingLineHeight, 1.2, 0.8, 2.2),
    infoLabelSize: numberInRange(props?.contactUsInfoLabelFontSize, 13, 10, 28),
    infoLabelWeight: numberInRange(props?.contactUsInfoLabelFontWeight, 620, 100, 900),
    infoLabelLineHeight: numberInRange(props?.contactUsInfoLabelLineHeight, 1.4, 0.8, 2.2),
    infoTextSize: numberInRange(props?.contactUsInfoTextFontSize, 13, 10, 28),
    infoTextLineHeight: numberInRange(props?.contactUsInfoTextLineHeight, 1.55, 0.8, 2.2),
    fieldLabelSize: numberInRange(props?.contactUsFieldLabelFontSize, 12, 10, 28),
    fieldLabelLineHeight: numberInRange(props?.contactUsFieldLabelLineHeight, 1.4, 0.8, 2.2),
    inputTextSize: numberInRange(props?.contactUsInputTextFontSize, 13, 10, 28),
    buttonTextSize: numberInRange(props?.contactUsButtonFontSize, 13, 10, 28),
  };

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
        <ContactForm
          page="contact-us"
          source="page-builder"
          contactInfo={contactInfo}
          subjectOptions={subjectOptions}
          btnBgColor={btnBgColor}
          btnTextColor={btnTextColor}
          formHeadingColor={formHeadingColor}
          infoLabelColor={resolveColor("contactUsInfoLabelColorKey", "primary")}
          infoTextColor={resolveColor("contactUsInfoTextColorKey", "blackLight")}
          infoCardBgColor={resolveColor("contactUsInfoCardBgColorKey", "white")}
          infoCardBorderColor={resolveColor("contactUsInfoCardBorderColorKey", "border")}
          formCardBgColor={resolveColor("contactUsFormCardBgColorKey", "white")}
          formCardBorderColor={resolveColor("contactUsFormCardBorderColorKey", "border")}
          fieldLabelColor={resolveColor("contactUsFieldLabelColorKey", "black")}
          inputBgColor={resolveColor("contactUsInputBgColorKey", "white")}
          inputBorderColor={resolveColor("contactUsInputBorderColorKey", "border")}
          inputFocusColor={resolveColor("contactUsInputFocusColorKey", "primary")}
          inputTextColor={resolveColor("contactUsInputTextColorKey", "black")}
          typography={typography}
          mapEmbedUrl={mapEmbedUrl}
        />
        </div>
      </PageContainer>
    </FullWidthBackground>
  );
}
