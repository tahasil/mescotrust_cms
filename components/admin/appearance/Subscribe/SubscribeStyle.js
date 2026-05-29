"use client";

import styled from "styled-components";
import { Input, Button } from "antd";
import { getColor } from "@/styles/Theme";

export const SubscribeWrapper = styled.section.attrs((p) => ({
  $bgDesktop: p.$bgDesktop || "",
  $bgMobile: p.$bgMobile || "",
}))`
  width: 100%;
  position: relative;
  min-height: 380px;
  padding-bottom: 100px;
  background: ${(p) =>
    p.$bgDesktop ? `url(${p.$bgDesktop}) no-repeat center bottom` : 'url("/images/subscribe-bg.png") no-repeat center bottom'};
  background-size: cover;
  @media (max-width: 768px) {
    min-height: 300px;
    background: ${(p) =>
      p.$bgMobile
        ? `url(${p.$bgMobile}) no-repeat center bottom`
        : p.$bgDesktop
          ? `url(${p.$bgDesktop}) no-repeat center bottom`
          : 'url("/images/subscribe-bg.png") no-repeat center bottom'};
    background-size: cover;
  }
`;

export const SubscribeCard = styled.div`
  position: relative;
  width: 80%;
  margin: 0 auto;
  margin-top: -7%;
  margin-bottom: 4%;
  background: ${() => getColor("white")};
  border-radius: 20px;
  padding: 40px 48px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 24px 32px;
  @media (max-width: 768px) {
    width: 90%;
    padding: 20px;
    margin-top: -10%;
  }
  @media (max-width: 576px) {
    margin-top: -30%;
  }
`;

export const SubscribeContent = styled.div`
  flex: 1 1 300px;
  min-width: 0;
  @media (max-width: 1440px) {
    flex: 1 1 450px;
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
    box-shadow: 0 0 0 2px rgba(207, 55, 47, 0.12);
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
`;

export const SubscribeButton = styled(Button).attrs((p) => ({
  $bgKey: p.$buttonBgColorKey && String(p.$buttonBgColorKey).trim() ? p.$buttonBgColorKey : "gradient",
  $textKey: p.$buttonTextColorKey && String(p.$buttonTextColorKey).trim() ? p.$buttonTextColorKey : "white",
}))`
  flex: 0 0 auto;
  width: 28%;
  min-width: 120px;
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
    box-shadow: 0 3px 10px rgba(207, 55, 47, 0.35);
  }
`;
