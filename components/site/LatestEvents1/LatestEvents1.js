"use client";

import { Row, Col, Card } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import Link from "next/link";
import styled from "styled-components";
import {
  PageContainer,
  MainTitle,
  SubTitle,
  ThemeButton,
  getColor,
} from "@/styles/Theme";

/** Card style for latest news items (matches mescotrust HomeCardNews) */
const HomeCardNews = styled(Card)`
  width: 100%;
  height: 100%;
  position: relative;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 20px;
  .ant-card-body {
    height: 100%;
  }
  .ant-card-body > .ant-row {
    display: flex;
    align-items: center;
  }
  h1 {
    margin: 0px;
    font-size: 14px;
    font-weight: 400;
    color: ${() => getColor("black")};
    margin-bottom: 10px;
    @media (max-width: 768px) {
      font-size: 12px;
      margin-bottom: 8px;
    }
  }
  h2 {
    margin: 0px;
    font-size: 20px;
    font-weight: 700;
    color: ${() => getColor("black")};
    margin-bottom: 4px;
    @media (max-width: 768px) {
      font-size: 18px;
    }
  }
  p {
    margin: 0px;
    font-size: 14px;
    font-weight: 400;
    color: ${() => getColor("black")};
    margin-bottom: 4px;
    @media (max-width: 768px) {
      font-size: 12px;
    }
  }
`;

function normalizeItem(it) {
  return {
    imageUrl: it?.imageUrl != null ? String(it.imageUrl).trim() : "",
    date: it?.date != null ? String(it.date).trim() : "",
    title: it?.title != null ? String(it.title).trim() : "",
    description: it?.description != null ? String(it.description).trim() : "",
    buttonText:
      it?.buttonText != null ? String(it.buttonText).trim() : "Read Post",
    buttonLink: it?.buttonLink != null ? String(it.buttonLink).trim() : "/",
  };
}

/**
 * Site component: LatestEvents1 (Latest News). All content editable via EditForm (same as HomeHero/Subscribe).
 * Props (from theme/layout): latestEvents1SubTitle, latestEvents1MainTitle, latestEvents1Items[], color keys.
 */
export default function LatestEvents1(props) {
  const subTitle = (props?.latestEvents1SubTitle ?? "Latest News")
    .toString()
    .trim();
  const mainTitle = (
    props?.latestEvents1MainTitle ?? "Stay Informed. Stay Ahead."
  )
    .toString()
    .trim();
  const rawItems =
    Array.isArray(props?.latestEvents1Items) &&
    props.latestEvents1Items.length > 0
      ? props.latestEvents1Items
      : [
          {
            imageUrl: "/images/news-1.png",
            date: "02 Feb 2026",
            title: "Scholarship information for the year 2025-26",
            description:
              "Lorem ipsum dolor sit amet consectetur. Amet mattis tellus et as ectus orc.",
            buttonText: "Read Post",
            buttonLink: "/",
          },
          {
            imageUrl: "/images/news-2.png",
            date: "02 Feb 2026",
            title:
              "Congratulations to all our EAS students for passing their HSC examination.",
            description: "",
            buttonText: "Read Post",
            buttonLink: "/",
          },
        ];

  const items = rawItems.map(normalizeItem);

  const subTitleColorKey = (props?.latestEvents1SubTitleColorKey ?? "")
    .toString()
    .trim();
  const mainTitleColorKey = (props?.latestEvents1MainTitleColorKey ?? "")
    .toString()
    .trim();
  const buttonColorKey = (props?.latestEvents1ButtonColorKey ?? "")
    .toString()
    .trim();

  const subTitleColor = subTitleColorKey
    ? getColor(subTitleColorKey)
    : getColor("black");
  const mainTitleColor = mainTitleColorKey
    ? getColor(mainTitleColorKey)
    : getColor("black");
  const buttonColor = buttonColorKey
    ? getColor(buttonColorKey)
    : getColor("primary");

  if (items.length === 0) return null;

  return (
    <PageContainer className="">
      <Row gutter={[16, 16]}>
        <Col span={24} className="mb-4">
          <SubTitle color={subTitleColor}>{subTitle}</SubTitle>
          <MainTitle color={mainTitleColor}>{mainTitle}</MainTitle>
        </Col>
      </Row>
      <Row gutter={[16, 16]}>
        {items.map((item, index) => (
          <Col key={index} xs={24} sm={24} md={24} lg={12}>
            <HomeCardNews>
              <Row gutter={[16, 16]} align="middle">
                <Col span={24} sm={8} md={8} lg={10}>
                  {item.imageUrl ? (
                    <img
                      className="img-fluid"
                      src={item.imageUrl}
                      alt={item.title || `News ${index + 1}`}
                    />
                  ) : (
                    <div
                      style={{
                        minHeight: 120,
                        background: "#f0f0f0",
                        borderRadius: 8,
                      }}
                    />
                  )}
                </Col>
                <Col span={24} sm={16} md={16} lg={14}>
                  {item.date ? <h1>{item.date}</h1> : null}
                  {item.title ? <h2>{item.title}</h2> : null}
                  {item.description ? <p>{item.description}</p> : null}
                  <Link href={item.buttonLink || "/"}>
                    <ThemeButton
                      className="link"
                      color={buttonColor}
                      type="button"
                      size="large"
                      icon={<ArrowRightOutlined />}
                      iconPosition="end"
                    >
                      {item.buttonText || "Read Post"}
                    </ThemeButton>
                  </Link>
                </Col>
              </Row>
            </HomeCardNews>
          </Col>
        ))}
      </Row>
    </PageContainer>
  );
}
