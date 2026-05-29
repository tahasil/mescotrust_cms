"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styled, { css } from "styled-components";
import {
  FacebookFilled,
  GlobalOutlined,
  InstagramFilled,
  LinkedinFilled,
  YoutubeFilled,
} from "@ant-design/icons";
import { FullWidthBackground, MainTitle, PageContainer, getColor } from "@/styles/Theme";
import { ensureMailto, normalizeTargetFromItem } from "@/lib/linkUtils";

const TeamBlock = styled.section`
  width: 100%;
`;

const TeamHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: ${(p) =>
    p.$align === "center"
      ? "center"
      : p.$align === "right"
        ? "flex-end"
        : "space-between"};
  gap: 24px;
  margin-bottom: 22px;
  flex-wrap: wrap;

  @media (max-width: 991px) {
    align-items: flex-start;
    gap: 14px;
    margin-bottom: 18px;
  }

  @media (max-width: 767px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 14px;
  }
`;

const TeamTabs = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;

  @media (max-width: 767px) {
    gap: 12px;
  }
`;

const TeamTab = styled.button`
  border: 1px solid rgba(0, 59, 92, 0.08);
  background: ${(p) => (p.$active ? p.$buttonColor : "#fff9f0")};
  border-color: ${(p) => (p.$active ? p.$buttonColor : "rgba(0, 59, 92, 0.08)")};
  color: #083d5a;
  border-radius: 999px;
  min-width: 104px;
  height: 42px;
  padding: 0 18px;
  font-size: 16px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  @media (max-width: 767px) {
    min-width: 92px;
    height: 38px;
    font-size: 14px;
    padding: 0 16px;
  }
`;

const TeamGroups = styled.div`
  display: grid;
  gap: 20px;
  min-width: 0;
`;

const TeamGroup = styled.div`
  width: 100%;
  min-width: 0;
`;

const TitleWrap = styled.div`
  text-align: ${(p) => p.$align};
`;

const TeamMembers = styled.div`
  display: grid;
  gap: 16px;
  width: 100%;
  max-width: 100%;
  min-width: 0;

  ${(p) =>
    p.$viewMode === "slider"
      ? css`
          grid-auto-flow: column;
          grid-auto-columns: minmax(240px, 292px);
          overflow-x: auto;
          padding-bottom: 8px;
        `
      : css`
          grid-template-columns: repeat(4, minmax(0, 1fr));
        `}

  @media (max-width: 1199px) {
    ${(p) =>
      p.$viewMode !== "slider" &&
      css`
        grid-template-columns: repeat(3, minmax(0, 1fr));
      `}
  }

  @media (max-width: 991px) {
    display: flex;
    flex-wrap: nowrap;
    overflow-x: auto;
    overflow-y: hidden;
    padding-bottom: 10px;
    cursor: grab;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-x: contain;
    touch-action: pan-x;
    scroll-behavior: smooth;
    scroll-snap-type: x mandatory;
  }

  @media (max-width: 767px) {
    gap: 14px;
  }
`;

const TeamMemberCard = styled.article`
  display: flex;
  flex-direction: column;
  gap: 12px;

  @media (max-width: 991px) {
    flex: 0 0 min(72vw, 320px);
    max-width: min(72vw, 320px);
    min-width: 260px;
    scroll-snap-align: start;
    scroll-snap-stop: always;
  }

  @media (max-width: 767px) {
    flex-basis: min(82vw, 300px);
    max-width: min(82vw, 300px);
    min-width: 220px;
  }
`;

const TeamMemberImageWrap = styled.div`
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 14px;
  overflow: hidden;
  background: #eef2f6;
`;

const TeamMemberImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const TeamMemberImageEmpty = styled.div`
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: #9ca3af;
  font-size: 13px;
`;

const TeamMemberFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border-radius: 10px;
  background: #fcf8ee;
  min-height: 40px;
  padding: 8px 12px;
`;

const TeamMemberName = styled.div`
  margin: 0;
  color: ${(p) => p.$textColor};
  font-size: 16px;
  line-height: 1.2;
  font-weight: 600;

  @media (max-width: 1199px) {
    font-size: 18px;
  }

  @media (max-width: 767px) {
    font-size: 16px;
  }
`;

const TeamSocialBtn = styled.a`
  width: 18px;
  height: 18px;
  border-radius: 3px;
  background: ${(p) => p.$iconColor};
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  text-decoration: none;
  flex: 0 0 auto;

  .x-mark {
    font-size: 9px;
    font-weight: 700;
    line-height: 1;
  }
