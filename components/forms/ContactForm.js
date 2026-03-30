"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Row, Col, message } from "antd";
import styled from "styled-components";
import { submitContact } from "@/app/actions/contact";
import { getColor } from "@/styles/Theme";

const FormWrapper = styled.div`
  .form-heading {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 8px;
    @media (max-width: 768px) {
      font-size: 20px;
    }
  }
  .form-description {
    font-size: 14px;
    color: rgba(0, 0, 0, 0.55);
    margin-bottom: 32px;
    line-height: 1.6;
  }
  .form-label {
    display: block;
    margin-bottom: 6px;
    font-weight: 600;
    font-size: 14px;
    color: rgba(0, 0, 0, 0.85);
  }
  .form-label .required {
    color: #cf372f;
  }
  .form-field {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 8px;
    font-size: 14px;
    line-height: 1.5;
    outline: none;
    background: #fff;
    transition: border-color 0.2s ease;
    &:focus {
      border-color: rgba(0, 0, 0, 0.3);
    }
    &::placeholder {
      color: rgba(0, 0, 0, 0.3);
    }
  }
  select.form-field {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23999' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 16px center;
    padding-right: 40px;
    cursor: pointer;
  }
  textarea.form-field {
    resize: vertical;
    min-height: 120px;
  }
  .form-group {
    margin-bottom: 20px;
  }
`;

const SubmitBtn = styled.button`
  padding: 12px 32px;
  border: none;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s ease;
  &:hover {
    opacity: 0.85;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const InfoCard = styled.div`
  background: rgba(0, 0, 0, 0.02);
  border-radius: 12px;
  padding: 32px;
  @media (max-width: 768px) {
    padding: 24px;
  }
`;

const InfoItem = styled.div`
  padding: 20px 0;
  border-bottom: 2px dashed rgba(0, 0, 0, 0.08);
  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
  &:first-child {
    padding-top: 0;
  }
  .info-header {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 6px;
  }
  .info-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    margin-top: 2px;
  }
  .info-title {
    font-size: 16px;
    font-weight: 700;
  }
  .info-text {
    font-size: 14px;
    color: rgba(0, 0, 0, 0.6);
    line-height: 1.6;
    margin: 0;
    padding-left: 30px;
  }
`;

function SubmitButton({ btnBgColor, btnTextColor }) {
  const { pending } = useFormStatus();
  return (
    <SubmitBtn
      type="submit"
      disabled={pending}
      style={{ background: btnBgColor, color: btnTextColor }}
    >
      {pending ? "Sending..." : "Send Message"}
    </SubmitBtn>
  );
}

const MapWrapper = styled.div`
  margin-top: 40px;
  border-radius: 16px;
  overflow: hidden;
  width: 100%;
  height: 400px;
  @media (max-width: 768px) {
    height: 280px;
    margin-top: 32px;
  }
  iframe {
    width: 100%;
    height: 100%;
    border: 0;
    display: block;
  }
