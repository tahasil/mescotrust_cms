"use client";

import { useEffect, useState } from "react";
import { Button, Modal } from "antd";
import styled from "styled-components";
import {
  FullWidthBackground,
  getColor,
  PageContainer,
} from "@/styles/Theme";
import { renderHighlightedTitle } from "@/components/site/HighlightedTitle";

/* ── Styled Components (Identical to CommitteeMembers) ── */
const CardWrapper = styled.article`
  position: relative;
  width: 100%;
  height: 100%;
  cursor: ${(props) => (props.$interactive ? "pointer" : "default")};
  background: ${() => getColor("surface")};

  picture {
    display: block;
    width: 100%;
    overflow: hidden;
    border-radius: 14px;
  }

  .fable-person__photo {
    transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  &:hover {
    z-index: 1;
  }

  &:hover .fable-person__photo {
    transform: scale(1.1);
  }

  &:focus-visible {
    outline: 3px solid ${() => getColor("primary")};
    outline-offset: 3px;
  }
`;

const ProfileOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.1);
  opacity: 0;
  pointer-events: none;
  transform: scale(0);
  transform-origin: center;
  transition:
    transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.25s ease;

  .fable-person:hover &,
  .fable-person:focus-within:has(:focus-visible) & {
    opacity: 1;
    pointer-events: auto;
    transform: scale(1);
  }
`;

const ViewProfileBtn = styled(Button)`
  && {
    height: 44px;
    padding: 0 24px;
    color: var(--committee-button-text);
    background: var(--committee-button-bg);
    border-color: var(--committee-button-border);
    border-radius: 30px;
    font-size: 14px;
    font-weight: 600;
    opacity: 0;
    transform: scale(0.9);
    transition:
      opacity 0.3s ease 0.08s,
      transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) 0.08s,
      background 0.25s ease,
      border-color 0.25s ease,
      color 0.25s ease;

    .fable-person:hover &,
    .fable-person:focus-within:has(:focus-visible) & {
      opacity: 1;
      transform: scale(1);
    }

    &:hover,
    &:focus-visible {
      color: var(--committee-button-hover-text) !important;
      background: var(--committee-button-hover-bg) !important;
      border-color: var(--committee-button-hover-border) !important;
    }
  }
`;

const CardBodyWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: left;

  .name {
    margin: 0;
    color: var(--committee-card-title);
  }

  .meta {
    margin: 0;
    color: var(--committee-card-description);
  }
`;

const ProfileDetailUI = styled.div`
  padding: 8px 0;
  .profile-detail-header {
    display: flex;
    align-items: center;
    gap: 24px;
    margin-bottom: 20px;
    @media (max-width: 768px) {
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 16px;
    }
  }
  .profile-detail-image {
    flex-shrink: 0;
    width: 160px;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid var(--committee-modal-image-border);
    background: #fff;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.04);
    img {
      width: 100%;
      height: auto;
      display: block;
      object-fit: cover;
    }
  }
  .profile-detail-meta {
    flex: 1;
    text-align: left;
    min-width: 0;
    @media (max-width: 768px) {
      text-align: center;
    }
  }
  .profile-detail-name {
    font-size: 20px;
    font-weight: 600;
    color: var(--committee-modal-name);
    text-transform: uppercase;
    letter-spacing: 0.02em;
    @media (max-width: 768px) {
      font-size: 18px;
    }
  }
  .profile-detail-qualification {
    font-size: 14px;
    color: var(--committee-modal-qualification);
    margin-bottom: 4px;
  }
  .profile-detail-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--committee-modal-role);
  }
  .profile-detail-bio {
    position: relative;
    font-size: 14px;
    line-height: 1.6;
    color: var(--committee-modal-bio);
    margin-top: 18px;
    padding-top: 18px;
  }
  .profile-detail-bio::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: var(--committee-modal-divider);
  }
`;

