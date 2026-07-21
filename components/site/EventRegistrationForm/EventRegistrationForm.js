"use client";

import { useEffect, useRef, useState } from "react";
import { Row, Col, notification } from "antd";
import styled from "styled-components";
import {
  FullWidthBackground,
  getColor,
  MainTitle,
  PageContainer,
  SubTitle,
} from "@/styles/Theme";
import { isValidEmail, isValidName, isValidPhone, normalizeText } from "@/lib/formValidation";

/**
 * Site component: EventRegistrationForm.
 *
 * Section comes from ComponentRenderer. Props from page block (page builder)
 * or Component defaultProps (global). Manage Section + Title & Colors come
 * from EditForm so all settings the editor changes in the drawer apply here.
 *
 * The event details (eventTitle, eventDate, eventId, eventSlug) are pulled from one of:
 *   1. URL query params:  ?event=...&date=...&eventId=...&eventSlug=...
 *   2. Block props:       defaultEventTitle, defaultEventDate
 *
 * If neither is present, the form asks the visitor to type the event name.
 */
export default function EventRegistrationForm(props = {}) {
  const PREFIX = "eventRegistrationForm";

  /* -- Section background / spacing (read by FullWidthBackground) -- */
  const sectionBgType = (props?.[PREFIX + "SectionBgType"] ?? "default").toString();
  const sectionBgImage = (props?.[PREFIX + "SectionBgImage"] ?? "").toString().trim();
  const sectionBgColorKey = (props?.[PREFIX + "SectionBgColorKey"] ?? "").toString().trim();
  const sectionBgClassName = sectionBgType === "default" ? "defaultBackground" : undefined;
  const sectionBgStyleBase =
    sectionBgType === "image" && sectionBgImage
      ? {
          backgroundImage: `url(${sectionBgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
        }
      : sectionBgType === "color" && sectionBgColorKey
        ? { backgroundColor: getColor(sectionBgColorKey), backgroundImage: "none" }
        : undefined;
  const sectionPaddingTop =
    props?.[PREFIX + "SectionPaddingTop"] != null
      ? Number(props[PREFIX + "SectionPaddingTop"])
      : null;
  const sectionPaddingBottom =
    props?.[PREFIX + "SectionPaddingBottom"] != null
      ? Number(props[PREFIX + "SectionPaddingBottom"])
      : null;
  const sectionMarginTop =
    props?.[PREFIX + "SectionMarginTop"] != null
      ? Number(props[PREFIX + "SectionMarginTop"])
      : null;
  const sectionMarginBottom =
    props?.[PREFIX + "SectionMarginBottom"] != null
      ? Number(props[PREFIX + "SectionMarginBottom"])
      : null;
  const sectionBgStyle =
    sectionBgStyleBase ||
    sectionPaddingTop != null ||
    sectionPaddingBottom != null ||
    sectionMarginTop != null ||
    sectionMarginBottom != null
      ? {
          ...(sectionBgStyleBase || {}),
          ...(sectionPaddingTop != null && sectionPaddingTop >= 0
            ? { paddingTop: `${sectionPaddingTop}px` }
            : {}),
          ...(sectionPaddingBottom != null && sectionPaddingBottom >= 0
            ? { paddingBottom: `${sectionPaddingBottom}px` }
            : {}),
          ...(sectionMarginTop != null && sectionMarginTop >= 0
            ? { marginTop: `${sectionMarginTop}px` }
            : {}),
          ...(sectionMarginBottom != null && sectionMarginBottom >= 0
            ? { marginBottom: `${sectionMarginBottom}px` }
            : {}),
        }
      : undefined;

  /* -- Page container background / spacing -- */
  const pageContainerBgType = (props?.[PREFIX + "PageContainerBgType"] ?? "default").toString();
  const pageContainerBgImage = (props?.[PREFIX + "PageContainerBgImage"] ?? "").toString().trim();
  const pageContainerBgColorKey = (props?.[PREFIX + "PageContainerBgColorKey"] ?? "").toString().trim();
  const pageContainerBgStyleBase =
    pageContainerBgType === "image" && pageContainerBgImage
      ? {
          backgroundImage: `url(${pageContainerBgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }
      : pageContainerBgType === "color" && pageContainerBgColorKey
        ? { backgroundColor: getColor(pageContainerBgColorKey), backgroundImage: "none" }
        : undefined;
  const containerPaddingTop =
    props?.[PREFIX + "PageContainerPaddingTop"] != null
      ? Number(props[PREFIX + "PageContainerPaddingTop"])
      : null;
  const containerPaddingRight =
    props?.[PREFIX + "PageContainerPaddingRight"] != null
      ? Number(props[PREFIX + "PageContainerPaddingRight"])
      : null;
  const containerPaddingBottom =
    props?.[PREFIX + "PageContainerPaddingBottom"] != null
      ? Number(props[PREFIX + "PageContainerPaddingBottom"])
      : null;
  const containerPaddingLeft =
    props?.[PREFIX + "PageContainerPaddingLeft"] != null
      ? Number(props[PREFIX + "PageContainerPaddingLeft"])
      : null;
  const containerMarginTop =
    props?.[PREFIX + "PageContainerMarginTop"] != null
      ? Number(props[PREFIX + "PageContainerMarginTop"])
      : null;
  const containerMarginBottom =
    props?.[PREFIX + "PageContainerMarginBottom"] != null
      ? Number(props[PREFIX + "PageContainerMarginBottom"])
      : null;
  const pageContainerBgStyle =
    pageContainerBgStyleBase ||
    containerPaddingTop != null ||
    containerPaddingRight != null ||
    containerPaddingBottom != null ||
    containerPaddingLeft != null ||
    containerMarginTop != null ||
    containerMarginBottom != null
      ? {
          ...(pageContainerBgStyleBase || {}),
          ...(containerPaddingTop != null && containerPaddingTop >= 0
            ? { paddingTop: `${containerPaddingTop}px` }
            : {}),
          ...(containerPaddingRight != null && containerPaddingRight >= 0
            ? { paddingRight: `${containerPaddingRight}px` }
            : {}),
          ...(containerPaddingBottom != null && containerPaddingBottom >= 0
            ? { paddingBottom: `${containerPaddingBottom}px` }
            : {}),
          ...(containerPaddingLeft != null && containerPaddingLeft >= 0
            ? { paddingLeft: `${containerPaddingLeft}px` }
            : {}),
          ...(containerMarginTop != null && containerMarginTop >= 0
            ? { marginTop: `${containerMarginTop}px` }
            : {}),
          ...(containerMarginBottom != null && containerMarginBottom >= 0
            ? { marginBottom: `${containerMarginBottom}px` }
            : {}),
        }
      : undefined;

  /* -- Title & subtitle -- */
  const mainTitle = (props?.mainTitle ?? "Event Registration").toString().trim();
  const subTitle = (props?.subTitle ?? "").toString().trim();
  const titleEnabled = props?.eventRegistrationFormTitleEnabled !== false;
  const subTitleEnabled = props?.eventRegistrationFormSubTitleEnabled !== false;
  const titleColorKey = (props?.titleColorKey ?? "").toString().trim();
  const titleColor = titleColorKey ? getColor(titleColorKey) : getColor("primary");
  const subTitleColorKey = (props?.eventRegistrationFormSubTitleColorKey ?? "").toString().trim();
  const subTitleColor = subTitleColorKey ? getColor(subTitleColorKey) : undefined;

  /* -- Form copy -- */
  const intro = (
    props?.intro ||
    "Please fill in your details below to register for this event. We will reach out with the next steps."
  ).toString();
  const buttonText = (props?.buttonText || "Register").toString();
  const successMessage = (
    props?.successMessage ||
    "Thank you! Your registration has been received. We will contact you with the next steps."
  ).toString();
  const studentFieldsEnabled = props?.studentFieldsEnabled !== false;

  /* -- Form colours (resolved from theme keys) -- */
  const cardBgColorKey = (props?.eventRegistrationFormCardBgColorKey ?? "").toString().trim();
  const cardBgColor = cardBgColorKey ? getColor(cardBgColorKey) : "#ffffff";
  const labelColorKey = (props?.eventRegistrationFormLabelColorKey ?? "").toString().trim();
  const labelColor = labelColorKey ? getColor(labelColorKey) : "rgba(0,0,0,0.85)";
  const inputBorderColorKey = (props?.eventRegistrationFormInputBorderColorKey ?? "").toString().trim();
  const inputBorderColor = inputBorderColorKey ? getColor(inputBorderColorKey) : "rgba(0,0,0,0.12)";
  const buttonBgColorKey = (props?.eventRegistrationFormButtonBgColorKey ?? "").toString().trim();
  const buttonBgColor = buttonBgColorKey ? getColor(buttonBgColorKey) : getColor("primary");
  const buttonTextColorKey = (props?.eventRegistrationFormButtonTextColorKey ?? "").toString().trim();
  const buttonTextColor = buttonTextColorKey ? getColor(buttonTextColorKey) : "#ffffff";
  const introColorKey = (props?.eventRegistrationFormIntroColorKey ?? "").toString().trim();
  const introColor = introColorKey ? getColor(introColorKey) : "rgba(0,0,0,0.65)";
  const eventLineColorKey = (props?.eventRegistrationFormEventLineColorKey ?? "").toString().trim();
  const eventLineColor = eventLineColorKey ? getColor(eventLineColorKey) : "rgba(0,0,0,0.6)";

  /* -- Defaults from props -- */
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const formRef = useRef(null);
  const [eventTitle, setEventTitle] = useState(
    (props.defaultEventTitle || "").toString().trim(),
  );
  const [eventDate, setEventDate] = useState(
    (props.defaultEventDate || "").toString().trim(),
  );
  const [eventId, setEventId] = useState("");
  const [eventSlug, setEventSlug] = useState("");
  const [pagePath, setPagePath] = useState("");
  const [pageUrl, setPageUrl] = useState("");

  /* Read query params on mount (client-only) */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const qpEvent = params.get("event");
    const qpDate = params.get("date");
    const qpId = params.get("eventId");
    const qpSlug = params.get("eventSlug") || params.get("slug");
    if (qpEvent) setEventTitle(qpEvent);
    if (qpDate) setEventDate(qpDate);
    if (qpId) setEventId(qpId);
    if (qpSlug) setEventSlug(qpSlug);

    const currentPath = window.location.pathname || "/";
    setPagePath(currentPath);
    setPageUrl(currentPath + window.location.search);
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const formEl = e.currentTarget;
    const data = new FormData(formEl);
    const payload = {
      eventTitle:
        eventTitle ||
        normalizeText(data.get("eventTitleFallback")),
      eventDate: eventDate || "",
      eventId: eventId || "",
      eventSlug: eventSlug || "",
      name: normalizeText(data.get("name")),
      email: normalizeText(data.get("email")),
      phone: normalizeText(data.get("phone")),
      school: normalizeText(data.get("school")),
      classOrYear: normalizeText(data.get("classOrYear")),
      message: normalizeText(data.get("message")),
      pagePath: pagePath || "",
      page: pageUrl,
      source: "EventRegistrationForm",
      website: (data.get("website") || "").toString(), // honeypot
    };

    const nextErrors = {};
    if (!payload.eventTitle) nextErrors.eventTitleFallback = "Event name is required";
    if (!payload.name) nextErrors.name = "Full name is required";
    if (payload.name && !isValidName(payload.name)) {
      nextErrors.name = "Name should contain alphabets only";
    }
    if (!payload.email) nextErrors.email = "Email is required";
    if (payload.email && !isValidEmail(payload.email)) {
      nextErrors.email = "Please enter a valid email address";
    }
    if (payload.phone && !isValidPhone(payload.phone)) nextErrors.phone = "Please enter a valid mobile number";
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});

    setSubmitting(true);
    try {
      const res = await fetch("/api/public/event-registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) {
        notification.error({
          message: "Submission failed",
          description: out?.error || "Submission failed. Please try again.",
          placement: "bottomRight",
        });
        return;
      }
      notification.success({
        message: "Success",
        description: successMessage,
        placement: "bottomRight",
      });
      formRef.current?.reset();
      setErrors({});
    } catch {
      notification.error({
        message: "Submission failed",
        description: "Network error. Please try again.",
        placement: "bottomRight",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FullWidthBackground className={sectionBgClassName} style={sectionBgStyle}>
      <PageContainer style={pageContainerBgStyle}>
        <div className="fable-section">
        {(titleEnabled || subTitleEnabled) && (mainTitle || subTitle) && (
          <Row gutter={[16, 16]}>
            <Col span={24} className="text-center mb-4">
              {subTitleEnabled && subTitle && (
                <SubTitle className="fable-eyebrow" style={subTitleColor ? { color: subTitleColor } : undefined}>
                  {subTitle}
                </SubTitle>
              )}
              {titleEnabled && mainTitle && (
                <MainTitle className="fable-heading" color={titleColor}>{mainTitle}</MainTitle>
              )}
            </Col>
          </Row>
        )}

        <Row gutter={[16, 16]} justify="center">
          <Col xs={24} md={20} lg={16}>
            <FormCard $bg={cardBgColor}>
              <>
                  {eventTitle && (
                    <EventLine style={{ color: eventLineColor }}>
                      Registering for: <strong>{eventTitle}</strong>
                      {eventDate ? <> &middot; {eventDate}</> : null}
                    </EventLine>
                  )}
                  {intro && <Intro style={{ color: introColor }}>{intro}</Intro>}

                  <form ref={formRef} onSubmit={onSubmit} noValidate>
                    {/* Honeypot: hidden from real users; bots that fill it are silently rejected */}
                    <Honeypot
                      type="text"
                      name="website"
                      autoComplete="off"
                      tabIndex={-1}
                    />

                    {!eventTitle && (
                      <Row gutter={[16, 0]}>
                        <Col span={24}>
                          <Field>
                            <Label style={{ color: labelColor }}>
                              Event you are registering for{" "}
                              <span className="req">*</span>
                            </Label>
                            <Input
                              name="eventTitleFallback"
                              placeholder="e.g. Eid Drive 2025"
                              required
                              $borderColor={inputBorderColor}
                              onChange={() => {
                                if (errors.eventTitleFallback) {
                                  setErrors((prev) => ({ ...prev, eventTitleFallback: "" }));
                                }
                              }}
                            />
                            {errors.eventTitleFallback ? (
                              <ErrorText>{errors.eventTitleFallback}</ErrorText>
                            ) : null}
                          </Field>
                        </Col>
                      </Row>
                    )}

                    <Row gutter={[16, 0]}>
                      <Col xs={24} sm={12}>
                        <Field>
                          <Label style={{ color: labelColor }}>
                            Full name <span className="req">*</span>
                          </Label>
                          <Input
                            name="name"
                            required
                            placeholder="Your name"
                            $borderColor={errors.name ? "#E03C33" : inputBorderColor}
                            onChange={() => {
                              if (errors.name) {
                                setErrors((prev) => ({ ...prev, name: "" }));
                              }
                            }}
                          />
                          {errors.name ? <ErrorText>{errors.name}</ErrorText> : null}
                        </Field>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Field>
                          <Label style={{ color: labelColor }}>
                            Email <span className="req">*</span>
                          </Label>
                          <Input
                            name="email"
                            type="email"
                            required
                            placeholder="you@example.com"
                            $borderColor={errors.email ? "#E03C33" : inputBorderColor}
                            onChange={() => {
                              if (errors.email) {
                                setErrors((prev) => ({ ...prev, email: "" }));
                              }
                            }}
                          />
                          {errors.email ? <ErrorText>{errors.email}</ErrorText> : null}
                        </Field>
                      </Col>
                    </Row>

                    <Row gutter={[16, 0]}>
                      <Col span={24}>
                        <Field>
                          <Label style={{ color: labelColor }}>Phone</Label>
                          <Input
                            name="phone"
                            placeholder="+91 ..."
                            $borderColor={errors.phone ? "#E03C33" : inputBorderColor}
                            onChange={() => {
                              if (errors.phone) {
                                setErrors((prev) => ({ ...prev, phone: "" }));
                              }
                            }}
                          />
                          {errors.phone ? <ErrorText>{errors.phone}</ErrorText> : null}
                        </Field>
                      </Col>
                    </Row>

                    {studentFieldsEnabled && (
                      <Row gutter={[16, 0]}>
                        <Col xs={24} sm={12}>
                          <Field>
                            <Label style={{ color: labelColor }}>
                              School / Institution
                            </Label>
                            <Input
                              name="school"
                              placeholder="(optional)"
                              $borderColor={inputBorderColor}
                            />
                          </Field>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Field>
                            <Label style={{ color: labelColor }}>
                              Class / Year
                            </Label>
                            <Input
                              name="classOrYear"
                              placeholder="(optional)"
                              $borderColor={inputBorderColor}
                            />
                          </Field>
                        </Col>
                      </Row>
                    )}

                    <Row gutter={[16, 0]}>
                      <Col span={24}>
                        <Field>
                          <Label style={{ color: labelColor }}>
                            Message (optional)
                          </Label>
                          <Textarea
                            name="message"
                            placeholder="Anything you'd like us to know..."
                            $borderColor={inputBorderColor}
                          />
                        </Field>
                      </Col>
                    </Row>

                    <Row gutter={[16, 0]}>
                      <Col span={24}>
                        <SubmitBtn
                          type="submit"
                          disabled={submitting}
                          $bg={buttonBgColor}
                          $color={buttonTextColor}
                        >
                          {submitting ? "Submitting..." : buttonText}
                        </SubmitBtn>
                      </Col>
                    </Row>
                  </form>
              </>
            </FormCard>
          </Col>
        </Row>
        </div>
      </PageContainer>
    </FullWidthBackground>
  );
}

/* -- Styled primitives, fully responsive (mobile-first) -- */

const FormCard = styled.div`
  background: ${(p) => p.$bg || "#ffffff"};
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
  padding: 36px;

  @media (max-width: 991px) {
    padding: 28px;
  }
  @media (max-width: 640px) {
    padding: 22px 18px;
    border-radius: 10px;
  }
`;

const EventLine = styled.div`
  margin: 0 0 14px;
  font-size: 15px;
  line-height: 1.5;
  word-wrap: break-word;
  strong {
    color: rgba(0, 0, 0, 0.88);
  }
  @media (max-width: 640px) {
    font-size: 14px;
    margin-bottom: 12px;
  }
`;

const Intro = styled.p`
  margin: 0 0 24px;
  font-size: 15px;
  line-height: 1.65;
  @media (max-width: 640px) {
    font-size: 14px;
    margin-bottom: 18px;
  }
`;

const Field = styled.div`
  margin-bottom: 18px;
  @media (max-width: 640px) {
    margin-bottom: 14px;
  }
`;

const Label = styled.label`
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
  font-size: 14px;
  line-height: 1.4;
  .req {
    color: ${getColor("primary")};
    margin-left: 2px;
  }
  @media (max-width: 640px) {
    font-size: 13px;
  }
`;

const ErrorText = styled.div`
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.4;
  color: #E03C33;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 14px;
  border: 1px solid ${(p) => p.$borderColor || "rgba(0,0,0,0.12)"};
  border-radius: 8px;
  font-size: 15px;
  font-family: inherit;
  background: #fff;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  -webkit-appearance: none;
  appearance: none;
  &:focus {
    border-color: ${getColor("primary")};
    box-shadow: 0 0 0 3px rgba(224, 60, 51, 0.08);
  }
  /* Use 16px on mobile to avoid iOS Safari auto-zoom on focus */
  @media (max-width: 640px) {
    font-size: 16px;
    padding: 12px 13px;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 12px 14px;
  border: 1px solid ${(p) => p.$borderColor || "rgba(0,0,0,0.12)"};
  border-radius: 8px;
  font-size: 15px;
  font-family: inherit;
  resize: vertical;
  min-height: 120px;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  -webkit-appearance: none;
  appearance: none;
  &:focus {
    border-color: ${getColor("primary")};
    box-shadow: 0 0 0 3px rgba(224, 60, 51, 0.08);
  }
  @media (max-width: 640px) {
    font-size: 16px;
    min-height: 110px;
  }
`;

const SubmitBtn = styled.button`
  display: inline-block;
  margin-top: 8px;
  padding: 13px 32px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  background: ${(p) => p.$bg || getColor("primary")};
  color: ${(p) => p.$color || "#ffffff"};
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
  -webkit-appearance: none;
  appearance: none;
  &:hover {
    opacity: 0.92;
    transform: translateY(-1px);
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
  /* Full-width tap target on mobile so it's easy to hit */
  @media (max-width: 640px) {
    display: block;
    width: 100%;
    padding: 14px 20px;
    font-size: 16px;
    margin-top: 4px;
  }
`;

const Honeypot = styled.input`
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
`;
