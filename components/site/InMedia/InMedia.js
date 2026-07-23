"use client";

import { useState, useEffect } from "react";
import { Row, Col, Space } from "antd";
import styled from "styled-components";
import {
  FullWidthBackground,
  getColor,
  MainTitle,
  PageContainer,
  SubTitle,
} from "@/styles/Theme";
import { ThemeModal } from "@/styles/Theme";

/* ── Styled Components ── */
const ThemeScrollModal = styled(ThemeModal)`
  .ant-modal-body {
    max-height: 80vh;
    overflow-y: auto;
    overscroll-behavior: contain;
    &::-webkit-scrollbar {
      width: 2px; /* Width of the vertical scrollbar */
    }

    /* The background of the scrollbar */
    &::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.1);
      border-radius: 10px;
    }

    /* The actual draggable handle */
    &::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 10px;
    }

    /* Hover effect on the handle */
    &::-webkit-scrollbar-thumb:hover {
      background: rgba(0, 0, 0, 0.3);
    }
  }
  .ant-modal-close {
    background: #dbdbdb !important;
    top: 6px !important;
    right: 6px !important;
    border-radius: 50% !important;
    z-index: 99 !important;
    svg {
      font-size: 14px !important;
      color: ${getColor("black")} !important;
      opacity: 0.7 !important;
    }
  }
`;
const CardWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 20px;
  overflow: hidden;
  z-index: 0;
  &:hover {
    z-index: 2;
    box-shadow:
      0 4px 10px rgba(0, 0, 0, 0.12),
      0 4px 8px rgba(0, 0, 0, 0.08);
  }
`;

const MediaCard = styled.div`
  width: 100%;
  height: 100%;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 20px;
  overflow: hidden;
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  background: #fff;
  padding: 0;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s, border-color 0.3s;
  &:hover { transform: translateY(-5px); box-shadow: 0 26px 54px rgba(33, 30, 46, 0.1); }
  .card-wrapper:hover & {
    border-color: rgba(0, 0, 0, 0.12);
  }
  .imageWrapper {
    width: 100%;
    height: auto;
    aspect-ratio: 16 / 10;
    overflow: hidden;
    border-radius: 0;
    object-fit: cover;
  }