const ProfileModal = styled(Modal)`
  .ant-modal-content {
    border-radius: 16px;
    overflow: hidden;
    max-height: calc(100vh - 32px);
    max-height: calc(100dvh - 32px);
    display: flex;
    flex-direction: column;
  }
  .ant-modal-body {
    flex: 1 1 auto;
    max-height: calc(100vh - 48px);
    max-height: calc(100dvh - 48px);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-y;
  }
  @media (max-width: 768px) {
    width: min(640px, calc(100vw - 24px)) !important;
    max-width: calc(100vw - 24px);
    margin-inline: auto;
    top: 12px;
    padding-bottom: 12px;
  }
`;

function normalizeMember(it) {
  const desktopImage =
    it?.imageDesktop != null
      ? String(it.imageDesktop).trim()
      : it?.image != null
        ? String(it.image).trim()
        : "";
  const mobileImage =
    it?.imageMobile != null ? String(it.imageMobile).trim() : "";
  return {
    name: it?.name != null ? String(it.name).trim() : "",
    qualification:
      it?.qualification != null ? String(it.qualification).trim() : "",
    title: it?.title != null ? String(it.title).trim() : "",
    imageDesktop: desktopImage,
    imageMobile: mobileImage,
    image: desktopImage,
    bio: it?.bio != null ? String(it.bio).trim() : "",
    order: Number(it?.order) || 0,
  };
}

/**
 * Site Component / Renderer: TeamEmbed.
 * Renders team data either from props or by fetching via shortcode/teamId.
 */
