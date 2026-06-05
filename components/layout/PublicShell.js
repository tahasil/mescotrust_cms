"use client";

import { Fragment } from "react";
import ComponentRenderer from "@/components/cms/ComponentRenderer";
import * as SiteComponents from "@/components/site/publicComponents";
import RoutePopupHost from "@/components/layout/RoutePopupHost";

const hasHeaderBlock = (layout) =>
  Array.isArray(layout) && layout.some((b) => (b?.baseComponent || b?.componentId?.baseComponent) === "Header");
const layoutWithoutHeaderBlocks = (layout) =>
  Array.isArray(layout) ? layout.filter((b) => (b?.baseComponent || b?.componentId?.baseComponent) !== "Header") : [];
const hasFooterBlock = (layout) =>
  Array.isArray(layout) && layout.some((b) => (b?.baseComponent || b?.componentId?.baseComponent) === "Footer");
const layoutWithoutFooterBlocks = (layout) =>
  Array.isArray(layout) ? layout.filter((b) => (b?.baseComponent || b?.componentId?.baseComponent) !== "Footer") : [];

const headerThemeProps = (props) => ({
  menuItems: props.headerItems,
  siteTitle: props.siteTitle,
  logoUrl: props.logoUrl,
  headerSearchEnabled: props.headerSearchEnabled === true,
  headerSearchLabel: props.headerSearchLabel ?? "",
  headerSearchOpenAriaLabel: props.headerSearchOpenAriaLabel ?? "",
  headerSearchPlaceholder: props.headerSearchPlaceholder ?? "",
  headerSearchDialogLabel: props.headerSearchDialogLabel ?? "",
  headerSearchInputAriaLabel: props.headerSearchInputAriaLabel ?? "",
  headerSearchCloseAriaLabel: props.headerSearchCloseAriaLabel ?? "",
  headerSearchMinCharsMessage: props.headerSearchMinCharsMessage ?? "",
  headerSearchLoadingMessage: props.headerSearchLoadingMessage ?? "",
  headerSearchNoResultsMessage: props.headerSearchNoResultsMessage ?? "",
  headerSearchErrorMessage: props.headerSearchErrorMessage ?? "",
  headerSearchResultTypePageLabel: props.headerSearchResultTypePageLabel ?? "",
  headerSearchResultTypeBlogLabel: props.headerSearchResultTypeBlogLabel ?? "",
  headerSearchResultTypeEventLabel: props.headerSearchResultTypeEventLabel ?? "",
  headerSearchFallbackTitle: props.headerSearchFallbackTitle ?? "",
  headerSearchFallbackMeta: props.headerSearchFallbackMeta ?? "",
  logoType: props.logoType,
  logoImageUrl: props.logoImageUrl,
  logoLightUrl: props.logoLightUrl,
  logoMobileUrl: props.logoMobileUrl,
  logoDarkUrl: props.logoDarkUrl,
  sticky: props.headerSticky,
  transparent: props.headerTransparent,
  layout: props.headerLayout,
  volunteerLabel: props.headerVolunteerLabel,
  volunteerHref: props.headerVolunteerHref,
  volunteerIconUrl: props.headerVolunteerIconUrl,
  volunteerIconUrlMobile: props.headerVolunteerIconUrlMobile,
  donateLabel: props.headerDonateLabel,
  donateHref: props.headerDonateHref,
  donateIconUrl: props.headerDonateIconUrl,
  donateIconUrlMobile: props.headerDonateIconUrlMobile,
  headerBgValue: props.headerBgValue ?? "",
  headerCtaBgValue: props.headerCtaBgValue ?? "",
  headerCtaTextValue: props.headerCtaTextValue ?? "",
  headerDonateBgValue: props.headerDonateBgValue ?? "",
  headerDonateTextValue: props.headerDonateTextValue ?? "",
  volunteerModalTitle: props.volunteerModalTitle ?? "",
  volunteerModalSuccessTitle: props.volunteerModalSuccessTitle ?? "",
  volunteerModalSuccessDescription: props.volunteerModalSuccessDescription ?? "",
  volunteerModalErrorTitle: props.volunteerModalErrorTitle ?? "",
  volunteerModalNameLabel: props.volunteerModalNameLabel ?? "",
  volunteerModalEmailLabel: props.volunteerModalEmailLabel ?? "",
  volunteerModalSubjectLabel: props.volunteerModalSubjectLabel ?? "",
  volunteerModalMessageLabel: props.volunteerModalMessageLabel ?? "",
  volunteerModalNamePlaceholder: props.volunteerModalNamePlaceholder ?? "",
  volunteerModalEmailPlaceholder: props.volunteerModalEmailPlaceholder ?? "",
  volunteerModalSubjectPlaceholder: props.volunteerModalSubjectPlaceholder ?? "",
  volunteerModalMessagePlaceholder: props.volunteerModalMessagePlaceholder ?? "",
  volunteerModalCancelLabel: props.volunteerModalCancelLabel ?? "",
  volunteerModalSendLabel: props.volunteerModalSendLabel ?? "",
  volunteerModalSendingLabel: props.volunteerModalSendingLabel ?? "",
  volunteerModalNameRequiredMessage: props.volunteerModalNameRequiredMessage ?? "",
  volunteerModalEmailRequiredMessage: props.volunteerModalEmailRequiredMessage ?? "",
  volunteerModalEmailInvalidMessage: props.volunteerModalEmailInvalidMessage ?? "",
  volunteerModalSubjectRequiredMessage: props.volunteerModalSubjectRequiredMessage ?? "",
  volunteerModalSubjectMinMessage: props.volunteerModalSubjectMinMessage ?? "",
  volunteerModalMessageRequiredMessage: props.volunteerModalMessageRequiredMessage ?? "",
  volunteerModalMessageMinMessage: props.volunteerModalMessageMinMessage ?? "",
  volunteerModalBtnBg: props.volunteerModalBtnBg ?? "",
  volunteerModalBtnText: props.volunteerModalBtnText ?? "",
  volunteerModalCancelColor: props.volunteerModalCancelColor ?? "",
  sectionBg: props.headerSectionBg ?? "",
  sectionPadding: props.headerSectionPadding ?? "",
  sectionBorderSize: props.headerSectionBorderSize ?? "",
  sectionBorderStyle: props.headerSectionBorderStyle ?? "",
  sectionBorderColor: props.headerSectionBorderColor ?? "",
  sectionShadow: props.headerSectionShadow ?? "",
});

