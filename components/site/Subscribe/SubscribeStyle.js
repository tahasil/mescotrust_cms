"use client";

import styled from "styled-components";
import { Input, Button } from "antd";
import { getColor } from "@/styles/Theme";

export const SubscribeWrapper = styled.section.attrs((p) => ({
  $bgDesktop: p.$bgDesktop || "",
  $bgMobile: p.$bgMobile || "",
}))`
  width: 100vw;
  max-width: 100vw;
  left: 50%;
  right: 50%;
  margin-left: -50vw;
  margin-right: -50vw;
  position: relative;
  min-height: clamp(260px, 34vw, 420px);
  padding-bottom: clamp(72px, 9vw, 120px);
  background: ${(p) =>
    p.$bgDesktop ? `url(${p.$bgDesktop}) no-repeat center bottom` : "none"};
  background-size: cover;
  @media (max-width: 992px) {
    min-height: 320px;
    padding-bottom: 82px;
  }
  @media (max-width: 768px) {
    min-height: 260px;
    padding-bottom: 64px;
    background: ${(p) =>
      p.$bgMobile
        ? `url(${p.$bgMobile}) no-repeat center bottom`
        : p.$bgDesktop
          ? `url(${p.$bgDesktop}) no-repeat center bottom`
          : "none"};
    background-size: cover;
  }
  @media (max-width: 480px) {
    min-height: 220px;
    padding-bottom: 52px;
  }
`;

export const SubscribeCard = styled.div`
  position: relative;
  width: min(80%, 1200px);
  margin: 0 auto;
  margin-top: clamp(-110px, -7vw, -52px);
  margin-bottom: clamp(20px, 4vw, 56px);
  background: ${() => getColor("white")};
  border-radius: 20px;
  padding: clamp(20px, 2.8vw, 40px) clamp(16px, 3.4vw, 48px);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 24px 32px;
  @media (max-width: 992px) {
    width: min(88%, 1100px);
    margin-top: clamp(-88px, -10vw, -44px);
  }
  @media (max-width: 768px) {
    width: calc(100% - 24px);
    margin-top: -40px;
    gap: 16px;
  }
  @media (max-width: 576px) {
    width: calc(100% - 16px);
    margin-top: -30px;
    border-radius: 16px;
  }
`;

export const SubscribeContent = styled.div`
  flex: 1 1 300px;
  min-width: 0;
  @media (max-width: 1440px) {
    flex: 1 1 450px;
  }
  @media (max-width: 768px) {
    flex: 1 1 100%;
  }
`;

export const StyledSubTitle = styled.h2.attrs((p) => ({
  $colorKey: p.$subtitleColorKey && String(p.$subtitleColorKey).trim() ? p.$subtitleColorKey : "black",
}))`
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: ${(p) => getColor(p.$colorKey)};
`;

export const StyledMainTitle = styled.h1.attrs((p) => ({
  $colorKey: p.$titleColorKey && String(p.$titleColorKey).trim() ? p.$titleColorKey : "black",
}))`
  margin: 0;
  font-size: 30px;
  font-weight: 500;
  line-height: 40px;
  color: ${(p) => getColor(p.$colorKey)};
  opacity: 1;
  @media (max-width: 768px) {
    font-size: 22px;
    line-height: 30px;
  }
`;

export const SubscribeForm = styled.form`
  flex: 1 1 380px;
  min-width: 0;
  max-width: 520px;
  @media (max-width: 768px) {
    flex: 1 1 100%;
    max-width: 100%;
  }
`;

export const SubscribeFieldRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 60px;
  padding: 6px;
  padding-left: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 9999px;
  background: ${() => getColor("white")};
  transition: border-color 0.2s, box-shadow 0.2s;
  &:focus-within {
    border-color: ${() => getColor("primary")};
    box-shadow: 0 0 0 2px rgba(224, 60, 51, 0.12);
  }
  @media (max-width: 576px) {
    min-height: 54px;
    padding: 5px 5px 5px 14px;
    gap: 8px;
  }
`;

export const SubscribeInput = styled(Input)`
  flex: 1;
  min-width: 0;
  height: 48px;
  border: none !important;
  border-radius: 0 !important;
  padding: 0 4px 0 0;
  font-size: 16px;
  background: transparent !important;
  box-shadow: none !important;
  &:hover,
  &:focus {
    border: none !important;
    box-shadow: none !important;
  }
  &::placeholder {
    color: #424242;
  }
  .ant-input {
    background: transparent !important;
  }
  @media (max-width: 576px) {
    height: 42px;
    font-size: 14px;
  }
`;

export const SubscribeButton = styled(Button).attrs((p) => ({
  $bgKey: p.$buttonBgColorKey && String(p.$buttonBgColorKey).trim() ? p.$buttonBgColorKey : "gradient",
  $textKey: p.$buttonTextColorKey && String(p.$buttonTextColorKey).trim() ? p.$buttonTextColorKey : "white",
}))`
  flex: 0 0 auto;
  width: clamp(110px, 28%, 170px);
  min-width: 110px;
  height: 48px;
  padding: 0 24px;
  border-radius: 30px !important;
  border: 1px solid ${() => getColor("primary")} !important;
  font-size: 16px;
  font-weight: 600;
  color: ${(p) => getColor(p.$textKey)} !important;
  background: ${(p) => getColor(p.$bgKey)} !important;
  transition: all 0.3s ease;
  text-decoration: none;
  &:hover {
    color: ${() => getColor("primary")} !important;
    border: 1px solid ${() => getColor("primary")} !important;
    background: ${() => getColor("white")} !important;
    box-shadow: 0 3px 10px rgba(224, 60, 51, 0.35);
  }
  @media (max-width: 768px) {
    height: 44px;
    padding: 0 16px;
    font-size: 15px;
    min-width: 104px;
  }
  @media (max-width: 480px) {
    min-width: 96px;
    padding: 0 12px;
    font-size: 14px;
  }
`;
