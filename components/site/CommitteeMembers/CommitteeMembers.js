"use client";

import { useState } from "react";
import { Card, Button, Modal } from "antd";
import styled from "styled-components";
import {
  FullWidthBackground,
  getColor,
  PageContainer,
} from "@/styles/Theme";

/* ── Styled Components ── */
const CardWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 24px;
  overflow: hidden;
  z-index: 0;
  &:hover {
    z-index: 2;
    box-shadow:
      0 4px 10px rgba(0, 0, 0, 0.12),
      0 4px 8px rgba(0, 0, 0, 0.08);
  }
`;

const CommitteeCard = styled(Card)`
  width: 100%;
  height: 100%;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 24px !important;
  overflow: hidden;
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  background: ${() => getColor("white")};
  .ant-card-cover {
    border-radius: 24px 24px 0 0;
    overflow: hidden;
    position: relative;
    > * {
      width: 100%;
      display: block;
    }
    img {
      width: 100%;
      height: auto;
      object-fit: cover;
      transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
  }
  .card-wrapper:hover & .ant-card-cover img {
    transform: scale(1.1);
  }
  .ant-card-body {
    padding: 0;
    border-radius: 0 0 24px 24px;
    overflow: hidden;
  }
  .card-wrapper:hover & {
    border-color: rgba(0, 0, 0, 0.12);
  }
`;

const CardBodyWrapper = styled.div`
  position: relative;
  padding: 24px 20px;
  text-align: center;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  .name {
    font-size: 16px;
    font-weight: 700;
    line-height: 1.4;
    color: ${() => getColor("black")};
    text-transform: uppercase;
    letter-spacing: 0.02em;
    margin-bottom: 6px;
    @media (max-width: 768px) {
      font-size: 14px;
    }
  }
  .qualification {
    font-size: 13px;
    font-weight: 400;
    line-height: 1.4;
    color: ${() => getColor("black")};
    opacity: 0.6;
    margin-bottom: 4px;
    @media (max-width: 768px) {
      font-size: 12px;
    }
  }
  .title {
    font-size: 13px;
    font-weight: 400;
    line-height: 1.4;
    color: ${() => getColor("black")};
    opacity: 0.6;
    @media (max-width: 768px) {
      font-size: 12px;
    }
  }
`;

const ProfileOverlay = styled.div`
  position: absolute;
  inset: 0;
  border-radius: 24px;
  background: rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  transform: scale(0);
  opacity: 0;
  pointer-events: none;
  transform-origin: center center;
  transition:
    transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.25s ease;
  z-index: 2;
  .card-wrapper:hover & {
    transform: scale(1);
    opacity: 1;
    pointer-events: auto;
  }
`;

const ViewProfileBtn = styled(Button)`
  && {
    padding: 0 24px;
    font-size: 14px;
    font-weight: 500;
    border-radius: 30px;
    background: ${() => getColor("primary")};
    border-color: ${() => getColor("primary")};
    color: ${() => getColor("white")};
    opacity: 0;
    transform: scale(0.9);
    transition:
      opacity 0.3s ease 0.08s,
      transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) 0.08s,
      background 0.25s ease,
      border-color 0.25s ease,
      color 0.25s ease;
    .card-wrapper:hover & {
      opacity: 1;
      transform: scale(1);
    }
    &:hover {
      background: ${() => getColor("white")} !important;
      border-color: ${() => getColor("primary")} !important;
      color: ${() => getColor("primary")} !important;
    }
  }
`;

const ProfileDetailUI = styled.div`
  padding: 8px 0;
  .profile-detail-header {
    display: flex;
    align-items: center;
    gap: 24px;
    margin-bottom: 20px;
  }
  .profile-detail-image {
    flex-shrink: 0;
    width: 160px;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid
      ${(props) => getColor("themeBorder") || "rgba(0, 0, 0, 0.14)"};
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
    max-height: 70vh;
    overflow-y: auto;
  }
  .profile-detail-name {
    font-size: 20px;
    font-weight: 600;
    color: ${() => getColor("black")};
    text-transform: uppercase;
    letter-spacing: 0.02em;
    @media (max-width: 768px) {
      font-size: 18px;
    }
  }
  .profile-detail-qualification {
    font-size: 14px;
    color: ${() => getColor("black")};
    opacity: 0.6;
    margin-bottom: 4px;
  }
  .profile-detail-title {
    font-size: 14px;
    font-weight: 600;
    color: ${() => getColor("primary")};
  }
  .profile-detail-bio {
    position: relative;
    font-size: 14px;
    line-height: 1.6;
    color: ${() => getColor("black")};
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
    background: rgba(0, 0, 0, 0.14);
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
  const titleFontSize =
    props?.committeeMembersTitleFontSize != null
      ? Number(props.committeeMembersTitleFontSize)
      : 24;
  const titleFontWeight =
    props?.committeeMembersTitleFontWeight != null
      ? Number(props.committeeMembersTitleFontWeight)
      : 600;

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
    <FullWidthBackground className={sectionBgClassName} style={sectionBgStyle}>
      <PageContainer style={pageContainerBgStyle}>
        <div className="fable-section">
            {subTitle ? <p className="fable-eyebrow" style={{ color: subTitleColor }}>{subTitle}</p> : null}
            <h2
              className="fable-heading"
              style={{
                ...(titleColor ? { color: titleColor } : {}),
                fontSize: titleFontSize,
                fontWeight: titleFontWeight,
              }}
            >
              {String(mainTitle).split(/(\*[^*]+\*)/g).map((part, index) => part.startsWith("*") && part.endsWith("*") ? <em key={index}>{part.slice(1, -1)}</em> : <span key={index}>{part}</span>)}
            </h2>
        <div className="fable-people">
          {members.map((member, idx) => (
              <CardWrapper className="card-wrapper fable-person" key={`${member.name}-${idx}`}>
                <CommitteeCard
                  cover={
                    member.imageDesktop || member.imageMobile ? (
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
                    ) : undefined
                  }
                >
                  <CardBodyWrapper>
                    <h3 className="name">{member.name}</h3>
                    {member.qualification && (
                      <div className="qualification">
                        {member.qualification}
                      </div>
                    )}
                    {member.title && (
                      <div className="title">{member.title}</div>
                    )}
                  </CardBodyWrapper>
                </CommitteeCard>
                <ProfileOverlay>
                  <ViewProfileBtn
                    type="primary"
                    size="large"
                    onClick={() => {
                      setSelectedMember(member);
                      setProfileModalOpen(true);
                    }}
                  >
                    View Profile
                  </ViewProfileBtn>
                </ProfileOverlay>
              </CardWrapper>
          ))}
        </div>
        <style>{`.fable-person.card-wrapper { padding: 0; }`}</style>
        </div>
      </PageContainer>

      <Modal
        open={profileModalOpen}
        onCancel={() => {
          setProfileModalOpen(false);
          setSelectedMember(null);
        }}
        footer={null}
        width={640}
        centered
        destroyOnClose
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
      </Modal>
    </FullWidthBackground>
  );
}
