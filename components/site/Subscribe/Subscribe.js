"use client";

import { useState, useEffect } from "react";
import { notification } from "antd";
import { isValidEmail, normalizeText } from "@/lib/formValidation";
import {
  SubscribeWrapper,
  SubscribeCard,
  SubscribeContent,
  StyledSubTitle,
  StyledMainTitle,
  SubscribeForm,
  SubscribeFieldRow,
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
  const [emailError, setEmailError] = useState("");

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

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedEmail = normalizeText(email);
    if (!trimmedEmail) {
      setEmailError("Email is required");
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setEmailError("Please enter a valid email address");
      return;
    }
    setEmailError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          source: "subscribe-section",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        notification.success({
          message: "Success",
          description: data.message || "Successfully subscribed!",
          placement: "bottomRight",
        });
        setEmail("");
        setEmailError("");
      } else {
        notification.error({
          message: "Subscription failed",
          description: data.error || "Failed to subscribe",
          placement: "bottomRight",
        });
      }
    } catch {
      notification.error({
        message: "Subscription failed",
        description: "Something went wrong. Please try again.",
        placement: "bottomRight",
      });
    } finally {
      setSubmitting(false);
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
  const bgDesktop = (
    raw?.subscribeBgDesktop ?? raw?.subscribeBgUrl ?? raw?.bgUrl ?? ""
  )
    .toString()
    .trim();
  const bgMobile = (raw?.subscribeBgMobile ?? "").toString().trim();
  const subtitleColorKey = (raw?.subscribeSubtitleColorKey ?? "")
    .toString()
    .trim();
  const titleColorKey = (raw?.subscribeTitleColorKey ?? "").toString().trim();
  const buttonBgColorKey = (raw?.subscribeButtonBgColorKey ?? "")
    .toString()
    .trim();
  const buttonTextColorKey = (raw?.subscribeButtonTextColorKey ?? "")
    .toString()
    .trim();

  return (
    <section className="site-component-subscribe" data-component="Subscribe">
      <SubscribeWrapper
        $bgDesktop={bgDesktop}
        $bgMobile={bgMobile}
      />
      <SubscribeCard as={PageContainer}>
        <SubscribeContent>
          <StyledSubTitle $subtitleColorKey={subtitleColorKey || undefined}>
            {subtitle}
          </StyledSubTitle>
          <StyledMainTitle $titleColorKey={titleColorKey || undefined}>
            {title}
          </StyledMainTitle>
        </SubscribeContent>
        <SubscribeForm onSubmit={handleSubmit}>
          <SubscribeFieldRow>
            <SubscribeInput
              type="email"
              placeholder={placeholder}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError("");
              }}
              size="large"
              status={emailError ? "error" : ""}
            />
            <SubscribeButton
              type="primary"
              htmlType="submit"
              size="large"
              loading={submitting}
              disabled={submitting}
              $buttonBgColorKey={buttonBgColorKey || undefined}
              $buttonTextColorKey={buttonTextColorKey || undefined}
            >
              {buttonText}
            </SubscribeButton>
          </SubscribeFieldRow>
          {emailError ? (
            <div style={{ color: "#cf372f", fontSize: 12, marginTop: 6, paddingLeft: 12 }}>
              {emailError}
            </div>
          ) : null}
        </SubscribeForm>
      </SubscribeCard>
    </section>
  );
}
