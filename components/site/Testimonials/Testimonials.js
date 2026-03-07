"use client";

import { useState } from "react";
import styled from "styled-components";
import {
  FullWidthBackground,
  getColor,
  MainTitle,
  PageContainer,
} from "@/styles/Theme";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { StarFilled, StarOutlined } from "@ant-design/icons";
import { Col, Row } from "antd";

/** Inner content wrapper (section + data-component come from ComponentRenderer) */
const ContentWrap = styled.div`
  padding: 0px;
  background: #fff;
  .site-component-testimonials {
    max-width: 1200px;
    margin: 0 auto;
  }
  @media (max-width: 768px) {
    padding: 40px 16px 60px;
  }
`;

const Viewport = styled.div`
  width: 100%;
  overflow: hidden;
`;

const Track = styled.div`
  display: flex;
  transition: transform 0.4s ease;
  transform: ${(p) => `translateX(-${p.$offsetPercent}%)`};
`;

const Slide = styled.div`
  flex: 0 0 ${(p) => 100 / p.$perView}%;
  padding: 0 12px;
  box-sizing: border-box;
`;

/** Card with L-shaped brackets in corners */
const Card = styled.div`
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 32px 24px 28px;
  text-align: center;
  min-height: 340px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  position: relative;
  &::before,
  &::after {
    content: "";
    position: absolute;
    width: 24px;
    height: 24px;
    border-color: ${() => getColor("primary")};
    border-style: solid;
    border-width: 0;
  }
  &::before {
    top: 12px;
    left: 12px;
    border-left-width: 3px;
    border-top-width: 3px;
  }
  &::after {
    bottom: 12px;
    right: 12px;
    border-right-width: 3px;
    border-bottom-width: 3px;
  }
  @media (max-width: 768px) {
    padding: 24px 20px 22px;
    min-height: 300px;
  }
`;

const Avatar = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: ${(p) =>
    p.$src
      ? `url(${p.$src}) center/cover`
      : "linear-gradient(135deg, #d8d4de 0%, #8a7f94 100%)"};
  margin-bottom: 16px;
  flex-shrink: 0;
`;

const Name = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: ${() => getColor("primary")};
  margin-bottom: 12px;
  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

const QuoteText = styled.p`
  margin: 0 0 16px;
  font-size: 15px;
  line-height: 1.6;
  color: #333;
  flex: 1;
  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const StarWrap = styled.div`
  display: flex;
  justify-content: center;
  gap: 2px;
  margin-top: auto;
  .anticon {
    font-size: 18px;
  }
`;

const NavWrap = styled.div`
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 32px;
`;

const NavBtn = styled.button`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid ${() => getColor("primary")};
  background: ${(p) => (p.$primary ? getColor("primary") : "#fff")};
  color: ${(p) => (p.$primary ? "#fff" : getColor("primary"))};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s;
  .anticon {
    font-size: 18px;
  }
  &:hover {
    opacity: 0.9;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

function normalizeItem(it) {
  return {
    quote: it?.quote != null ? String(it.quote).trim() : "",
    imageUrl: it?.imageUrl != null ? String(it.imageUrl).trim() : "",
    name: it?.name != null ? String(it.name).trim() : "",
    title: it?.title != null ? String(it.title).trim() : "",
    rating: Math.min(5, Math.max(0, parseInt(it?.rating, 10) || 0)),
  };
}

function StarRating({ rating }) {
  const r = Math.min(5, Math.max(0, Number(rating) || 0));
  return (
    <StarWrap>
      {[1, 2, 3, 4, 5].map((i) =>
        i <= r ? (
          <StarFilled key={i} style={{ color: getColor("primary") }} />
        ) : (
          <StarOutlined key={i} style={{ color: getColor("primary") }} />
        ),
      )}
    </StarWrap>
  );
}

/** Fallback when no testimonialsItems from theme/block props (e.g. right after "Add Component"). */
const DEFAULT_ITEMS = [
  {
    quote:
      "Ali's professionalism and dedication led our software project to success, delivering high-quality results on time and within budget. His expertise and reliability make him our top choice for any future tech/software needs.",
    imageUrl: "",
    name: "Tracye Lawyer",
    title: "",
    rating: 2,
  },
  {
    quote:
      "Ali's professionalism and dedication led our software project to success, delivering high-quality results on time and within budget. His expertise and reliability make him our top choice for any future tech/software needs.",
    imageUrl: "",
    name: "Tracye Lawyer",
    title: "",
    rating: 4,
  },
  {
    quote:
      "Ali's professionalism and dedication led our software project to success, delivering high-quality results on time and within budget. His expertise and reliability make him our top choice for any future tech/software needs.",
    imageUrl: "",
    name: "Tracye Lawyer",
    title: "",
    rating: 3,
  },
];

const CARDS_PER_VIEW = 3;

/**
 * Site component: Testimonials.
 * Three full cards per view, title, L-brackets, avatar, name, quote, star rating, arrow nav.
 * Props: testimonialsTitle, testimonialsItems[] { quote, imageUrl, name, title, rating }.
 */
export default function Testimonials(props) {
  const raw = props?.testimonialsItems ?? props?.items;
  const items =
    Array.isArray(raw) && raw.length > 0
      ? raw.map(normalizeItem).filter((i) => i.quote || i.name)
      : DEFAULT_ITEMS;

  const title =
    (props?.testimonialsTitle ?? props?.title ?? "Testimonials")
      .toString()
      .trim() || "Testimonials";

  const maxPage = Math.max(0, Math.ceil(items.length / CARDS_PER_VIEW) - 1);
  const [page, setPage] = useState(0);
  const offsetPercent = page * 100;
  const perView = Math.min(CARDS_PER_VIEW, items.length) || 1;

  return (
    <FullWidthBackground className="blackBackground">
      <PageContainer>
        <Row gutter={[16, 16]}>
          <Col span={24} className=" text-center mb-4">
            <MainTitle>{title}</MainTitle>
          </Col>
        </Row>
        <Viewport>
          <Track $offsetPercent={offsetPercent}>
            {items.map((item, i) => (
              <Slide key={i} $perView={perView}>
                <Card>
                  <Avatar $src={item.imageUrl || undefined} />
                  <Name>{item.name || "—"}</Name>
                  <QuoteText>{item.quote || "—"}</QuoteText>
                  <StarRating rating={item.rating} />
                </Card>
              </Slide>
            ))}
          </Track>
        </Viewport>
        {items.length > CARDS_PER_VIEW && (
          <NavWrap>
            <NavBtn
              $primary={false}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              aria-label="Previous testimonials"
            >
              <LeftOutlined />
            </NavBtn>
            <NavBtn
              $primary
              onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
              disabled={page >= maxPage}
              aria-label="Next testimonials"
            >
              <RightOutlined />
            </NavBtn>
          </NavWrap>
        )}
      </PageContainer>
    </FullWidthBackground>
  );
}
