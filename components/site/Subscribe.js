"use client";

import { useState, useEffect } from "react";
import styled from "styled-components";
import { Input, Button } from "antd";
import { PageContainer, getColor } from "@/styles/Theme";

const SubscribeWrapper = styled.section.attrs((p) => ({
  $bgUrl: p.$bgUrl || "",
}))`
  width: 100%;
  position: relative;
  min-height: 380px;
  padding-bottom: 100px;
  background: ${(p) =>
    p.$bgUrl ? `url(${p.$bgUrl}) no-repeat center bottom` : "transparent"};
  background-size: cover;
  @media (max-width: 768px) {
    min-height: 300px;
  }
`;

const SubscribeCard = styled.div`
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

const SubscribeContent = styled.div`
  flex: 1 1 300px;
  min-width: 0;
  @media (max-width: 1440px) {
    flex: 1 1 450px;
  }
`;

const SubTitle = styled.h2`
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: ${() => getColor("black")};
`;

const MainTitle = styled.h1`
  margin: 0;
  font-size: 30px;
  font-weight: 500;
  line-height: 40px;
  color: ${() => getColor("black")};
  opacity: 1;
  @media (max-width: 768px) {
    font-size: 22px;
    line-height: 30px;
  }
`;

const SubscribeForm = styled.form`
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1 1 380px;
  min-width: 0;
  max-width: 520px;
  min-height: 60px;
  padding: 6px;
  padding-left: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 9999px;
  background: ${() => getColor("white")};
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
  &:focus-within {
    border-color: ${() => getColor("primary")};
    box-shadow: 0 0 0 2px rgba(207, 55, 47, 0.12);
  }
`;

const SubscribeInput = styled(Input)`
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

const SubscribeButton = styled(Button)`
  flex: 0 0 auto;
  width: 28%;
  min-width: 120px;
  height: 48px;
  padding: 0 24px;
  border-radius: 30px !important;
  border: 1px solid ${() => getColor("primary")} !important;
  font-size: 16px;
  font-weight: 600;
  color: ${() => getColor("white")} !important;
  background: ${() => getColor("gradient")} !important;
  transition: all 0.3s ease;
  &:hover {
    color: ${() => getColor("primary")} !important;
    border: 1px solid ${() => getColor("primary")} !important;
    background: ${() => getColor("white")} !important;
    box-shadow: 0 3px 10px rgba(207, 55, 47, 0.35);
  }
`;

function fetchTheme() {
  return fetch("/api/theme", {
    cache: "no-store",
    headers: { "Cache-Control": "no-cache" },
  })
    .then((res) => (res.ok ? res.json() : null))
    .catch(() => null);
}

/**
 * Site component: Subscribe — newsletter signup.
 * No static content. All content (subtitle, title, placeholder, button text, background URL)
 * is stored in the database (ThemeConfig) and loaded via GET /api/theme. Rendered from DB
 * on both admin (props from edit form = DB) and frontend (theme from API = DB).
 */
export default function Subscribe(props) {
  const [email, setEmail] = useState("");
  const [theme, setTheme] = useState(null);

  // Frontend: fetch all Subscribe content from database (theme API). Admin: use props from edit form (sourced from DB).
  useEffect(() => {
    if (props?.subscribeTitle != null || props?.subscribeSubtitle != null)
      return; // admin preview
    fetchTheme().then((data) => {
      if (data && typeof window !== "undefined") {
        console.log("[Subscribe] frontend: fetched from DB", {
          subscribeSubtitle: data.subscribeSubtitle,
          subscribeTitle: data.subscribeTitle?.slice(0, 50),
          subscribePlaceholder: data.subscribePlaceholder,
          subscribeButtonText: data.subscribeButtonText,
          subscribeBgUrl: data.subscribeBgUrl,
        });
      }
      setTheme(data);
    }); // load from database
  }, [props?.subscribeTitle, props?.subscribeSubtitle]);

  // Only database/props — no static fallbacks; API returns DB values or DEFAULTS for response shape
  const subtitle =
    (props?.subscribeSubtitle ?? theme?.subscribeSubtitle ?? "")?.trim() ?? "";
  const title =
    (props?.subscribeTitle ?? theme?.subscribeTitle ?? "")?.trim() ?? "";
  const placeholder =
    (
      props?.subscribePlaceholder ??
      theme?.subscribePlaceholder ??
      ""
    )?.trim() ?? "";
  const buttonText =
    (props?.subscribeButtonText ?? theme?.subscribeButtonText ?? "")?.trim() ??
    "";
  const bgUrl =
    (props?.subscribeBgUrl ?? theme?.subscribeBgUrl ?? "")?.trim() ?? "";

  // Console: verify every element is from DB (props = admin/DB, theme = frontend/DB)
  const source = props?.subscribeSubtitle != null ? "admin (DB)" : theme ? "frontend (DB)" : "loading";
  if (typeof window !== "undefined") {
    console.log("[Subscribe] source:", source, "| subtitle:", subtitle, "| title:", title?.slice(0, 40) + (title?.length > 40 ? "…" : ""), "| placeholder:", placeholder, "| buttonText:", buttonText, "| bgUrl:", bgUrl);
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.trim()) {
      // TODO: wire to newsletter API
      console.log("Subscribe:", email);
    }
  };

  return (
    <section className="site-component-subscribe" data-component="Subscribe">
      <SubscribeWrapper $bgUrl={bgUrl} />
      <SubscribeCard as={PageContainer}>
        <SubscribeContent>
          <SubTitle>{subtitle}</SubTitle>
          <MainTitle>{title}</MainTitle>
        </SubscribeContent>
        <SubscribeForm onSubmit={handleSubmit}>
          <SubscribeInput
            type="email"
            placeholder={placeholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            size="large"
          />
          <SubscribeButton type="primary" htmlType="submit" size="large">
            {buttonText}
          </SubscribeButton>
        </SubscribeForm>
      </SubscribeCard>
    </section>
  );
}