`;

const CardBody = styled.div`
  padding: clamp(20px, 2.2vw, 30px);
  text-align: start;
  display: block;
  .name {
    font-size: 16px;
    font-weight: 700;
    line-height: 1.4;
    margin-bottom: 6px;
    @media (max-width: 768px) {
      font-size: 14px;
    }
  }
  .date {
    font-size: 12px;
    font-weight: 400;
    line-height: 1.4;
    text-align: start;
  }
  .source {
    background: rgba(0, 0, 0, 0.05);
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 400;
    line-height: 1.4;
    text-align: start;
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

const ViewBtn = styled.button`
  padding: 8px 24px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 30px;
  border: 2px solid var(--primary-color, #1677ff);
  background: var(--primary-color, #1677ff);
  color: #fff;
  cursor: pointer;
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
    background: #fff;
    color: var(--primary-color, #1677ff);
  }
`;

/**
 * Site component: InMedia.
 * Cards grid with thumbnail, title, date, source.
 * Click "View" opens full media image in a modal.
 */
export default function InMedia(props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  /* ── Title fields ── */
  const mainTitle = (props?.mainTitle ?? "In Media").toString().trim();
  const subTitle = (props?.subTitle ?? "").toString().trim();
  const titleEnabled = props?.inMediaTitleEnabled !== false;
  const subTitleEnabled = props?.inMediaSubTitleEnabled !== false;
  const titleColorKey = (props?.titleColorKey ?? "").toString().trim();
  const titleColor = titleColorKey
    ? getColor(titleColorKey)
    : getColor("primary");
  const subTitleColorKey = (props?.inMediaSubTitleColorKey ?? "")
    .toString()
    .trim();
  const subTitleColor = subTitleColorKey
    ? getColor(subTitleColorKey)
    : undefined;

  /* ── Items ── */
  const items = Array.isArray(props?.inMediaItems) ? props.inMediaItems : [];

  /* ── Colors ── */
  const nameColorKey = (props?.inMediaNameColorKey ?? "").toString().trim();
  const nameColor = nameColorKey ? getColor(nameColorKey) : undefined;
  const dateColorKey = (props?.inMediaDateColorKey ?? "").toString().trim();
  const dateColor = dateColorKey ? getColor(dateColorKey) : undefined;

  /* ── Section bg ── */
  const sectionBgType = (props?.inMediaSectionBgType ?? "default").toString();
  const sectionBgImage = (props?.inMediaSectionBgImage ?? "").toString().trim();
  const sectionBgColorKey = (props?.inMediaSectionBgColorKey ?? "")
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
    props?.inMediaSectionPaddingTop != null
      ? Number(props.inMediaSectionPaddingTop)
      : null;
  const sectionPaddingBottom =
    props?.inMediaSectionPaddingBottom != null
      ? Number(props.inMediaSectionPaddingBottom)
      : null;
  const sectionMarginTop =
    props?.inMediaSectionMarginTop != null
      ? Number(props.inMediaSectionMarginTop)
      : null;
  const sectionMarginBottom =
    props?.inMediaSectionMarginBottom != null
      ? Number(props.inMediaSectionMarginBottom)
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
    props?.inMediaPageContainerBgType ?? "default"
  ).toString();
  const pageContainerBgImage = (props?.inMediaPageContainerBgImage ?? "")
    .toString()
    .trim();
  const pageContainerBgColorKey = (props?.inMediaPageContainerBgColorKey ?? "")
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
    props?.inMediaPageContainerPaddingTop != null
      ? Number(props.inMediaPageContainerPaddingTop)
      : null;
  const containerPaddingRight =
    props?.inMediaPageContainerPaddingRight != null
      ? Number(props.inMediaPageContainerPaddingRight)
      : null;
  const containerPaddingBottom =
    props?.inMediaPageContainerPaddingBottom != null
      ? Number(props.inMediaPageContainerPaddingBottom)
      : null;
  const containerPaddingLeft =
    props?.inMediaPageContainerPaddingLeft != null
      ? Number(props.inMediaPageContainerPaddingLeft)
      : null;
  const containerMarginTop =
    props?.inMediaPageContainerMarginTop != null
      ? Number(props.inMediaPageContainerMarginTop)
      : null;
  const containerMarginBottom =
    props?.inMediaPageContainerMarginBottom != null
      ? Number(props.inMediaPageContainerMarginBottom)
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
    <>
      <FullWidthBackground
        className={sectionBgClassName}
        $managedStyle={sectionBgStyle}
      >
        <PageContainer $managedStyle={pageContainerBgStyle}>
          <div className="fable-section">
          {(titleEnabled || subTitleEnabled) && (
            <Row gutter={[16, 16]}>
              <Col span={24} className="mb-4">
                {subTitleEnabled && subTitle && (
                  <SubTitle className="fable-eyebrow"
                    style={subTitleColor ? { color: subTitleColor } : undefined}
                  >
                    {subTitle}
                  </SubTitle>
                )}
                {titleEnabled && (
                  <MainTitle className="fable-heading" color={titleColor}>{mainTitle}</MainTitle>
                )}
              </Col>
            </Row>
          )}
          <Row gutter={[24, 24]}>
            {items.map((item, idx) => {
              const name = (item?.name ?? "").toString().trim();
              const date = (item?.date ?? "").toString().trim();
              const source = (item?.source ?? "").toString().trim();
              const imageDesktop = (
                item?.imageDesktop ?? item?.image ?? ""
              )
                .toString()
                .trim();
              const imageMobile = (item?.imageMobile ?? "").toString().trim();
              const image = imageDesktop || imageMobile;
              return (
                <Col key={idx} xs={24} sm={12} md={12} lg={8}>
                  <CardWrapper className="card-wrapper fable-card">
                    <MediaCard className="fable-card__inner">
                      {image && (
                        <div className="imageWrapper fable-card__media">
                          <picture>
                            {imageMobile ? (
                              <source media="(max-width: 767px)" srcSet={imageMobile} />
                            ) : null}
                            <img
                              loading="lazy"
                              className="w-100"
                              src={imageDesktop || imageMobile}
                              alt={name}
                              style={{ display: "block" }}
                            />
                          </picture>
                        </div>
                      )}
                      <CardBody className="fable-card__body">
                        {name && (
                          <div
                            className="name"
                            style={nameColor ? { color: nameColor } : undefined}
                          >
                            {name}
                          </div>
                        )}
                        <div className="d-block text-start text-muted">
                          <Space size={8}>
                            {date && (
                              <div
                                className="date"
                                style={
                                  dateColor ? { color: dateColor } : undefined
                                }
                              >
                                {date}
                              </div>
                            )}
                            {source && <div className="source">{source}</div>}
                          </Space>
                        </div>
                      </CardBody>
                    </MediaCard>
                    {image && (
                      <ProfileOverlay>
                        <ViewBtn
                          onClick={() => {
                            setSelectedItem(item);
                            setModalOpen(true);
                          }}
                        >
                          View
                        </ViewBtn>
                      </ProfileOverlay>
                    )}
                  </CardWrapper>
                </Col>
              );
            })}
          </Row>
          </div>
        </PageContainer>
      </FullWidthBackground>

      <ThemeScrollModal
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setSelectedItem(null);
        }}
        centered
        footer={null}
        width={800}
        destroyOnClose
        data-lenis-prevent
      >
        {selectedItem &&
        ((selectedItem.imageDesktop ?? selectedItem.image ?? "").toString().trim() ||
          (selectedItem.imageMobile ?? "").toString().trim()) && (
          <div data-lenis-prevent>
            <img
              loading="lazy"
              src={
                (selectedItem.imageDesktop ?? selectedItem.image ?? "")
                  .toString()
                  .trim() ||
                (selectedItem.imageMobile ?? "").toString().trim()
              }
              alt={selectedItem.name || "Media"}
              style={{ display: "block", width: "100%", height: "auto" }}
            />
          </div>
        )}
      </ThemeScrollModal>
    </>
  );
}