`;

const TeamMemberDescription = styled.p`
  margin: -6px 0 0;
  color: ${(p) => p.$descriptionColor};
  font-size: 13px;
  line-height: 1.4;
  font-weight: 500;
  min-height: 0;
`;

function toText(value) {
  return value != null ? String(value).trim() : "";
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function toNumberOrNull(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function normalizeAlign(value) {
  const normalized = toText(value).toLowerCase();
  if (normalized === "left" || normalized === "center" || normalized === "right") {
    return normalized;
  }
  return "left";
}

function decodeHtmlEntities(text) {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function stripHtmlToPlainText(value) {
  const raw = toText(value);
  if (!raw) return "";
  const noScripts = raw
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ");
  const noTags = noScripts.replace(/<[^>]+>/g, " ");
  const decoded = decodeHtmlEntities(noTags);
  return decoded.replace(/\s+/g, " ").trim();
}

function resolveThemeColor(key, fallback) {
  const safe = toText(key);
  return safe ? getColor(safe) : fallback;
}

function isGradientColor(colorValue, colorKey) {
  const value = toText(colorValue).toLowerCase();
  const key = toText(colorKey).toLowerCase();
  return value.includes("gradient") || key.includes("gradient");
}

function platformKey(value) {
  return toText(value).toLowerCase();
}

function getSocialIcon(platform) {
  const key = platformKey(platform);
  if (key.includes("linkedin")) return <LinkedinFilled />;
  if (key.includes("facebook")) return <FacebookFilled />;
  if (key.includes("instagram")) return <InstagramFilled />;
  if (key.includes("youtube")) return <YoutubeFilled />;
  if (key === "x" || key.includes("twitter")) return <span className="x-mark">X</span>;
  return <GlobalOutlined />;
}

function normalizeMember(member) {
  const source = member && typeof member === "object" ? member : {};
  return {
    _id: toText(source._id),
    slug: toText(source.slug),
    name: stripHtmlToPlainText(source.name),
    designation: stripHtmlToPlainText(source.designation),
    bio: stripHtmlToPlainText(source.bio),
    image: toText(source.image),
    categoryId: toText(source.categoryId),
    status: source.status !== false,
    order: Number.isFinite(Number(source.order)) ? Number(source.order) : 0,
    socialLinks: toArray(source.socialLinks)
      .map((item) => {
        const target = normalizeTargetFromItem(item, {
          targetKeys: ["target", "sourceTarget"],
          boolKeys: ["openInNewTab", "newTab"],
          fallback: "_self",
        });
        return {
          platform: stripHtmlToPlainText(item?.platform),
          url: ensureMailto(item?.url),
          target,
          openInNewTab: target === "_blank",
        };
      })
      .filter((item) => item.url),
  };
}

function normalizeCategory(category) {
  const source = category && typeof category === "object" ? category : {};
  return {
    _id: toText(source._id),
    name: stripHtmlToPlainText(source.name),
    order: Number.isFinite(Number(source.order)) ? Number(source.order) : 0,
  };
}

function normalizeProps(props = {}) {
  const source = props && typeof props === "object" ? props : {};
  const showCategoryName =
    source.teamShowCategoryName != null
      ? source.teamShowCategoryName !== false
      : source.showCategoryTabs !== false;
  return {
    teamCategoryIds: toArray(source.teamCategoryIds).map((id) => toText(id)),
    teamShowAllCategories:
      source.teamShowAllCategories != null
        ? source.teamShowAllCategories !== false
        : true,
    teamShowCategoryName: showCategoryName,
    teamViewMode:
      source.teamViewMode === "slider" || source.layoutType === "slider"
        ? "slider"
        : "grid",
    featuredOnly: source.featuredOnly === true,
    homepageOnly: source.homepageOnly === true,
    highlightOnly: source.highlightOnly === true,

    mainTitle:
      stripHtmlToPlainText(source.mainTitle || source.teamMainTitle) || "Meet The Team",
    titleAlign: normalizeAlign(
      source.titleAlign || source.mainTitleAlign || source.teamMainTitleAlign,
    ),
    titleColorKey: toText(source.titleColorKey || source.teamTitleColorKey),
    teamTextColorKey: toText(source.teamTextColorKey || source.teamMemberNameColorKey),
    teamButtonColorKey: toText(source.teamButtonColorKey || source.teamTabActiveBgColorKey),
    teamDescriptionColorKey: toText(
      source.teamDescriptionColorKey ||
        source.teamMemberDesignationColorKey ||
        source.teamMemberBioColorKey,
    ),
    teamSocialIconColorKey: toText(
      source.teamSocialIconColorKey || source.teamSocialLinkColorKey,
    ),

    teamSectionBgType: toText(source.teamSectionBgType || "default").toLowerCase(),
    teamSectionBgImage: toText(source.teamSectionBgImage),
    teamSectionBgColorKey: toText(source.teamSectionBgColorKey),
    teamSectionPaddingTop: toNumberOrNull(source.teamSectionPaddingTop),
    teamSectionPaddingBottom: toNumberOrNull(source.teamSectionPaddingBottom),
    teamSectionMarginTop: toNumberOrNull(source.teamSectionMarginTop),
    teamSectionMarginBottom: toNumberOrNull(source.teamSectionMarginBottom),
    teamPageContainerBgType: toText(
      source.teamPageContainerBgType || "default",
    ).toLowerCase(),
    teamPageContainerBgImage: toText(source.teamPageContainerBgImage),
    teamPageContainerBgColorKey: toText(source.teamPageContainerBgColorKey),
    teamPageContainerPaddingTop: toNumberOrNull(source.teamPageContainerPaddingTop),
    teamPageContainerPaddingRight: toNumberOrNull(source.teamPageContainerPaddingRight),
    teamPageContainerPaddingBottom: toNumberOrNull(source.teamPageContainerPaddingBottom),
    teamPageContainerPaddingLeft: toNumberOrNull(source.teamPageContainerPaddingLeft),
    teamPageContainerMarginTop: toNumberOrNull(source.teamPageContainerMarginTop),
    teamPageContainerMarginBottom: toNumberOrNull(source.teamPageContainerMarginBottom),
  };
}

function MemberCard({ member, textColor, descriptionColor, socialIconColor }) {
  const primarySocial =
    Array.isArray(member.socialLinks) && member.socialLinks.length > 0
      ? member.socialLinks[0]
      : null;
  const primaryTarget = normalizeTargetFromItem(primarySocial, {
    targetKeys: ["target", "sourceTarget"],
    boolKeys: ["openInNewTab", "newTab"],
    fallback: "_self",
  });

  return (
    <TeamMemberCard>
      <TeamMemberImageWrap>
        {member.image ? (
          <TeamMemberImage
            src={member.image}
            alt={member.name || "Team member"}
            loading="lazy"
          />
        ) : (
          <TeamMemberImageEmpty>No Image</TeamMemberImageEmpty>
        )}
      </TeamMemberImageWrap>
      <TeamMemberFooter>
        <TeamMemberName $textColor={textColor}>
          {member.name || "Untitled Member"}
        </TeamMemberName>
        {primarySocial?.url ? (
          <TeamSocialBtn
            $iconColor={socialIconColor}
            href={primarySocial.url}
            target={primaryTarget === "_blank" ? "_blank" : "_self"}
            rel={primaryTarget === "_blank" ? "noopener noreferrer" : undefined}
            aria-label={primarySocial.platform || "Social link"}
          >
            {getSocialIcon(primarySocial.platform)}
          </TeamSocialBtn>
        ) : null}
      </TeamMemberFooter>
      {member.designation ? (
        <TeamMemberDescription $descriptionColor={descriptionColor}>
          {member.designation}
        </TeamMemberDescription>
      ) : null}
    </TeamMemberCard>
  );
}

export default function TeamBlockView(props) {
  const config = useMemo(() => normalizeProps(props), [props]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [members, setMembers] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState("");
  const dragStateRef = useRef({
    active: false,
    startX: 0,
    startScrollLeft: 0,
    pointerId: null,
  });

  const isCompactViewport = () =>
    typeof window !== "undefined" && window.innerWidth <= 991;

  const handleMembersPointerDown = (event) => {
    if (!isCompactViewport()) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const container = event.currentTarget;
    dragStateRef.current = {
      active: true,
      startX: event.clientX,
      startScrollLeft: container.scrollLeft,
      pointerId: event.pointerId,
    };
    container.style.cursor = "grabbing";
    if (container.setPointerCapture) container.setPointerCapture(event.pointerId);
  };

  const handleMembersPointerMove = (event) => {
    const state = dragStateRef.current;
    if (!state.active) return;
    event.preventDefault();
    const deltaX = event.clientX - state.startX;
    event.currentTarget.scrollLeft = state.startScrollLeft - deltaX;
  };

  const releaseMembersPointer = (event) => {
    const state = dragStateRef.current;
    if (!state.active) return;
    dragStateRef.current = {
      active: false,
      startX: 0,
      startScrollLeft: 0,
      pointerId: null,
    };
    event.currentTarget.style.cursor = "grab";
    if (
      state.pointerId != null &&
      event.currentTarget.releasePointerCapture
    ) {
      try {
        event.currentTarget.releasePointerCapture(state.pointerId);
      } catch {}
    }
  };

  const handleMembersWheel = (event) => {
    if (!isCompactViewport()) return;
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    event.preventDefault();
    event.currentTarget.scrollLeft += event.deltaY;
  };

  useEffect(() => {
    let ignore = false;
    setLoading(true);

    const params = new URLSearchParams();
    params.set("allCategories", config.teamShowAllCategories ? "1" : "0");
    if (!config.teamShowAllCategories && config.teamCategoryIds.length > 0) {
      params.set("categoryIds", config.teamCategoryIds.join(","));
    }
    if (config.featuredOnly) params.set("featured", "1");
    if (config.homepageOnly) params.set("homepage", "1");
    if (config.highlightOnly) params.set("highlight", "1");

    fetch(`/api/teams?${params.toString()}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { items: [], categories: [] }))
      .then((data) => {
        if (ignore) return;
        const nextCategories = toArray(data?.categories).map(normalizeCategory);
        const nextMembers = toArray(data?.items)
          .map(normalizeMember)
          .filter((item) => item.status !== false);
        setCategories(nextCategories);
        setMembers(nextMembers);
      })
      .catch(() => {
        if (ignore) return;
        setCategories([]);
        setMembers([]);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [config]);

  const categoriesWithMembers = useMemo(() => {
    return categories
      .map((category) => ({
        ...category,
        members: members
          .filter((member) => member.categoryId === category._id)
          .sort((a, b) => a.order - b.order),
      }))
      .filter((item) => item.members.length > 0);
  }, [categories, members]);

  const categoriesForTabs = useMemo(() => {
    return [...categories].sort((a, b) => a.order - b.order);
  }, [categories]);

  useEffect(() => {
    if (categoriesForTabs.length === 0) {
      setActiveCategoryId("");
      return;
    }
    if (activeCategoryId && categoriesForTabs.some((c) => c._id === activeCategoryId)) {
      return;
    }
    const firstWithMembers = categoriesWithMembers[0]?._id;
    setActiveCategoryId(firstWithMembers || categoriesForTabs[0]._id);
  }, [activeCategoryId, categoriesForTabs, categoriesWithMembers]);

  const showTabs = config.teamShowCategoryName && categoriesForTabs.length > 0;
  const visibleGroups = useMemo(() => {
    if (showTabs) {
      const selectedCategoryId = activeCategoryId || categoriesForTabs[0]?._id || "";
      if (!selectedCategoryId) return [];
      return [
        {
          _id: selectedCategoryId,
          members: [...members]
            .filter((member) => member.categoryId === selectedCategoryId)
            .sort((a, b) => a.order - b.order),
        },
      ];
    }
    return [
      {
        _id: "all",
        members: [...members].sort((a, b) => a.order - b.order),
      },
    ];
  }, [activeCategoryId, categoriesForTabs, members, showTabs]);

  if (loading || members.length === 0) return null;

  const sectionBgClassName =
    config.teamSectionBgType === "default" ? "defaultBackground" : undefined;
  const sectionBgStyleBase =
    config.teamSectionBgType === "image" && config.teamSectionBgImage
      ? {
          backgroundImage: `url(${config.teamSectionBgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
        }
      : config.teamSectionBgType === "color" && config.teamSectionBgColorKey
        ? {
            backgroundColor: resolveThemeColor(config.teamSectionBgColorKey, "#ffffff"),
            backgroundImage: "none",
          }
        : undefined;

  const sectionBgStyle =
    sectionBgStyleBase ||
    config.teamSectionPaddingTop != null ||
    config.teamSectionPaddingBottom != null ||
    config.teamSectionMarginTop != null ||
    config.teamSectionMarginBottom != null
      ? {
          ...(sectionBgStyleBase || {}),
          ...(config.teamSectionPaddingTop != null && config.teamSectionPaddingTop >= 0
            ? { paddingTop: `${config.teamSectionPaddingTop}px` }
            : {}),
          ...(config.teamSectionPaddingBottom != null && config.teamSectionPaddingBottom >= 0
            ? { paddingBottom: `${config.teamSectionPaddingBottom}px` }
            : {}),
          ...(config.teamSectionMarginTop != null && config.teamSectionMarginTop >= 0
            ? { marginTop: `${config.teamSectionMarginTop}px` }
            : {}),
          ...(config.teamSectionMarginBottom != null && config.teamSectionMarginBottom >= 0
            ? { marginBottom: `${config.teamSectionMarginBottom}px` }
            : {}),
        }
      : undefined;

  const pageContainerBgStyleBase =
    config.teamPageContainerBgType === "image" && config.teamPageContainerBgImage
      ? {
          backgroundImage: `url(${config.teamPageContainerBgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }
      : config.teamPageContainerBgType === "color" && config.teamPageContainerBgColorKey
        ? {
            backgroundColor: resolveThemeColor(
              config.teamPageContainerBgColorKey,
              "#ffffff",
            ),
            backgroundImage: "none",
          }
        : undefined;

  const pageContainerBgStyle =
    pageContainerBgStyleBase ||
    config.teamPageContainerPaddingTop != null ||
    config.teamPageContainerPaddingRight != null ||
    config.teamPageContainerPaddingBottom != null ||
    config.teamPageContainerPaddingLeft != null ||
    config.teamPageContainerMarginTop != null ||
    config.teamPageContainerMarginBottom != null
      ? {
          ...(pageContainerBgStyleBase || {}),
          ...(config.teamPageContainerPaddingTop != null &&
          config.teamPageContainerPaddingTop >= 0
            ? { paddingTop: `${config.teamPageContainerPaddingTop}px` }
            : {}),
          ...(config.teamPageContainerPaddingRight != null &&
          config.teamPageContainerPaddingRight >= 0
            ? { paddingRight: `${config.teamPageContainerPaddingRight}px` }
            : {}),
          ...(config.teamPageContainerPaddingBottom != null &&
          config.teamPageContainerPaddingBottom >= 0
            ? { paddingBottom: `${config.teamPageContainerPaddingBottom}px` }
            : {}),
          ...(config.teamPageContainerPaddingLeft != null &&
          config.teamPageContainerPaddingLeft >= 0
            ? { paddingLeft: `${config.teamPageContainerPaddingLeft}px` }
            : {}),
          ...(config.teamPageContainerMarginTop != null &&
          config.teamPageContainerMarginTop >= 0
            ? { marginTop: `${config.teamPageContainerMarginTop}px` }
            : {}),
          ...(config.teamPageContainerMarginBottom != null &&
          config.teamPageContainerMarginBottom >= 0
            ? { marginBottom: `${config.teamPageContainerMarginBottom}px` }
            : {}),
        }
      : undefined;

  const titleColor = resolveThemeColor(config.titleColorKey, "#003b5c");
  const buttonColor = resolveThemeColor(config.teamButtonColorKey, "#f3b233");
  const textColor = resolveThemeColor(config.teamTextColorKey, "#003b5c");
  const descriptionColor = resolveThemeColor(config.teamDescriptionColorKey, "#6b7280");
  const socialIconColor = resolveThemeColor(config.teamSocialIconColorKey, "#005b89");
  const titleUsesGradient = isGradientColor(titleColor, config.titleColorKey);

  return (
    <FullWidthBackground className={sectionBgClassName} style={sectionBgStyle}>
      <PageContainer style={pageContainerBgStyle}>
        <TeamBlock>
          <TeamHeader $align={config.titleAlign}>
            <TitleWrap $align={config.titleAlign}>
              <MainTitle
                color={titleUsesGradient ? undefined : titleColor}
                style={
                  titleUsesGradient
                    ? {
                        background: titleColor,
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        color: "transparent",
                        WebkitTextFillColor: "transparent",
                      }
                    : undefined
                }
              >
                {config.mainTitle}
              </MainTitle>
            </TitleWrap>

            {showTabs ? (
              <TeamTabs role="tablist" aria-label="Team categories">
                {categoriesForTabs.map((category) => (
                  <TeamTab
                    key={category._id}
                    type="button"
                    $active={activeCategoryId === category._id}
                    $buttonColor={buttonColor}
                    onClick={() => setActiveCategoryId(category._id)}
                  >
                    {category.name}
                  </TeamTab>
                ))}
              </TeamTabs>
            ) : null}
          </TeamHeader>

          <TeamGroups>
            {visibleGroups.map((group) => (
              <TeamGroup key={group._id}>
                <TeamMembers
                  $viewMode={config.teamViewMode}
                  onPointerDown={handleMembersPointerDown}
                  onPointerMove={handleMembersPointerMove}
                  onPointerUp={releaseMembersPointer}
                  onPointerCancel={releaseMembersPointer}
                  onPointerLeave={releaseMembersPointer}
                  onWheel={handleMembersWheel}
                >
                  {group.members.map((member) => (
                    <MemberCard
                      key={member._id || member.slug}
                      member={member}
                      textColor={textColor}
                      descriptionColor={descriptionColor}
                      socialIconColor={socialIconColor}
                    />
                  ))}
                </TeamMembers>
              </TeamGroup>
            ))}
          </TeamGroups>
        </TeamBlock>
      </PageContainer>
    </FullWidthBackground>
  );
}
