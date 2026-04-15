"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Row, Col, Checkbox, ConfigProvider, notification } from "antd";
import styled from "styled-components";
import { submitContact } from "@/app/actions/contact";
import {
  FullWidthBackground,
  getColor,
  MainTitle,
  PageContainer,
  SubTitle,
} from "@/styles/Theme";
import {
  hasMinText,
  isValidAge,
  isValidEmail,
  isValidName,
  isValidPhone,
  normalizeText,
} from "@/lib/formValidation";

const Wrapper = styled.div`
  --volunteer-placeholder-color: rgba(0, 0, 0, 0.35);
  .volunteer-description {
    margin: 0 0 28px 0;
    font-size: 17px;
    line-height: 1.7;
    color: rgba(0, 0, 0, 0.72);
    max-width: 1040px;
  }
  .volunteer-shell {
    align-items: stretch;
  }
  .volunteer-form-card {
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 14px;
    padding: 24px;
    height: 100%;
  }
  .volunteer-form {
    display: block;
  }
  .volunteer-field {
    margin-bottom: 14px;
  }
  .volunteer-label {
    display: block;
    margin-bottom: 6px;
    font-weight: 600;
    font-size: 13px;
    line-height: 1.4;
    color: rgba(0, 0, 0, 0.85);
  }
  .required-star {
    color: #cf372f;
  }
  .volunteer-error {
    margin-top: 6px;
    font-size: 12px;
    line-height: 1.4;
    color: #cf372f;
  }
  .volunteer-input {
    width: 100%;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 8px;
    padding: 10px 12px;
    min-height: 42px;
    font-size: 14px;
    line-height: 1.4;
    background: #fff;
    color: rgba(0, 0, 0, 0.88);
    outline: none;
  }
  .volunteer-input:focus {
    border-color: rgba(0, 0, 0, 0.32);
  }
  .volunteer-input::placeholder {
    color: var(--volunteer-placeholder-color);
  }
  .volunteer-textarea {
    resize: vertical;
    min-height: 78px;
  }
  .volunteer-areas {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    column-gap: 12px;
    row-gap: 8px;
  }
  .volunteer-checkbox {
    font-size: 13px;
    color: rgba(0, 0, 0, 0.78);
    line-height: 1.3;
  }
  .volunteer-checkbox .ant-checkbox + span {
    padding-inline-start: 8px;
    color: inherit;
  }
  .volunteer-submit {
    border: none;
    border-radius: 9px;
    padding: 11px 22px;
    min-height: 44px;
    font-size: 15px;
    font-weight: 700;
    line-height: 1;
    cursor: pointer;
    transition: opacity 0.2s ease;
  }
  .volunteer-submit:hover {
    opacity: 0.9;
  }
  .volunteer-submit:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .volunteer-side-card {
    border-radius: 14px;
    padding: 24px;
    min-height: 80px;
    color: #fff;
    background: linear-gradient(147deg, #cf372f 0%, #741f1b 100%);
  }
  .volunteer-side-title {
    font-size: 34px;
    line-height: 1.12;
    font-weight: 800;
    margin: 0 0 10px 0;
    color: inherit;
  }
  .volunteer-side-description {
    margin: 0 0 14px 0;
    font-size: 15px;
    line-height: 1.55;
    color: inherit;
    opacity: 0.95;
  }
  .volunteer-side-list {
    margin: 0;
    padding-left: 18px;
  }
  .volunteer-side-list li {
    font-size: 14px;
    line-height: 1.6;
    margin-bottom: 8px;
    color: inherit;
  }
  .volunteer-side-list li::marker {
    color: var(--volunteer-bullet-color, #fff);
  }
  @media (max-width: 991px) {
    .volunteer-side-title {
      font-size: 30px;
    }
    .volunteer-areas {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 767px) {
    .volunteer-description {
      font-size: 15px;
      margin-bottom: 22px;
    }
    .volunteer-form-card,
    .volunteer-side-card {
      padding: 16px;
      border-radius: 12px;
    }
    .volunteer-side-title {
      font-size: 26px;
    }
    .volunteer-areas {
      grid-template-columns: 1fr;
      gap: 8px;
    }
  }
`;

