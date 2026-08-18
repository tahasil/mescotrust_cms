"use client";

import { useState } from "react";
import { Button, Modal } from "antd";
import styled from "styled-components";
import {
  FullWidthBackground,
  getColor,
  PageContainer,
} from "@/styles/Theme";
import { renderHighlightedTitle } from "@/components/site/HighlightedTitle";

/* ── Styled Components ── */
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
  .fable-person:focus-within & {
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
    .fable-person:focus-within & {
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

/* ── Helpers ── */
function normalizeItem(it) {
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
  };
}

const DEFAULT_MEMBERS = [
  {
    name: "Prof. M. Farhaan Makba",
    qualification: "M.Sc., PGDME",
    title: "President",
    image: "/images/members-1.png",
    bio: "",
  },
  {
    name: "MR. MASUD MEMON",
    qualification: "B.Com",
    title: "Vice-President",
    image: "/images/members-2.png",
    bio: "",
  },
  {
    name: "MR. SALMAN KARDAME",
    qualification: "General Secretary",
    title: "",
    image: "/images/members-3.png",
    bio: "",
  },
  {
    name: "MR. SHAKIL AHMED RANGREJ",
    qualification: "Treasurer",
    title: "",
    image: "/images/members-4.png",
    bio: "",
  },
];

/**
 * Site component: CommitteeMembers.
 * Grid of member cards with hover overlay and profile modal.
 */
export default function CommitteeMembers(props) {
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  /* ── Title ── */
  const mainTitle = (props?.committeeMembersMainTitle ?? "Committee Members")
    .toString()
    .trim();
  const subTitle = (props?.committeeMembersSubTitle ?? "").toString().trim();
  const subTitleColorKey = (props?.committeeMembersSubTitleColorKey ?? "").toString().trim();
  const subTitleColor = subTitleColorKey ? getColor(subTitleColorKey) : getColor("primary");
  const titleColorKey = (props?.committeeMembersTitleColorKey ?? "")
    .toString()
    .trim();
  const titleColor = titleColorKey ? getColor(titleColorKey) : undefined;
  const componentColor = (key, fallback) => {
    const value = String(props?.[key] ?? "").trim();
    return value ? getColor(value) : getColor(fallback);
  };
  const componentColorVars = {
    "--committee-card-title": componentColor("committeeMembersCardTitleColorKey", "black"),
    "--committee-card-description": componentColor("committeeMembersCardDescriptionColorKey", "blackMuted"),
    "--committee-button-bg": componentColor("committeeMembersButtonBgColorKey", "primary"),
    "--committee-button-text": componentColor("committeeMembersButtonTextColorKey", "white"),
    "--committee-button-border": componentColor("committeeMembersButtonBorderColorKey", "primary"),
    "--committee-button-hover-bg": componentColor("committeeMembersButtonHoverBgColorKey", "white"),
    "--committee-button-hover-text": componentColor("committeeMembersButtonHoverTextColorKey", "primary"),
    "--committee-button-hover-border": componentColor("committeeMembersButtonHoverBorderColorKey", "primary"),
    "--committee-modal-bg": componentColor("committeeMembersModalBgColorKey", "white"),
    "--committee-modal-name": componentColor("committeeMembersModalNameColorKey", "black"),
    "--committee-modal-qualification": componentColor("committeeMembersModalQualificationColorKey", "blackMuted"),
    "--committee-modal-role": componentColor("committeeMembersModalRoleColorKey", "primary"),
    "--committee-modal-bio": componentColor("committeeMembersModalBioColorKey", "black"),
    "--committee-modal-divider": componentColor("committeeMembersModalDividerColorKey", "border"),
    "--committee-modal-image-border": componentColor("committeeMembersModalImageBorderColorKey", "border"),
  };

  /* ── Members ── */
  const rawItems = Array.isArray(props?.committeeMembersItems)
    ? props.committeeMembersItems
    : DEFAULT_MEMBERS;
  const members = rawItems.map(normalizeItem).filter((m) => m.name);

  /* ── Section bg ── */
  const sectionBgType = (
    props?.committeeMembersSectionBgType ?? "default"
  ).toString();
  const sectionBgImage = (props?.committeeMembersSectionBgImage ?? "")
    .toString()
    .trim();
  const sectionBgColorKey = (props?.committeeMembersSectionBgColorKey ?? "")
    .toString()
    .trim();
  const sectionBgClassName =
    sectionBgType === "default" ? "defaultBackground" : undefined;
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
    props?.committeeMembersSectionPaddingTop != null
      ? Number(props.committeeMembersSectionPaddingTop)
      : null;
  const sectionPaddingBottom =
    props?.committeeMembersSectionPaddingBottom != null
      ? Number(props.committeeMembersSectionPaddingBottom)
      : null;
  const sectionMarginTop =
    props?.committeeMembersSectionMarginTop != null
      ? Number(props.committeeMembersSectionMarginTop)
      : null;
  const sectionMarginBottom =
    props?.committeeMembersSectionMarginBottom != null
      ? Number(props.committeeMembersSectionMarginBottom)
      : null;
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

  const pageContainerBgType = (
    props?.committeeMembersPageContainerBgType ?? "default"
  ).toString();
  const pageContainerBgImage = (
    props?.committeeMembersPageContainerBgImage ?? ""
  )
    .toString()
    .trim();
  const pageContainerBgColorKey = (
    props?.committeeMembersPageContainerBgColorKey ?? ""
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
    props?.committeeMembersPageContainerPaddingTop != null
      ? Number(props.committeeMembersPageContainerPaddingTop)
      : null;
  const containerPaddingRight =
    props?.committeeMembersPageContainerPaddingRight != null
      ? Number(props.committeeMembersPageContainerPaddingRight)
      : null;
  const containerPaddingBottom =
    props?.committeeMembersPageContainerPaddingBottom != null
      ? Number(props.committeeMembersPageContainerPaddingBottom)
      : null;
  const containerPaddingLeft =
    props?.committeeMembersPageContainerPaddingLeft != null
      ? Number(props.committeeMembersPageContainerPaddingLeft)
      : null;
  const containerMarginTop =
    props?.committeeMembersPageContainerMarginTop != null
      ? Number(props.committeeMembersPageContainerMarginTop)
      : null;
  const containerMarginBottom =
    props?.committeeMembersPageContainerMarginBottom != null
      ? Number(props.committeeMembersPageContainerMarginBottom)
      : null;
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

  return (
    <FullWidthBackground className={sectionBgClassName} $managedStyle={sectionBgStyle}>
      <PageContainer $managedStyle={pageContainerBgStyle}>
        <div className="fable-section" style={componentColorVars}>
            {subTitle ? <p className="fable-eyebrow" style={{ color: subTitleColor }}>{subTitle}</p> : null}
            <h2
              className="fable-heading"
              style={{
                ...(titleColor ? { color: titleColor } : {}),
              }}
            >
              {renderHighlightedTitle(mainTitle, props)}
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
                  <ViewProfileBtn type="primary" onClick={openProfile}>
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