const footerThemeProps = (props) => ({
  siteTitle: props.siteTitle,
  footerLogoUrl: props.footerLogoUrl,
  footerAddress: props.footerAddress,
  footerEmail: props.footerEmail,
  footerPhone: props.footerPhone,
  footerCol1Links: props.footerCol1Links || [],
  footerCol2Links: props.footerCol2Links || [],
  footerSocialLinks: props.footerSocialLinks || [],
  footerCopyrightText: props.footerCopyrightText,
  footerBgValue: props.footerBgValue ?? "",
  footerBackgroundImageUrl: props.footerBackgroundImageUrl ?? "",
  footerTextValue: props.footerTextValue ?? "",
  footerCopyrightBarValue: props.footerCopyrightBarValue ?? "",
  menuItems: props.footerItems,
  columnsCount: props.footerColumnsCount,
  socialIcons: props.footerSocialIcons,
  layoutStyle: props.footerLayoutStyle,
});

export default function PublicShell({
  globalTheme = {},
  headerItems,
  footerItems,
  customHeaderLayout,
  customFooterLayout,
  globalBefore = [],
  globalAfter = [],
  siteTitle,
  tagline,
  logoUrl,
  headerSearchEnabled,
  headerSearchLabel,
  headerSearchOpenAriaLabel,
  headerSearchPlaceholder,
  headerSearchDialogLabel,
  headerSearchInputAriaLabel,
  headerSearchCloseAriaLabel,
  headerSearchMinCharsMessage,
  headerSearchLoadingMessage,
  headerSearchNoResultsMessage,
  headerSearchErrorMessage,
  headerSearchResultTypePageLabel,
  headerSearchResultTypeBlogLabel,
  headerSearchResultTypeEventLabel,
  headerSearchFallbackTitle,
  headerSearchFallbackMeta,
  logoType,
  logoImageUrl,
  logoLightUrl,
  logoMobileUrl,
  logoDarkUrl,
  footerCopyrightText,
  headerSticky,
  headerTransparent,
  headerLayout,
  headerVolunteerLabel,
  headerVolunteerHref,
  headerVolunteerIconUrl,
  headerVolunteerIconUrlMobile,
  headerDonateLabel,
  headerDonateHref,
  headerDonateIconUrl,
  headerDonateIconUrlMobile,
  headerBgValue,
  headerCtaBgValue,
  headerCtaTextValue,
  headerDonateBgValue,
  headerDonateTextValue,
  volunteerModalTitle,
  volunteerModalSuccessTitle,
  volunteerModalSuccessDescription,
  volunteerModalErrorTitle,
  volunteerModalNameLabel,
  volunteerModalEmailLabel,
  volunteerModalSubjectLabel,
  volunteerModalMessageLabel,
  volunteerModalNamePlaceholder,
  volunteerModalEmailPlaceholder,
  volunteerModalSubjectPlaceholder,
  volunteerModalMessagePlaceholder,
  volunteerModalCancelLabel,
  volunteerModalSendLabel,
  volunteerModalSendingLabel,
  volunteerModalNameRequiredMessage,
  volunteerModalEmailRequiredMessage,
  volunteerModalEmailInvalidMessage,
  volunteerModalSubjectRequiredMessage,
  volunteerModalSubjectMinMessage,
  volunteerModalMessageRequiredMessage,
  volunteerModalMessageMinMessage,
  volunteerModalBtnBg,
  volunteerModalBtnText,
  volunteerModalCancelColor,
  headerSectionBg,
  headerSectionPadding,
  headerSectionBorderSize,
  headerSectionBorderStyle,
  headerSectionBorderColor,
  headerSectionShadow,
  footerColumnsCount,
  footerSocialIcons,
  footerLayoutStyle,
  footerLogoUrl,
  footerAddress,
  footerEmail,
  footerPhone,
  footerCol1Links,
  footerCol2Links,
  footerSocialLinks,
  footerBgValue,
  footerBackgroundImageUrl,
  footerTextValue,
  footerCopyrightBarValue,
  children,
}) {
  const hasCustomHeader = Array.isArray(customHeaderLayout) && customHeaderLayout.length > 0;
  const hasCustomFooter = Array.isArray(customFooterLayout) && customFooterLayout.length > 0;

  const themeProps = {
    headerItems,
    footerItems,
    siteTitle,
    tagline,
    logoUrl,
    headerSearchEnabled,
    headerSearchLabel,
    headerSearchOpenAriaLabel,
    headerSearchPlaceholder,
    headerSearchDialogLabel,
    headerSearchInputAriaLabel,
    headerSearchCloseAriaLabel,
    headerSearchMinCharsMessage,
    headerSearchLoadingMessage,
    headerSearchNoResultsMessage,
    headerSearchErrorMessage,
    headerSearchResultTypePageLabel,
    headerSearchResultTypeBlogLabel,
    headerSearchResultTypeEventLabel,
    headerSearchFallbackTitle,
    headerSearchFallbackMeta,
    logoType,
    logoImageUrl,
    logoLightUrl,
    logoMobileUrl,
    logoDarkUrl,
    footerCopyrightText,
    headerSticky,
    headerTransparent,
    headerLayout,
    headerVolunteerLabel,
    headerVolunteerHref,
    headerVolunteerIconUrl,
    headerVolunteerIconUrlMobile,
    headerDonateLabel,
    headerDonateHref,
    headerDonateIconUrl,
    headerDonateIconUrlMobile,
    headerBgValue,
    headerCtaBgValue,
    headerCtaTextValue,
    headerDonateBgValue,
    headerDonateTextValue,
    volunteerModalTitle,
    volunteerModalSuccessTitle,
    volunteerModalSuccessDescription,
    volunteerModalErrorTitle,
    volunteerModalNameLabel,
    volunteerModalEmailLabel,
    volunteerModalSubjectLabel,
    volunteerModalMessageLabel,
    volunteerModalNamePlaceholder,
    volunteerModalEmailPlaceholder,
    volunteerModalSubjectPlaceholder,
    volunteerModalMessagePlaceholder,
    volunteerModalCancelLabel,
    volunteerModalSendLabel,
    volunteerModalSendingLabel,
    volunteerModalNameRequiredMessage,
    volunteerModalEmailRequiredMessage,
    volunteerModalEmailInvalidMessage,
    volunteerModalSubjectRequiredMessage,
    volunteerModalSubjectMinMessage,
    volunteerModalMessageRequiredMessage,
    volunteerModalMessageMinMessage,
    volunteerModalBtnBg,
    volunteerModalBtnText,
    volunteerModalCancelColor,
    headerSectionBg,
    headerSectionPadding,
    headerSectionBorderSize,
    headerSectionBorderStyle,
    headerSectionBorderColor,
    headerSectionShadow,
    footerColumnsCount,
    footerSocialIcons,
    footerLayoutStyle,
    footerLogoUrl,
    footerAddress,
    footerEmail,
    footerPhone,
    footerCol1Links,
    footerCol2Links,
    footerSocialLinks,
    footerBgValue,
    footerBackgroundImageUrl,
    footerTextValue,
    footerCopyrightBarValue,
  };

  const renderGlobalComponent = (id, key) => {
    const Comp = SiteComponents[id];
    if (!Comp) return null;
    if (id === "Header") return <Comp key={key ?? id} {...headerThemeProps(themeProps)} />;
    if (id === "Footer") return <Comp key={key ?? id} {...footerThemeProps(themeProps)} />;
    return <Comp key={key ?? id} {...globalTheme} />;
  };

  const beforeGlobalIds = Array.isArray(globalBefore) ? globalBefore : [];
  const afterGlobalIds = Array.isArray(globalAfter) ? globalAfter : [];
  const hasGlobalHeader = beforeGlobalIds.includes("Header");
  const hasGlobalFooter = afterGlobalIds.includes("Footer");

  const useSiteHeaderForLayout =
    hasCustomHeader && hasHeaderBlock(customHeaderLayout);
  const useSiteFooterForLayout =
    hasCustomFooter && hasFooterBlock(customFooterLayout);

  const fallbackHeader =
    useSiteHeaderForLayout ? (
      <SiteComponents.Header key="site-header" {...headerThemeProps(themeProps)} />
    ) : hasCustomHeader ? (
      <ComponentRenderer layout={customHeaderLayout} />
    ) : (
      <SiteComponents.Header key="site-header" {...headerThemeProps(themeProps)} />
    );
  const fallbackFooter =
    useSiteFooterForLayout ? (
      <SiteComponents.Footer key="site-footer" {...footerThemeProps(themeProps)} />
    ) : hasCustomFooter ? (
      <ComponentRenderer layout={customFooterLayout} />
    ) : (
      <SiteComponents.Footer key="site-footer" {...footerThemeProps(themeProps)} />
    );
  const beforeRenderOrder = hasGlobalHeader
    ? beforeGlobalIds
    : ["__fallback_header__", ...beforeGlobalIds];
  const afterRenderOrder = hasGlobalFooter
    ? afterGlobalIds
    : [...afterGlobalIds, "__fallback_footer__"];

  return (
    <div className="public-site" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <RoutePopupHost />
      {beforeRenderOrder.map((id, index) =>
        id === "__fallback_header__"
          ? <Fragment key={`fallback-header-${index}`}>{fallbackHeader}</Fragment>
          : renderGlobalComponent(id, `before-${id}-${index}`),
      )}
      {!hasGlobalHeader && useSiteHeaderForLayout && layoutWithoutHeaderBlocks(customHeaderLayout).length > 0 && (
        <ComponentRenderer layout={layoutWithoutHeaderBlocks(customHeaderLayout)} />
      )}
      <div style={{ flex: 1 }}>{children}</div>
      {afterRenderOrder.map((id, index) =>
        id === "__fallback_footer__"
          ? <Fragment key={`fallback-footer-${index}`}>{fallbackFooter}</Fragment>
          : renderGlobalComponent(id, `after-${id}-${index}`),
      )}
      {!hasGlobalFooter && useSiteFooterForLayout && layoutWithoutFooterBlocks(customFooterLayout).length > 0 && (
        <ComponentRenderer layout={layoutWithoutFooterBlocks(customFooterLayout)} />
      )}
    </div>
  );
}
