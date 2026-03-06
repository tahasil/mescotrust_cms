"use client";

import { useState, useEffect } from "react";
import {
  SubscribeWrapper,
  SubscribeCard,
  SubscribeContent,
  StyledSubTitle,
  StyledMainTitle,
  SubscribeForm,
  SubscribeInput,
  SubscribeButton,
} from "./SubscribeStyle";
import { PageContainer } from "@/styles/Theme";

/**
 * Subscribe: content from page block props (pages collection) first, else GET /api/theme/subscribe (components collection).
 * When block is on a page, props (subscribeSubtitle, subscribeTitle, etc.) come from the page document.
 */
export default function Subscribe(props) {
  const [email, setEmail] = useState("");
  const [theme, setTheme] = useState(null);

  // No page/block props → fetch from components collection (e.g. global Subscribe block)
  useEffect(() => {
    const hasPageProps =
      props &&
      (props.subscribeSubtitle !== undefined ||
        props.subscribeTitle !== undefined);
    if (hasPageProps) return;
    fetch("/api/theme/subscribe", {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then(setTheme)
      .catch(() => setTheme(null));
  }, [props?.subscribeSubtitle, props?.subscribeTitle]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.trim()) {
      // TODO: wire to your newsletter API
      console.log("Subscribe:", email);
    }
  };

  // Admin: props = themeSubscribeSnapshot (from DB via EditForm). Frontend: theme = GET /api/theme (from DB).
  const raw =
    props &&
    (props.subscribeSubtitle !== undefined ||
      props.subscribeTitle !== undefined)
      ? props
      : theme;
  const subtitle = (raw?.subscribeSubtitle ?? raw?.subtitle ?? "")
    .toString()
    .trim();
  const title = (raw?.subscribeTitle ?? raw?.title ?? "").toString().trim();
  const placeholder = (raw?.subscribePlaceholder ?? raw?.placeholder ?? "")
    .toString()
    .trim();
  const buttonText = (raw?.subscribeButtonText ?? raw?.buttonText ?? "")
    .toString()
    .trim();
  const bgUrl = (raw?.subscribeBgUrl ?? raw?.bgUrl ?? "").toString().trim();

  return (
    <section className="site-component-subscribe" data-component="Subscribe">
      <SubscribeWrapper $bgUrl={bgUrl} />
      <SubscribeCard as={PageContainer}>
        <SubscribeContent>
          <StyledSubTitle>{subtitle}</StyledSubTitle>
          <StyledMainTitle>{title}</StyledMainTitle>
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