`;

export default function ContactForm({
  page,
  source,
  subjectOptions,
  contactInfo,
  btnBgColor,
  btnTextColor,
  iconColor,
  formHeadingColor,
  formDescColor,
  mapEmbedUrl,
}) {
  const [state, formAction] = useFormState(submitContact, null);
  const formRef = useRef(null);
  const resolvedBtnBg = btnBgColor || "var(--primary-color, #cf372f)";
  const resolvedBtnText = btnTextColor || "#fff";
  const resolvedIconColor = iconColor || "#cf372f";

  const subjects =
    Array.isArray(subjectOptions) && subjectOptions.length > 0
      ? subjectOptions
      : ["General Inquiry", "Volunteering", "Donation", "Partnership", "Other"];

  const info = contactInfo || {
    regdOffice:
      "110, Natalwala Building, V. S. Road, Mahim(W), Mumbai - 400 016.",
    adminOffice:
      "1 & 2, Plot No 423, Landmark Building, Next to Johnson & Johnson, Near Saraswati Mandir School, Senapati Bapat Marg, Mahim(W), Mumbai - 400016.",
    email: "mescotrust@mescotrust.org",
    phone: "(+9122) 24441442, (+9122) 24448637",
  };

  useEffect(() => {
    if (!state) return;
    if (state.success) {
      message.success("Message sent. We will get back to you soon.");
      formRef.current?.reset();
    } else if (state.error) {
      message.error(state.error);
    }
  }, [state]);

  return (
    <FormWrapper>
      <Row gutter={[48, 32]}>
        <Col xs={24} md={12}>
          <div className="form-heading" style={formHeadingColor ? { color: formHeadingColor } : undefined}>Send Us a Message</div>
          <p className="form-description" style={formDescColor ? { color: formDescColor } : undefined}>
            Have a question or want to get involved? Fill out the form and we'll
            get back to you shortly.
          </p>
          <form ref={formRef} action={formAction}>
            <input type="hidden" name="page" value={page || ""} />
            <input type="hidden" name="source" value={source || ""} />

            <div className="form-group">
              <label className="form-label">
                Full Name <span className="required">*</span>
              </label>
              <input
                name="name"
                required
                className="form-field"
                placeholder="Your name"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Email <span className="required">*</span>
              </label>
              <input
                name="email"
                type="email"
                required
                className="form-field"
                placeholder="your@email.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Phone <span className="required">*</span>
              </label>
              <input
                name="phone"
                type="tel"
                required
                className="form-field"
                placeholder="+91 00000 00000"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Subject <span className="required">*</span>
              </label>
              <select
                name="subject"
                required
                className="form-field"
                defaultValue=""
              >
                <option value="" disabled>
                  Select a subject
                </option>
                {subjects.map((s, i) => (
                  <option key={i} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Message <span className="required">*</span>
              </label>
              <textarea
                name="message"
                required
                className="form-field"
                placeholder="How can we help you?"
                rows={5}
              />
            </div>

            <SubmitButton
              btnBgColor={resolvedBtnBg}
              btnTextColor={resolvedBtnText}
            />
          </form>
        </Col>

        <Col xs={24} md={12}>
          <div className="form-heading" style={formHeadingColor ? { color: formHeadingColor } : undefined}>Get in Touch</div>
          <p className="form-description" style={formDescColor ? { color: formDescColor } : undefined}>
            Visit us or reach out through any of the channels below.
          </p>
          <InfoCard>
            {info.regdOffice && (
              <InfoItem>
                <div className="info-header">
                  <svg className="info-icon" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M10 1C6.5 1 4 3.5 4 7C4 11.5 10 19 10 19C10 19 16 11.5 16 7C16 3.5 13.5 1 10 1Z"
                      fill={resolvedIconColor}
                    />
                    <circle cx="10" cy="7" r="2.5" fill="#fff" />
                  </svg>
                  <span className="info-title">Regd. Office</span>
                </div>
                <p className="info-text">{info.regdOffice}</p>
              </InfoItem>
            )}
            {info.adminOffice && (
              <InfoItem>
                <div className="info-header">
                  <svg className="info-icon" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M10 1C6.5 1 4 3.5 4 7C4 11.5 10 19 10 19C10 19 16 11.5 16 7C16 3.5 13.5 1 10 1Z"
                      fill={resolvedIconColor}
                    />
                    <circle cx="10" cy="7" r="2.5" fill="#fff" />
                  </svg>
                  <span className="info-title">Admin Office</span>
                </div>
                <p className="info-text">{info.adminOffice}</p>
              </InfoItem>
            )}
            {info.email && (
              <InfoItem>
                <div className="info-header">
                  <svg className="info-icon" viewBox="0 0 20 20" fill="none">
                    <rect
                      x="2"
                      y="4"
                      width="16"
                      height="12"
                      rx="2"
                      stroke={resolvedIconColor}
                      strokeWidth="1.5"
                      fill="none"
                    />
                    <path
                      d="M2 6L10 11L18 6"
                      stroke={resolvedIconColor}
                      strokeWidth="1.5"
                      fill="none"
                    />
                  </svg>
                  <span className="info-title">Email</span>
                </div>
                <p className="info-text">
                  <a
                    href={`mailto:${info.email}`}
                    style={{ color: "inherit", textDecoration: "none" }}
                  >
                    {info.email}
                  </a>
                </p>
              </InfoItem>
            )}
            {info.phone && (
              <InfoItem>
                <div className="info-header">
                  <svg className="info-icon" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M17 14.5C17 15.3 16.3 16 15.5 16C8 16 3 11 3 3.5C3 2.7 3.7 2 4.5 2H7L9 6L7 8C8 10 10 12 12 13L14 11L18 13L17 14.5Z"
                      fill={resolvedIconColor}
                    />
                  </svg>
                  <span className="info-title">Phone</span>
                </div>
                <p className="info-text">{info.phone}</p>
              </InfoItem>
            )}
          </InfoCard>
        </Col>
      </Row>
      {mapEmbedUrl && (
        <MapWrapper>
          <iframe
            src={mapEmbedUrl}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Office Location"
          />
        </MapWrapper>
      )}
    </FormWrapper>
  );
}