export default function TeamEmbed(props) {
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  const rawShortcode = String(
    props?.shortcode || props?.shortCode || props?.teamShortcode || props?.teamId || "",
  ).trim();

  const [teamData, setTeamData] = useState(props?.initialTeam || null);
  const [loading, setLoading] = useState(Boolean(!props?.initialTeam && rawShortcode));
  const [error, setError] = useState("");

  useEffect(() => {
    if (props?.initialTeam) {
      setTeamData(props.initialTeam);
      setLoading(false);
      return;
    }

    if (!rawShortcode) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    fetch(`/api/public/teams/${encodeURIComponent(rawShortcode)}`, {
      cache: "no-store",
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Team "${rawShortcode}" not found`);
        }
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setTeamData(data);
          setError("");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setTeamData(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [rawShortcode, props?.initialTeam]);

  const effectiveData = teamData || props || {};

  /* ── Title & colors ── */
  const mainTitle = (
    effectiveData?.mainTitle ??
    effectiveData?.committeeMembersMainTitle ??
    effectiveData?.name ??
    "Team"
  )
    .toString()
    .trim();

  const subTitle = (
    effectiveData?.subTitle ??
    effectiveData?.committeeMembersSubTitle ??
    ""
  )
    .toString()
    .trim();

  const subTitleColorKey = (
    effectiveData?.subTitleColorKey ??
    effectiveData?.committeeMembersSubTitleColorKey ??
    ""
  )
    .toString()
    .trim();
  const subTitleColor = subTitleColorKey ? getColor(subTitleColorKey) : getColor("primary");

  const titleColorKey = (
    effectiveData?.titleColorKey ??
    effectiveData?.committeeMembersTitleColorKey ??
    ""
  )
    .toString()
    .trim();
  const titleColor = titleColorKey ? getColor(titleColorKey) : undefined;

  const componentColor = (keys, fallback) => {
    const list = Array.isArray(keys) ? keys : [keys];
    for (const key of list) {
      const val = String(effectiveData?.[key] ?? "").trim();
      if (val) return getColor(val);
    }
    return getColor(fallback);
  };

  const componentColorVars = {
    "--committee-card-title": componentColor(
      ["cardTitleColorKey", "committeeMembersCardTitleColorKey"],
      "black",
    ),
    "--committee-card-description": componentColor(
      ["cardDescriptionColorKey", "committeeMembersCardDescriptionColorKey"],
      "blackMuted",
    ),
    "--committee-button-bg": componentColor(
      ["buttonBgColorKey", "committeeMembersButtonBgColorKey"],
      "primary",
    ),
    "--committee-button-text": componentColor(
      ["buttonTextColorKey", "committeeMembersButtonTextColorKey"],
      "white",
    ),
    "--committee-button-border": componentColor(
      ["buttonBorderColorKey", "committeeMembersButtonBorderColorKey"],
      "primary",
    ),
    "--committee-button-hover-bg": componentColor(
      ["buttonHoverBgColorKey", "committeeMembersButtonHoverBgColorKey"],
      "white",
    ),
    "--committee-button-hover-text": componentColor(
      ["buttonHoverTextColorKey", "committeeMembersButtonHoverTextColorKey"],
      "primary",
    ),
    "--committee-button-hover-border": componentColor(
      ["buttonHoverBorderColorKey", "committeeMembersButtonHoverBorderColorKey"],
      "primary",
    ),
    "--committee-modal-bg": componentColor(
      ["modalBgColorKey", "committeeMembersModalBgColorKey"],
      "white",
    ),
    "--committee-modal-name": componentColor(
      ["modalNameColorKey", "committeeMembersModalNameColorKey"],
      "black",
    ),
    "--committee-modal-qualification": componentColor(
      ["modalQualificationColorKey", "committeeMembersModalQualificationColorKey"],
      "blackMuted",
    ),
    "--committee-modal-role": componentColor(
      ["modalRoleColorKey", "committeeMembersModalRoleColorKey"],
      "primary",
    ),
    "--committee-modal-bio": componentColor(
      ["modalBioColorKey", "committeeMembersModalBioColorKey"],
      "black",
    ),
    "--committee-modal-divider": componentColor(
      ["modalDividerColorKey", "committeeMembersModalDividerColorKey"],
      "border",
    ),
    "--committee-modal-image-border": componentColor(
      ["modalImageBorderColorKey", "committeeMembersModalImageBorderColorKey"],
      "border",
    ),
  };

  /* ── Members ── */
  const rawItems = Array.isArray(effectiveData?.members)
    ? effectiveData.members
    : Array.isArray(effectiveData?.committeeMembersItems)
      ? effectiveData.committeeMembersItems
      : [];
  const members = rawItems
    .map(normalizeMember)
    .filter((m) => m.name)
    .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

  /* ── Section background ── */
  const sectionBgType = (
    effectiveData?.sectionBgType ??
    effectiveData?.committeeMembersSectionBgType ??
    "default"
  ).toString();
  const sectionBgImage = (
    effectiveData?.sectionBgImage ??
    effectiveData?.committeeMembersSectionBgImage ??
    ""
  )
    .toString()
    .trim();
  const sectionBgColorKey = (
    effectiveData?.sectionBgColorKey ??
    effectiveData?.committeeMembersSectionBgColorKey ??
    ""
  )
    .toString()
    .trim();
  const sectionBgClassName = sectionBgType === "default" ? "defaultBackground" : undefined;
  const sectionBgStyleBase =
    sectionBgType === "image" && sectionBgImage
      ? {
          backgroundImage: `url(${sectionBgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
        }
      : sectionBgType === "color" && sectionBgColorKey
        ? {
            backgroundColor: getColor(sectionBgColorKey),
            backgroundImage: "none",
          }
        : undefined;

  const sectionPaddingTop =
    effectiveData?.sectionPaddingTop ?? effectiveData?.committeeMembersSectionPaddingTop;
  const sectionPaddingBottom =
    effectiveData?.sectionPaddingBottom ?? effectiveData?.committeeMembersSectionPaddingBottom;
  const sectionMarginTop =
    effectiveData?.sectionMarginTop ?? effectiveData?.committeeMembersSectionMarginTop;
  const sectionMarginBottom =
    effectiveData?.sectionMarginBottom ?? effectiveData?.committeeMembersSectionMarginBottom;

  const sectionBgStyle =
    sectionBgStyleBase ||
    sectionPaddingTop != null ||
    sectionPaddingBottom != null ||
    sectionMarginTop != null ||
    sectionMarginBottom != null
      ? {
          ...(sectionBgStyleBase || {}),
          ...(sectionPaddingTop != null && sectionPaddingTop >= 0
            ? { paddingTop: `${sectionPaddingTop}px` }
            : {}),
          ...(sectionPaddingBottom != null && sectionPaddingBottom >= 0
            ? { paddingBottom: `${sectionPaddingBottom}px` }
            : {}),
          ...(sectionMarginTop != null && sectionMarginTop >= 0
            ? { marginTop: `${sectionMarginTop}px` }
            : {}),
          ...(sectionMarginBottom != null && sectionMarginBottom >= 0
            ? { marginBottom: `${sectionMarginBottom}px` }
            : {}),
        }
      : undefined;

  /* ── Page Container background ── */
  const pageContainerBgType = (
    effectiveData?.pageContainerBgType ??
    effectiveData?.committeeMembersPageContainerBgType ??
    "default"
  ).toString();
  const pageContainerBgImage = (
    effectiveData?.pageContainerBgImage ??
    effectiveData?.committeeMembersPageContainerBgImage ??
    ""
  )
    .toString()
    .trim();
  const pageContainerBgColorKey = (
    effectiveData?.pageContainerBgColorKey ??
    effectiveData?.committeeMembersPageContainerBgColorKey ??
    ""
  )
    .toString()
    .trim();
  const pageContainerBgStyleBase =
    pageContainerBgType === "image" && pageContainerBgImage
      ? {
          backgroundImage: `url(${pageContainerBgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }
      : pageContainerBgType === "color" && pageContainerBgColorKey
        ? {
            backgroundColor: getColor(pageContainerBgColorKey),
            backgroundImage: "none",
          }
        : undefined;

  const containerPaddingTop =
    effectiveData?.containerPaddingTop ?? effectiveData?.committeeMembersPageContainerPaddingTop;
  const containerPaddingRight =
    effectiveData?.containerPaddingRight ?? effectiveData?.committeeMembersPageContainerPaddingRight;
  const containerPaddingBottom =
    effectiveData?.containerPaddingBottom ?? effectiveData?.committeeMembersPageContainerPaddingBottom;
  const containerPaddingLeft =
    effectiveData?.containerPaddingLeft ?? effectiveData?.committeeMembersPageContainerPaddingLeft;
  const containerMarginTop =
    effectiveData?.containerMarginTop ?? effectiveData?.committeeMembersPageContainerMarginTop;
  const containerMarginBottom =
    effectiveData?.containerMarginBottom ?? effectiveData?.committeeMembersPageContainerMarginBottom;

  const pageContainerBgStyle =
    pageContainerBgStyleBase ||
    containerPaddingTop != null ||
    containerPaddingRight != null ||
    containerPaddingBottom != null ||
    containerPaddingLeft != null ||
    containerMarginTop != null ||
    containerMarginBottom != null
      ? {
          ...(pageContainerBgStyleBase || {}),
          ...(containerPaddingTop != null && containerPaddingTop >= 0
            ? { paddingTop: `${containerPaddingTop}px` }
            : {}),
          ...(containerPaddingRight != null && containerPaddingRight >= 0
            ? { paddingRight: `${containerPaddingRight}px` }
            : {}),
          ...(containerPaddingBottom != null && containerPaddingBottom >= 0
            ? { paddingBottom: `${containerPaddingBottom}px` }
            : {}),
          ...(containerPaddingLeft != null && containerPaddingLeft >= 0
            ? { paddingLeft: `${containerPaddingLeft}px` }
            : {}),
          ...(containerMarginTop != null && containerMarginTop >= 0
            ? { marginTop: `${containerMarginTop}px` }
            : {}),
          ...(containerMarginBottom != null && containerMarginBottom >= 0
            ? { marginBottom: `${containerMarginBottom}px` }
            : {}),
        }
      : undefined;

  if (loading) {
    return (
      <FullWidthBackground className={sectionBgClassName} $managedStyle={sectionBgStyle}>
        <PageContainer $managedStyle={pageContainerBgStyle}>
          <div style={{ padding: "40px 0", textAlign: "center", color: "rgba(0,0,0,0.45)" }}>
            Loading team...
          </div>
        </PageContainer>
      </FullWidthBackground>
    );
  }

  if (error && !teamData && members.length === 0) {
    return (
      <FullWidthBackground className={sectionBgClassName} $managedStyle={sectionBgStyle}>
        <PageContainer $managedStyle={pageContainerBgStyle}>
          <div style={{ padding: "20px 0", color: "#b42318" }}>
            {error}
          </div>
        </PageContainer>
      </FullWidthBackground>
    );
  }

  return (
    <FullWidthBackground className={sectionBgClassName} $managedStyle={sectionBgStyle}>
      <PageContainer $managedStyle={pageContainerBgStyle}>
        <div className="fable-section" style={componentColorVars}>
          {subTitle ? (
            <p className="fable-eyebrow" style={{ color: subTitleColor }}>
              {subTitle}
            </p>
          ) : null}
          <h2
            className="fable-heading"
            style={{
              ...(titleColor ? { color: titleColor } : {}),
            }}
          >
            {renderHighlightedTitle(mainTitle, effectiveData)}
          </h2>
          <div className="fable-people">
            {members.map((member, idx) => {
              const meta = [member.title, member.qualification]
                .filter(Boolean)
                .join(" · ");
              const openProfile = () => {
                setSelectedMember(member);
                setProfileModalOpen(true);
              };

              return (
                <CardWrapper
                  className="fable-person"
                  key={`${member.name}-${idx}`}
                  $interactive
                >
                  {member.imageDesktop || member.imageMobile ? (
                    <picture>
                      {member.imageMobile ? (
                        <source media="(max-width: 767px)" srcSet={member.imageMobile} />
                      ) : null}
                      <img
                        loading="lazy"
                        className="fable-person__photo"
                        src={member.imageDesktop || member.imageMobile}
                        alt={member.name}
                      />
                    </picture>
                  ) : null}
                  <CardBodyWrapper>
                    <h3 className="name">{member.name}</h3>
                    {meta ? <p className="meta">{meta}</p> : null}
                  </CardBodyWrapper>
                  <ProfileOverlay>
                    <ViewProfileBtn
                      type="primary"
                      onClick={(e) => {
                        e.currentTarget?.blur();
                        openProfile();
                      }}
                    >
                      View Profile
                    </ViewProfileBtn>
                  </ProfileOverlay>
                </CardWrapper>
              );
            })}
          </div>
        </div>
      </PageContainer>

      <ProfileModal
        className="committee-members-modal"
        open={profileModalOpen}
        onCancel={() => {
          if (typeof document !== "undefined" && document.activeElement) {
            document.activeElement.blur();
          }
          setProfileModalOpen(false);
          setSelectedMember(null);
        }}
        footer={null}
        width={640}
        centered
        destroyOnClose
        data-lenis-prevent
        styles={{
          content: {
            background: componentColorVars["--committee-modal-bg"],
            ...componentColorVars,
          },
        }}
      >
        {selectedMember && (
          <ProfileDetailUI>
            <div className="profile-detail-header">
              {(selectedMember.imageDesktop || selectedMember.imageMobile) && (
                <div className="profile-detail-image">
                  <img
                    loading="lazy"
                    src={selectedMember.imageDesktop || selectedMember.imageMobile}
                    alt={selectedMember.name}
                  />
                </div>
              )}
              <div className="profile-detail-meta">
                <div className="profile-detail-name">{selectedMember.name}</div>
                {selectedMember.qualification && (
                  <div className="profile-detail-qualification">
                    {selectedMember.qualification}
                  </div>
                )}
                {selectedMember.title && (
                  <div className="profile-detail-title">
                    {selectedMember.title}
                  </div>
                )}
              </div>
            </div>
            {selectedMember.bio && (
              <div className="profile-detail-bio">{selectedMember.bio}</div>
            )}
          </ProfileDetailUI>
        )}
      </ProfileModal>
    </FullWidthBackground>
  );
}
