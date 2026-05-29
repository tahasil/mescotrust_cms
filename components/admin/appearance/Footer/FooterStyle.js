import styled from "styled-components";
import { getColor } from "@/styles/Theme";

export const FooterContainer = styled.footer`
  width: 100%;
  position: relative;
  overflow: hidden;
  background-color: ${(props) => props.$footerBgValue || getColor("black")};
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
  ${(props) => {
    const url = props.$footerBackgroundImageUrl;
    if (!url || typeof url !== "string" || !url.trim()) return "";
    const safe = url.trim().replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return `background-image: url("${safe}");`;
  }}
  color: ${(props) => props.$footerTextValue || getColor("white")};

  a {
    color: ${(props) => props.$footerTextValue || getColor("white")};
    text-decoration: none;
    transition:
      opacity 0.2s ease,
      color 0.2s ease;

    &:hover {
      opacity: 0.88;
      color: ${(props) => props.$footerTextValue || getColor("white")};
    }
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  li {
    margin-bottom: 12px;
    font-size: 14px;
    line-height: 1.45;
    color: ${(props) => props.$footerTextValue || getColor("white")};
    overflow-wrap: anywhere;
    word-break: break-word;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .footer-brand-col {
    .footer-about-text {
      max-width: 420px;
      margin-bottom: 14px;
      white-space: pre-line;
    }

    .footer-contact-line {
      margin-bottom: 6px;
      font-size: 14px;
      line-height: 1.45;
      white-space: pre-line;
      overflow-wrap: anywhere;
      word-break: break-word;
      color: ${(props) => props.$footerTextValue || getColor("white")};

      a {
        overflow-wrap: anywhere;
        word-break: break-word;
      }
    }
  }

  .footer-link-title,
  .footer-latest-title {
    margin: 0 0 18px;
    font-size: 18px !important;
    font-weight: 600;
    line-height: 1.2;
    color: ${(props) => props.$footerTextValue || getColor("white")};
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .footer-latest-form {
    width: 100%;
    max-width: 380px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px;
    border-radius: 999px;
    background: #f6f3f2;
    border: 1px solid rgba(255, 255, 255, 0.16);
  }

  .footer-latest-input {
    flex: 1 1 auto;
    min-width: 0;
    border: 0;
    outline: none;
    box-shadow: none;
    background: transparent;
    color: #1f1f1f;
    font-size: 14px;
    line-height: 1.3;
    padding: 8px 12px 8px 16px;

    &::placeholder {
      color: rgba(31, 31, 31, 0.7);
    }
  }

  .footer-latest-btn {
    border: 0;
    outline: none;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    background: ${getColor("secondary") || "#fbb040"};
    color: #0f2f3a;
    flex-shrink: 0;
    transition:
      transform 0.2s ease,
      opacity 0.2s ease;

    .anticon {
      font-size: 18px;
    }

    &:hover:not(:disabled) {
      transform: translateY(-1px);
      opacity: 0.92;
    }

    &:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
  }

  .footer-socials-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 18px;
    margin-top: 20px;
  }

  a.footer-social-link {
    width: auto;
    height: auto;
    border-radius: 0;
    background: transparent;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    line-height: 1;
    color: ${(props) =>
      props.$footerSocialValue || props.$footerTextValue || getColor("white")};
    opacity: 1;

    .anticon {
      font-size: 24px;
      color: ${(props) =>
        props.$footerSocialValue ||
        props.$footerTextValue ||
        getColor("white")};
    }

    &:hover {
      opacity: 0.85;
      transform: translateY(-1px);
    }
  }

  @media (max-width: 991px) {
    .footer-brand-col .footer-about-text {
      max-width: 100%;
    }

    .footer-link-title,
    .footer-latest-title {
      margin-bottom: 12px;
    }

    .footer-latest-col {
      margin-top: 6px;
    }

    .footer-latest-form {
      max-width: 100%;
    }

    a.footer-social-link .anticon {
      font-size: 22px;
    }
  }

  @media (max-width: 767px) {
    li,
    .footer-brand-col .footer-contact-line,
    .footer-about-text {
      font-size: 14px;
      line-height: 1.5;
    }

    .footer-link-title,
    .footer-latest-title {
      font-size: 16px !important;
      margin-bottom: 10px;
    }

    .footer-latest-input {
      font-size: 15px;
      padding-left: 12px;
    }

    .footer-latest-btn {
      width: 42px;
      height: 42px;
    }

    a.footer-social-link .anticon {
      font-size: 20px;
    }
  }

  @media (max-width: 480px) {
    .footer-link-title,
    .footer-latest-title {
      font-size: 15px !important;
      margin-bottom: 8px;
    }
  }
`;

export const FooterInner = styled.div`
  width: min(92%, 1280px);
  margin: 0 auto;
  padding: 52px 0 0;

  @media (max-width: 1199px) {
    width: min(94%, 1120px);
    padding-top: 42px;
  }

  @media (max-width: 991px) {
    width: 100%;
    padding: 36px 24px 0;
  }

  @media (max-width: 767px) {
    padding: 28px 16px 0;
  }
`;

export const FooterLogo = styled.a`
  display: inline-block;
  margin-bottom: 18px;

  img {
    display: block;
    height: auto;
    max-height: 72px;
    width: auto;
    max-width: min(280px, 100%);
  }

  @media (max-width: 991px) {
    img {
      max-height: 58px;
    }
  }

  @media (max-width: 767px) {
    img {
      max-height: 50px;
    }
  }
`;

export const FooterParagraph = styled.p`
  font-size: 14px;
  font-weight: 400;
  line-height: 1.45;
  margin: 0 0 10px;
  opacity: 0.95;
  color: ${(props) => props.$footerTextValue || getColor("white")};
`;

export const CopyrightBar = styled.div`
  width: 100%;
  margin-top: 36px;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.3;
  color: ${getColor("white")};
  background: ${(props) =>
    props.$footerCopyrightBarValue || getColor("gradient")};
  text-align: center !important;
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 767px) {
    margin-top: 26px;
    line-height: 1.4;
    padding: 10px 12px;
  }
`;
