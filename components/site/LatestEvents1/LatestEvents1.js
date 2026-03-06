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

/**
 * Site component: LatestEvents1 (Latest News / Latest Events).
 * Props come from theme/Component defaultProps (e.g. sectionTitle, items).
 */
export default function LatestEvents1(props) {
  const primaryColor = getColor("primary") || getColor("gradient");

  return (
    <section
      className="site-component-latestevents1"
      data-component="LatestEvents1"
    >
      <PageContainer>
        <Row gutter={[16, 16]}>
          <Col span={24} className="mb-4">
            <SubTitle>Latest News</SubTitle>
            <MainTitle>Stay Informed. Stay Ahead.</MainTitle>
          </Col>
        </Row>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={24} lg={12}>
            <HomeCardNews>
              <Row gutter={[16, 16]} align="middle">
                <Col span={24} sm={8} md={8} lg={10}>
                  <img
                    className="img-fluid"
                    src="/images/news-1.png"
                    alt="News 1"
                  />
                </Col>
                <Col span={24} sm={16} md={16} lg={14}>
                  <h1>02 Feb 2026</h1>
                  <h2>Scholarship information for the year 2025-26</h2>
                  <p>
                    Lorem ipsum dolor sit amet consectetur. Amet mattis tellus et
                    as ectus orc.
                  </p>
                  <Link href="/">
                    <ThemeButton
                      className="link"
                      color={primaryColor}
                      type="button"
                      size="large"
                      icon={<ArrowRightOutlined />}
                      iconPosition="end"
                    >
                      Read Post
                    </ThemeButton>
                  </Link>
                </Col>
              </Row>
            </HomeCardNews>
          </Col>
          <Col xs={24} sm={24} md={24} lg={12}>
            <HomeCardNews>
              <Row gutter={[16, 16]} align="middle">
                <Col span={24} sm={8} md={8} lg={10}>
                  <img
                    className="img-fluid"
                    src="/images/news-2.png"
                    alt="News 2"
                  />
                </Col>
                <Col span={24} sm={16} md={16} lg={14}>
                  <h1>02 Feb 2026</h1>
                  <h2>
                    Congratulations to all our EAS students for passing their
                    HSC examination.
                  </h2>
                  <Link href="/">
                    <ThemeButton
                      className="link"
                      color={primaryColor}
                      type="button"
                      size="large"
                      icon={<ArrowRightOutlined />}
                      iconPosition="end"
                    >
                      Read Post
                    </ThemeButton>
                  </Link>
                </Col>
              </Row>
            </HomeCardNews>
          </Col>
        </Row>
      </PageContainer>
    </section>
  );
}
