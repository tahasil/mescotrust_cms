import styled from "styled-components";
import { getColor } from "@/styles/Theme";

export const FooterContainer = styled.footer`
  width: 100%;
  position: relative;
  background-color: ${(props) =>
    props.$footerBgValue || getColor("black")};
  ${(props) =>
    props.$footerBackgroundImageUrl
      ? `background-image: url(${props.$footerBackgroundImageUrl}); background-size: cover; background-position: center;`
      : ""}
  color: ${(props) =>
    props.$footerTextValue || getColor("white")};
  ul {
    list-style: none;
    padding: 0 30px;
    margin: 0;
    @media (max-width: 992px) {
      padding: 0;
    }
    li {
      margin-bottom: 10px;
      font-size: 20px;
      font-weight: 400;
      line-height: 30px;
      color: ${(props) =>
        props.$footerTextValue || getColor("white")};
      opacity: 0.8;
      span {
        font-size: 14px;
        font-weight: 400;
        line-height: 20px !important;
        color: ${(props) =>
          props.$footerTextValue || getColor("white")};
      }
    }
    a {
      color: ${(props) =>
        props.$footerTextValue || getColor("white")};
      text-decoration: none;
      font-size: 14px;
      font-weight: 400;
      line-height: 20px !important;
      &:hover {
        color: ${getColor("primary")};
      }
    }
  }
`;

export const FooterInner = styled.div`
  width: 90%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 0 0;
  @media (max-width: 768px) {
    width: 100%;
    padding: 32px 20px 0;
  }
`;

export const FooterLogo = styled.a`
  display: inline-block;
  margin-bottom: 24px;
  img {
    display: block;
    height: auto;
    max-height: 44px;
    width: auto;
  }
`;

export const FooterParagraph = styled.p`
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  opacity: 0.9;
  margin: 0 0 12px;
  color: ${(props) =>
    props.$footerTextValue || getColor("white")};
`;

export const CopyrightBar = styled.div`
  text-align: center;
  margin-top: 40px;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  color: ${getColor("white")};
  background: ${(props) =>
    props.$footerCopyrightBarValue || getColor("gradient")};
  padding: 10px 0;
`;