function VolunteerSubmitButton({ label, background, textColor }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="volunteer-submit"
      style={{ background, color: textColor }}
      disabled={pending}
    >
      {pending ? "Submitting..." : label}
    </button>
  );
}

export default function Volunteer(props) {
  const [state, formAction] = useFormState(submitContact, null);
  const formRef = useRef(null);
  const [validationErrors, setValidationErrors] = useState({});

  const mainTitle = (props?.mainTitle ?? "Why Volunteer with MESCO")
    .toString()
    .trim();
  const subTitle = (props?.subTitle ?? "Why Choose Us?").toString().trim();
  const titleEnabled = props?.volunteerTitleEnabled !== false;
  const subTitleEnabled = props?.volunteerSubTitleEnabled !== false;
  const description = (
    props?.volunteerDescription ??
    "Make a real difference by contributing to education, medical relief and empowerment initiatives. Volunteering with MESCO offers meaningful exposure and an opportunity to impact lives."
  )
    .toString()
    .trim();

  const pageValue = (props?.volunteerPageValue ?? "volunteer")
    .toString()
    .trim();
  const sourceValue = (props?.volunteerSourceValue ?? "volunteer-form")
    .toString()
    .trim();
  const subjectLine = (props?.volunteerSubjectLine ?? "Volunteer Application")
    .toString()
    .trim();
  const submitLabel = (props?.volunteerSubmitLabel ?? "Submit Application")
    .toString()
    .trim();

  const sideTitle = (props?.volunteerChecklistTitle ?? "Ready to Start?")
    .toString()
    .trim();
  const sideDescription = (
    props?.volunteerChecklistDescription ??
    "If you meet these criteria and are excited about making a difference, we'd love to have you on our team!"
  )
    .toString()
    .trim();
  const sideItems = (
    props?.volunteerChecklistItems ??
    "Quick application process\nOrientation within 2 weeks\nOngoing support & training"
  )
    .toString()
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
  const areaOptions = (
    props?.volunteerAreasOptions ??
    "Education Support,Health Awareness,Event Management,Administrative,Fundraising,Women's Empowerment"
  )
    .toString()
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  useEffect(() => {
    if (!state) return;
    if (state.success) {
      notification.success({
        message: "Success",
        description: "Volunteer request submitted successfully.",
        placement: "bottomRight",
      });
      formRef.current?.reset();
      setValidationErrors({});
      window.dispatchEvent(new Event("new-contact-submission"));
    } else if (state.error) {
      notification.error({
        message: "Submission failed",
        description: state.error,
        placement: "bottomRight",
      });
    }
  }, [state]);

  const handleSubmit = (event) => {
    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = normalizeText(formData.get("name"));
    const email = normalizeText(formData.get("email"));
    const phone = normalizeText(formData.get("phone"));
    const ageVal = normalizeText(formData.get("age"));
    const availabilityVal = normalizeText(formData.get("availability"));
    const motivationVal = normalizeText(formData.get("motivation"));

    const nextErrors = {};
    if (!name) nextErrors.name = "Full name is required";
    if (name && !isValidName(name)) nextErrors.name = "Name should contain alphabets only";
    if (!email) nextErrors.email = "Email is required";
    if (email && !isValidEmail(email)) nextErrors.email = "Please enter a valid email address";
    if (!phone) nextErrors.phone = "Phone number is required";
    if (phone && !isValidPhone(phone)) nextErrors.phone = "Please enter a valid mobile number";
    if (!ageVal) nextErrors.age = "Age is required";
    if (ageVal && !isValidAge(ageVal)) nextErrors.age = "Please enter a valid age";
    if (!availabilityVal) nextErrors.availability = "Availability is required";
    if (availabilityVal && !/^\d{1,3}$/.test(availabilityVal)) nextErrors.availability = "Please enter valid hours";
    if (!motivationVal) nextErrors.motivation = "This field is required";
    if (motivationVal && !hasMinText(motivationVal, 5)) nextErrors.motivation = "Minimum 5 characters required";
    if (Object.keys(nextErrors).length > 0) {
      event.preventDefault();
      setValidationErrors(nextErrors);
      return;
    }
    setValidationErrors({});

    const interests = formData
      .getAll("interest")
      .map((item) => String(item || "").trim())
      .filter(Boolean);
    const education = String(formData.get("education") || "").trim();
    const occupation = String(formData.get("occupation") || "").trim();
    const age = ageVal;
    const availability = availabilityVal;
    const experience = String(formData.get("experience") || "").trim();
    const motivation = motivationVal;

    const details = [
      `Age: ${age || "-"}`,
      `Education: ${education || "-"}`,
      `Occupation: ${occupation || "-"}`,
      `Availability (hours/month): ${availability || "-"}`,
      `Areas of Interest: ${interests.length ? interests.join(", ") : "-"}`,
      `Relevant Experience: ${experience || "-"}`,
      "",
      "Motivation:",
      motivation || "-",
    ];
    const compiledMessage = details.join("\n");

    const messageInput = form.querySelector('input[name="message"]');
    if (messageInput) messageInput.value = compiledMessage;
  };

  const titleColorKey = (props?.titleColorKey ?? "").toString().trim();
  const titleColor = titleColorKey
    ? getColor(titleColorKey)
    : getColor("primary");
  const subTitleColorKey = (props?.volunteerSubTitleColorKey ?? "")
    .toString()
    .trim();
  const subTitleColor = subTitleColorKey
    ? getColor(subTitleColorKey)
    : undefined;
  const descriptionColorKey = (props?.volunteerDescriptionColorKey ?? "")
    .toString()
    .trim();
  const descriptionColor = descriptionColorKey
    ? getColor(descriptionColorKey)
    : undefined;

  const formCardBgColorKey = (props?.volunteerFormCardBgColorKey ?? "")
    .toString()
    .trim();
  const formCardBgColor = formCardBgColorKey
    ? getColor(formCardBgColorKey)
    : "#f7f7f7";
  const formCardBorderColorKey = (props?.volunteerFormCardBorderColorKey ?? "")
    .toString()
    .trim();
  const formCardBorderColor = formCardBorderColorKey
    ? getColor(formCardBorderColorKey)
    : "rgba(0,0,0,0.08)";
  const labelColorKey = (props?.volunteerLabelColorKey ?? "").toString().trim();
  const labelColor = labelColorKey
    ? getColor(labelColorKey)
    : "rgba(0,0,0,0.85)";
  const inputBgColorKey = (props?.volunteerInputBgColorKey ?? "")
    .toString()
    .trim();
  const inputBgColor = inputBgColorKey ? getColor(inputBgColorKey) : "#fff";
  const inputBorderColorKey = (props?.volunteerInputBorderColorKey ?? "")
    .toString()
    .trim();
  const inputBorderColor = inputBorderColorKey
    ? getColor(inputBorderColorKey)
    : "rgba(0,0,0,0.12)";
  const inputTextColorKey = (props?.volunteerInputTextColorKey ?? "")
    .toString()
    .trim();
  const inputTextColor = inputTextColorKey
    ? getColor(inputTextColorKey)
    : "rgba(0,0,0,0.88)";
  const placeholderColorKey = (props?.volunteerPlaceholderColorKey ?? "")
    .toString()
    .trim();
  const placeholderColor = placeholderColorKey
    ? getColor(placeholderColorKey)
    : "rgba(0,0,0,0.35)";
  const checkboxColorKey = (props?.volunteerCheckboxColorKey ?? "")
    .toString()
    .trim();
  const checkboxColor = checkboxColorKey
    ? getColor(checkboxColorKey)
    : getColor("primary");

  const submitBtnBgColorKey = (props?.volunteerButtonBgColorKey ?? "")
    .toString()
    .trim();
  const submitBtnBgColor = submitBtnBgColorKey
    ? getColor(submitBtnBgColorKey)
    : "#9b2521";
  const submitBtnTextColorKey = (props?.volunteerButtonTextColorKey ?? "")
    .toString()
    .trim();
  const submitBtnTextColor = submitBtnTextColorKey
    ? getColor(submitBtnTextColorKey)
    : "#fff";

  const sideBgColorKey = (props?.volunteerChecklistBgColorKey ?? "")
    .toString()
    .trim();
  const sideBgColor = sideBgColorKey ? getColor(sideBgColorKey) : "";
  const sideTitleColorKey = (props?.volunteerChecklistTitleColorKey ?? "")
    .toString()
    .trim();
  const sideTitleColor = sideTitleColorKey
    ? getColor(sideTitleColorKey)
    : "#fff";
  const sideTextColorKey = (props?.volunteerChecklistTextColorKey ?? "")
    .toString()
    .trim();
  const sideTextColor = sideTextColorKey ? getColor(sideTextColorKey) : "#fff";
  const sideBulletColorKey = (props?.volunteerChecklistBulletColorKey ?? "")
    .toString()
    .trim();
  const sideBulletColor = sideBulletColorKey
    ? getColor(sideBulletColorKey)
    : "#fff";

  const formCardRadius =
    props?.volunteerFormCardRadius != null
      ? Number(props.volunteerFormCardRadius)
      : 14;
  const inputRadius =
    props?.volunteerInputRadius != null
      ? Number(props.volunteerInputRadius)
      : 8;
  const sideCardRadius =
    props?.volunteerChecklistCardRadius != null
      ? Number(props.volunteerChecklistCardRadius)
      : 14;

  const sectionBgType = (props?.volunteerSectionBgType ?? "default").toString();
  const sectionBgImage = (props?.volunteerSectionBgImage ?? "")
    .toString()
    .trim();
  const sectionBgColorKey = (props?.volunteerSectionBgColorKey ?? "")
    .toString()
    .trim();
  const sectionBgClassName =
    sectionBgType === "default" ? "defaultBackground" : undefined;
  const sectionBgStyleBase =
    sectionBgType === "image" && sectionBgImage
      ? {
          backgroundImage: `url(${sectionBgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
        }
      : sectionBgType === "color" && sectionBgColorKey
        ? {
            backgroundColor: getColor(sectionBgColorKey),
            backgroundImage: "none",
          }
        : undefined;
  const sectionPaddingTop =
    props?.volunteerSectionPaddingTop != null
      ? Number(props.volunteerSectionPaddingTop)
      : null;
  const sectionPaddingBottom =
    props?.volunteerSectionPaddingBottom != null
      ? Number(props.volunteerSectionPaddingBottom)
      : null;
  const sectionMarginTop =
    props?.volunteerSectionMarginTop != null
      ? Number(props.volunteerSectionMarginTop)
      : null;
  const sectionMarginBottom =
    props?.volunteerSectionMarginBottom != null
      ? Number(props.volunteerSectionMarginBottom)
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

  const pageContainerBgType = (
    props?.volunteerPageContainerBgType ?? "default"
  ).toString();
  const pageContainerBgImage = (props?.volunteerPageContainerBgImage ?? "")
    .toString()
    .trim();
  const pageContainerBgColorKey = (
    props?.volunteerPageContainerBgColorKey ?? ""
  )
    .toString()
    .trim();
  const pageContainerBgStyleBase =
    pageContainerBgType === "image" && pageContainerBgImage
      ? {
          backgroundImage: `url(${pageContainerBgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }
      : pageContainerBgType === "color" && pageContainerBgColorKey
        ? {
            backgroundColor: getColor(pageContainerBgColorKey),
            backgroundImage: "none",
          }
        : undefined;
  const containerPaddingTop =
    props?.volunteerPageContainerPaddingTop != null
      ? Number(props.volunteerPageContainerPaddingTop)
      : null;
  const containerPaddingRight =
    props?.volunteerPageContainerPaddingRight != null
      ? Number(props.volunteerPageContainerPaddingRight)
      : null;
  const containerPaddingBottom =
    props?.volunteerPageContainerPaddingBottom != null
      ? Number(props.volunteerPageContainerPaddingBottom)
      : null;
  const containerPaddingLeft =
    props?.volunteerPageContainerPaddingLeft != null
      ? Number(props.volunteerPageContainerPaddingLeft)
      : null;
  const containerMarginTop =
    props?.volunteerPageContainerMarginTop != null
      ? Number(props.volunteerPageContainerMarginTop)
      : null;
  const containerMarginBottom =
    props?.volunteerPageContainerMarginBottom != null
      ? Number(props.volunteerPageContainerMarginBottom)
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

  return (
    <FullWidthBackground className={sectionBgClassName} style={sectionBgStyle}>
      <PageContainer style={pageContainerBgStyle}>
        <Wrapper style={{ "--volunteer-placeholder-color": placeholderColor }}>
          {(titleEnabled || subTitleEnabled || description) && (
            <Row gutter={[16, 16]}>
              <Col span={24} className="mb-3">
                {subTitleEnabled && subTitle && (
                  <SubTitle
                    style={subTitleColor ? { color: subTitleColor } : undefined}
                  >
                    {subTitle}
                  </SubTitle>
                )}
                {titleEnabled && mainTitle && (
                  <MainTitle color={titleColor}>{mainTitle}</MainTitle>
                )}
                {description && (
                  <p
                    className="volunteer-description"
                    style={
                      descriptionColor ? { color: descriptionColor } : undefined
                    }
                  >
                    {description}
                  </p>
                )}
              </Col>
            </Row>
          )}

          <Row gutter={[16, 16]} className="volunteer-shell">
            <Col xs={24} lg={16}>
              <div
                className="volunteer-form-card"
                style={{
                  background: formCardBgColor,
                  borderColor: formCardBorderColor,
                  borderRadius: formCardRadius,
                }}
              >
                <form
                  ref={formRef}
                  action={formAction}
                  onSubmit={handleSubmit}
                  className="volunteer-form"
                  noValidate
                >
                  <input type="hidden" name="page" value={pageValue} readOnly />
                  <input
                    type="hidden"
                    name="source"
                    value={sourceValue}
                    readOnly
                  />
                  <input
                    type="hidden"
                    name="subject"
                    value={subjectLine}
                    readOnly
                  />
                  <input type="hidden" name="message" defaultValue="" />

                  <Row gutter={[14, 6]}>
                    <Col xs={24} md={12}>
                      <div className="volunteer-field">
                        <label
                          className="volunteer-label"
                          style={{ color: labelColor }}
                        >
                          Full Name <span className="required-star">*</span>
                        </label>
                        <input
                          className="volunteer-input"
                          style={{
                            background: inputBgColor,
                            borderColor: inputBorderColor,
                            color: inputTextColor,
                            borderRadius: inputRadius,
                          }}
                          name="name"
                          required
                          placeholder="Enter your full name"
                          onChange={() => {
                            if (validationErrors.name) {
                              setValidationErrors((prev) => ({ ...prev, name: "" }));
                            }
                          }}
                        />
                        {validationErrors.name ? (
                          <div className="volunteer-error">{validationErrors.name}</div>
                        ) : null}
                      </div>
                    </Col>
                    <Col xs={24} md={12}>
                      <div className="volunteer-field">
                        <label
                          className="volunteer-label"
                          style={{ color: labelColor }}
                        >
                          Email Address <span className="required-star">*</span>
                        </label>
                        <input
                          className="volunteer-input"
                          style={{
                            background: inputBgColor,
                            borderColor: inputBorderColor,
                            color: inputTextColor,
                            borderRadius: inputRadius,
                          }}
                          name="email"
                          type="email"
                          required
                          placeholder="your@email.com"
                          onChange={() => {
                            if (validationErrors.email) {
                              setValidationErrors((prev) => ({ ...prev, email: "" }));
                            }
                          }}
                        />
                        {validationErrors.email ? (
                          <div className="volunteer-error">{validationErrors.email}</div>
                        ) : null}
                      </div>
                    </Col>
                    <Col xs={24} md={12}>
                      <div className="volunteer-field">
                        <label
                          className="volunteer-label"
                          style={{ color: labelColor }}
                        >
                          Phone Number <span className="required-star">*</span>
                        </label>
                        <input
                          className="volunteer-input"
                          style={{
                            background: inputBgColor,
                            borderColor: inputBorderColor,
                            color: inputTextColor,
                            borderRadius: inputRadius,
                          }}
                          name="phone"
                          inputMode="numeric"
                          required
                          placeholder="+91 98765 43210"
                          onChange={() => {
                            if (validationErrors.phone) {
                              setValidationErrors((prev) => ({ ...prev, phone: "" }));
                            }
                          }}
                        />
                        {validationErrors.phone ? (
                          <div className="volunteer-error">{validationErrors.phone}</div>
                        ) : null}
                      </div>
                    </Col>
                    <Col xs={24} md={12}>
                      <div className="volunteer-field">
                        <label
                          className="volunteer-label"
                          style={{ color: labelColor }}
                        >
                          Age <span className="required-star">*</span>
                        </label>
                        <input
                          className="volunteer-input"
                          style={{
                            background: inputBgColor,
                            borderColor: inputBorderColor,
                            color: inputTextColor,
                            borderRadius: inputRadius,
                          }}
                          name="age"
                          inputMode="numeric"
                          required
                          placeholder="18"
                          onChange={() => {
                            if (validationErrors.age) {
                              setValidationErrors((prev) => ({ ...prev, age: "" }));
                            }
                          }}
                        />
                        {validationErrors.age ? (
                          <div className="volunteer-error">{validationErrors.age}</div>
                        ) : null}
                      </div>
                    </Col>
                    <Col xs={24} md={12}>
                      <div className="volunteer-field">
                        <label
                          className="volunteer-label"
                          style={{ color: labelColor }}
                        >
                          Education
                        </label>
                        <input
                          className="volunteer-input"
                          style={{
                            background: inputBgColor,
                            borderColor: inputBorderColor,
                            color: inputTextColor,
                            borderRadius: inputRadius,
                          }}
                          name="education"
                          placeholder="Highest qualification"
                        />
                      </div>
                    </Col>
                    <Col xs={24} md={12}>
                      <div className="volunteer-field">
                        <label
                          className="volunteer-label"
                          style={{ color: labelColor }}
                        >
                          Current Occupation
                        </label>
                        <input
                          className="volunteer-input"
                          style={{
                            background: inputBgColor,
                            borderColor: inputBorderColor,
                            color: inputTextColor,
                            borderRadius: inputRadius,
                          }}
                          name="occupation"
                          placeholder="Student, Working Professional, etc."
                        />
                      </div>
                    </Col>
                    <Col xs={24}>
                      <div className="volunteer-field">
                        <label
                          className="volunteer-label"
                          style={{ color: labelColor }}
                        >
                          Availability (Hours per month){" "}
                          <span className="required-star">*</span>
                        </label>
                        <input
                          className="volunteer-input"
                          style={{
                            background: inputBgColor,
                            borderColor: inputBorderColor,
                            color: inputTextColor,
                            borderRadius: inputRadius,
                          }}
                          name="availability"
                          inputMode="numeric"
                          required
                          placeholder="e.g. 12"
                          onChange={() => {
                            if (validationErrors.availability) {
                              setValidationErrors((prev) => ({ ...prev, availability: "" }));
                            }
                          }}
                        />
                        {validationErrors.availability ? (
                          <div className="volunteer-error">{validationErrors.availability}</div>
                        ) : null}
                      </div>
                    </Col>
                    <Col xs={24}>
                      <div className="volunteer-field">
                        <label
                          className="volunteer-label"
                          style={{ color: labelColor }}
                        >
                          Areas of Interest (Select all that apply)
                        </label>
                        <ConfigProvider
                          theme={{ token: { colorPrimary: checkboxColor } }}
                        >
                          <div className="volunteer-areas">
                            {areaOptions.map((item) => (
                              <Checkbox
                                key={item}
                                name="interest"
                                value={item}
                                className="volunteer-checkbox"
                                style={{ color: labelColor }}
                              >
                                {item}
                              </Checkbox>
                            ))}
                          </div>
                        </ConfigProvider>
                      </div>
                    </Col>
                    <Col xs={24}>
                      <div className="volunteer-field">
                        <label
                          className="volunteer-label"
                          style={{ color: labelColor }}
                        >
                          Relevant Experience
                        </label>
                        <textarea
                          className="volunteer-input volunteer-textarea"
                          style={{
                            background: inputBgColor,
                            borderColor: inputBorderColor,
                            color: inputTextColor,
                            borderRadius: inputRadius,
                          }}
                          name="experience"
                          rows={3}
                          placeholder="Share your relevant volunteering or social work experience..."
                        />
                      </div>
                    </Col>
                    <Col xs={24}>
                      <div
                        className="volunteer-field"
                        style={{ marginBottom: 18 }}
                      >
                        <label
                          className="volunteer-label"
                          style={{ color: labelColor }}
                        >
                          Why do you want to volunteer with MESCO?{" "}
                          <span className="required-star">*</span>
                        </label>
                        <textarea
                          className="volunteer-input volunteer-textarea"
                          style={{
                            background: inputBgColor,
                            borderColor: inputBorderColor,
                            color: inputTextColor,
                            borderRadius: inputRadius,
                          }}
                          name="motivation"
                          required
                          rows={4}
                          placeholder="Tell us what motivates you to join our mission..."
                          onChange={() => {
                            if (validationErrors.motivation) {
                              setValidationErrors((prev) => ({ ...prev, motivation: "" }));
                            }
                          }}
                        />
                        {validationErrors.motivation ? (
                          <div className="volunteer-error">{validationErrors.motivation}</div>
                        ) : null}
                      </div>
                    </Col>
                    <Col xs={24}>
                      <VolunteerSubmitButton
                        label={submitLabel || "Submit Application"}
                        background={submitBtnBgColor}
                        textColor={submitBtnTextColor}
                      />
                    </Col>
                  </Row>
                </form>
              </div>
            </Col>

            <Col xs={24} lg={8}>
              <div
                className="volunteer-side-card"
                style={{
                  background:
                    sideBgColor ||
                    "linear-gradient(147deg, #cf372f 0%, #741f1b 100%)",
                  borderRadius: sideCardRadius,
                }}
              >
                {sideTitle && (
                  <MainTitle
                    fontSize={26}
                    lineHeight={2.8}
                    className="mb-4"
                    style={{ color: sideTitleColor }}
                  >
                    {sideTitle}
                  </MainTitle>
                )}
                {sideDescription && (
                  <p
                    className="volunteer-side-description"
                    style={{ color: sideTextColor }}
                  >
                    {sideDescription}
                  </p>
                )}
                {sideItems.length > 0 && (
                  <ul className="volunteer-side-list">
                    {sideItems.map((item) => (
                      <li
                        key={item}
                        style={{
                          color: sideTextColor,
                          "--volunteer-bullet-color": sideBulletColor,
                        }}
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Col>
          </Row>
        </Wrapper>
      </PageContainer>
    </FullWidthBackground>
  );
}
