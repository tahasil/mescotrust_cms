"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { notification } from "antd";
import styled from "styled-components";
import { submitContact } from "@/app/actions/contact";
import { getColor } from "@/styles/Theme";
import {
  hasMinText,
  isValidEmail,
  isValidName,
  isValidPhone,
  normalizeText,
} from "@/lib/formValidation";

const FormWrapper = styled.div`
  width: 100%;
  max-width: 1280px;
  margin-inline: auto;

  .contact-layout {
    display: grid;
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
    gap: clamp(40px, 4.5vw, 64px);
    align-items: start;
  }

  .contact-info-panel,
  .contact-form-panel {
    min-width: 0;
  }

  .contact-form-panel {
    padding: clamp(26px, 2.5vw, 36px);
    background: var(--contact-form-card-bg, var(--theme-white, #fff));
    border: 1px solid var(--contact-form-card-border, var(--theme-border, rgba(42, 40, 62, 0.14)));
    border-radius: 18px;
  }

  .form-heading {
    margin: 0 0 24px;
    color: var(--contact-form-heading-color, var(--theme-black, #2a283e));
    font-family: var(--fable-display, inherit);
    font-size: var(--contact-form-heading-size, 24px);
    font-weight: var(--contact-form-heading-weight, 620);
    line-height: var(--contact-form-heading-line-height, 1.2);
    letter-spacing: -0.015em;
    text-transform: none;
  }

  .form-label {
    display: block;
    margin-bottom: 7px;
    font-weight: 600;
    font-size: var(--contact-field-label-size, 13px);
    line-height: var(--contact-field-label-line-height, 1.4);
    color: var(--contact-field-label-color, var(--theme-black, #2a283e));
  }

  .form-label .required {
    color: var(--primary-color);
  }

  .form-field {
    width: 100%;
    min-height: 42px;
    padding: 9px 13px;
    border: 1px solid var(--contact-input-border, var(--theme-border, rgba(42, 40, 62, 0.14)));
    border-radius: 12px;
    font: inherit;
    font-size: var(--contact-input-text-size, 13px);
    line-height: 1.5;
    outline: none;
    background: var(--contact-input-bg, var(--theme-white, #fff));
    color: var(--contact-input-text-color, var(--theme-black, #2a283e));
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease,
      background-color 0.2s ease;
    &:focus {
      border-color: var(--contact-input-focus, var(--primary-color, #e03c33));
      box-shadow: 0 0 0 3px var(--theme-primary-light, rgba(224, 60, 51, 0.1));
    }
    &::placeholder {
      color: var(--theme-black-muted, rgba(42, 40, 62, 0.52));
    }
  }

  select.form-field {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23999' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 17px center;
    padding-right: 42px;
    cursor: pointer;
  }

  textarea.form-field {
    resize: vertical;
    min-height: 104px;
  }

  .contact-message-form {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px 14px;
  }

  .contact-message-form .form-group { margin: 0; }
  .contact-message-form .form-group:nth-of-type(5) { grid-column: 1 / -1; }
  .contact-message-form > button {
    justify-self: start;
    margin-top: 4px;
  }

  .error-text {
    margin-top: 6px;
    font-size: 12px;
    line-height: 1.4;
    color: var(--primary-color);
  }

  @media (max-width: 1023px) {
    .contact-layout {
      grid-template-columns: minmax(0, 1fr);
      gap: 48px;
    }

  }

  @media (max-width: 767px) {
    .contact-layout {
      gap: 36px;
    }

    .contact-form-panel {
      padding: 24px 18px;
      border-radius: 18px;
    }

    .contact-message-form { grid-template-columns: 1fr; }
    .contact-message-form .form-group:nth-of-type(5) { grid-column: auto; }
    .contact-message-form > button { width: 100%; }
  }
`;

const SubmitBtn = styled.button`
  min-height: 40px;
  padding: 10px 24px;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: var(--contact-button-text-size, 13px);
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
  &:hover {
    opacity: 0.92;
    transform: translateY(-2px);
    box-shadow: 0 8px 22px rgba(42, 40, 62, 0.16);
  }
  &:focus-visible {
    outline: 2px solid var(--primary-color, #e03c33);
    outline-offset: 3px;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const InfoCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const InfoItem = styled.div`
  padding: 17px 20px;
  background: var(--contact-info-card-bg, var(--theme-white, #fff));
  border: 1px solid var(--contact-info-card-border, var(--theme-border, rgba(42, 40, 62, 0.14)));
  border-radius: 15px;
  transition:
    border-color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    border-color: var(--theme-primary-pale, rgba(224, 60, 51, 0.38));
    transform: translateY(-2px);
    box-shadow: 0 10px 28px rgba(42, 40, 62, 0.07);
  }

  .info-header {
    margin-bottom: 8px;
  }

  .info-title {
    font-size: var(--contact-info-label-size, 13px);
    font-weight: var(--contact-info-label-weight, 620);
    line-height: var(--contact-info-label-line-height, 1.4);
    color: var(--contact-info-label-color, var(--primary-color, #e03c33));
  }

  .info-text {
    font-size: var(--contact-info-text-size, 13px);
    color: var(--contact-info-text-color, var(--theme-black-light));
    line-height: var(--contact-info-text-line-height, 1.55);
    margin: 0;
    overflow-wrap: anywhere;
  }

  .info-text a:hover {
    color: var(--primary-color, #e03c33) !important;
  }

  @media (max-width: 480px) {
    padding: 18px;

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
  margin-top: clamp(40px, 5vw, 64px);
  border: 1px solid var(--theme-border, rgba(42, 40, 62, 0.14));
  border-radius: 22px;
  overflow: hidden;
  width: 100%;
  height: clamp(300px, 31vw, 420px);
  background: var(--theme-surface, #f2f0ea);
  @media (max-width: 768px) {
    height: 280px;
    margin-top: 40px;
    border-radius: 16px;
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
  formHeadingColor,
  infoLabelColor,
  infoTextColor,
  infoCardBgColor,
  infoCardBorderColor,
  formCardBgColor,
  formCardBorderColor,
  fieldLabelColor,
  inputBgColor,
  inputBorderColor,
  inputFocusColor,
  inputTextColor,
  typography = {},
  mapEmbedUrl,
}) {
  const [state, formAction] = useFormState(submitContact, null);
  const formRef = useRef(null);
  const [errors, setErrors] = useState({});
  const resolvedBtnBg = btnBgColor || getColor("primary");
  const resolvedBtnText = btnTextColor || getColor("white");

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
      notification.success({
        message: "Success",
        description: "Message sent. We will get back to you soon.",
        placement: "bottomRight",
      });
      formRef.current?.reset();
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
    const nextErrors = {};
    const name = normalizeText(formData.get("name"));
    const email = normalizeText(formData.get("email"));
    const phone = normalizeText(formData.get("phone"));
    const subject = normalizeText(formData.get("subject"));
    const msg = normalizeText(formData.get("message"));

    if (!name) nextErrors.name = "Full name is required";
    if (name && !isValidName(name)) nextErrors.name = "Name should contain alphabets only";
    if (!email) nextErrors.email = "Email is required";
    if (email && !isValidEmail(email)) nextErrors.email = "Please enter a valid email address";
    if (!phone) nextErrors.phone = "Phone is required";
    if (phone && !isValidPhone(phone)) nextErrors.phone = "Please enter a valid mobile number";
    if (!subject) nextErrors.subject = "Subject is required";
    if (subject && !hasMinText(subject, 3)) nextErrors.subject = "Subject must be at least 3 characters";
    if (!msg) nextErrors.message = "Message is required";
    if (msg && !hasMinText(msg, 5)) nextErrors.message = "Message must be at least 5 characters";

    if (Object.keys(nextErrors).length > 0) {
      event.preventDefault();
      setErrors(nextErrors);
      return;
    }
    setErrors({});
  };

  return (
    <FormWrapper
      style={{
        "--contact-form-heading-color": formHeadingColor,
        "--contact-info-label-color": infoLabelColor,
        "--contact-info-text-color": infoTextColor,
        "--contact-info-card-bg": infoCardBgColor,
        "--contact-info-card-border": infoCardBorderColor,
        "--contact-form-card-bg": formCardBgColor,
        "--contact-form-card-border": formCardBorderColor,
        "--contact-field-label-color": fieldLabelColor,
        "--contact-input-bg": inputBgColor,
        "--contact-input-text-color": inputTextColor,
        "--contact-input-focus": inputFocusColor,
        "--contact-form-heading-size": `${typography.formHeadingSize}px`,
        "--contact-form-heading-weight": typography.formHeadingWeight,
        "--contact-form-heading-line-height": typography.formHeadingLineHeight,
        "--contact-info-label-size": `${typography.infoLabelSize}px`,
        "--contact-info-label-weight": typography.infoLabelWeight,
        "--contact-info-label-line-height": typography.infoLabelLineHeight,
        "--contact-info-text-size": `${typography.infoTextSize}px`,
        "--contact-info-text-line-height": typography.infoTextLineHeight,
        "--contact-field-label-size": `${typography.fieldLabelSize}px`,
        "--contact-field-label-line-height": typography.fieldLabelLineHeight,
        "--contact-input-text-size": `${typography.inputTextSize}px`,
        "--contact-button-text-size": `${typography.buttonTextSize}px`,
        "--contact-input-border": inputBorderColor,
      }}
    >
      <div className="contact-layout">
        <section className="contact-info-panel" aria-label="Contact information">
          <InfoCard>
            {info.regdOffice && (
              <InfoItem>
                <div className="info-header">
                  <span className="info-title">Registered Office</span>
                </div>
                <p className="info-text">{info.regdOffice}</p>
              </InfoItem>
            )}
            {info.adminOffice && (
              <InfoItem>
                <div className="info-header">
                  <span className="info-title">Admin Office</span>
                </div>
                <p className="info-text">{info.adminOffice}</p>
              </InfoItem>
            )}
            {info.email && (
              <InfoItem>
                <div className="info-header">
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
                  <span className="info-title">Phone</span>
                </div>
                <p className="info-text">{info.phone}</p>
              </InfoItem>
            )}
          </InfoCard>
        </section>

        <section className="contact-form-panel" aria-labelledby="contact-form-title">
          <h2 id="contact-form-title" className="form-heading">Send us a message</h2>
          <form className="contact-message-form" ref={formRef} action={formAction} onSubmit={handleSubmit} noValidate>
            <input type="hidden" name="page" value={page || ""} />
            <input type="hidden" name="source" value={source || ""} />

            <div className="form-group">
              <label className="form-label" htmlFor="contact-name">
                Full Name <span className="required" aria-hidden="true">*</span>
              </label>
              <input
                id="contact-name"
                name="name"
                required
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "contact-name-error" : undefined}
                className="form-field"
                placeholder="Your name"
                onChange={() => errors.name && setErrors((prev) => ({ ...prev, name: "" }))}
                style={errors.name ? { borderColor: "#E03C33" } : undefined}
              />
              {errors.name ? <div id="contact-name-error" className="error-text" role="alert">{errors.name}</div> : null}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="contact-email">
                Email <span className="required" aria-hidden="true">*</span>
              </label>
              <input
                id="contact-email"
                name="email"
                type="email"
                required
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "contact-email-error" : undefined}
                className="form-field"
                placeholder="your@email.com"
                onChange={() => errors.email && setErrors((prev) => ({ ...prev, email: "" }))}
                style={errors.email ? { borderColor: "#E03C33" } : undefined}
              />
              {errors.email ? <div id="contact-email-error" className="error-text" role="alert">{errors.email}</div> : null}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="contact-phone">
                Phone <span className="required" aria-hidden="true">*</span>
              </label>
              <input
                id="contact-phone"
                name="phone"
                type="tel"
                required
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? "contact-phone-error" : undefined}
                className="form-field"
                placeholder="+91 00000 00000"
                onChange={() => errors.phone && setErrors((prev) => ({ ...prev, phone: "" }))}
                style={errors.phone ? { borderColor: "#E03C33" } : undefined}
              />
              {errors.phone ? <div id="contact-phone-error" className="error-text" role="alert">{errors.phone}</div> : null}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="contact-subject">
                Subject <span className="required" aria-hidden="true">*</span>
              </label>
              <select
                id="contact-subject"
                name="subject"
                required
                aria-invalid={Boolean(errors.subject)}
                aria-describedby={errors.subject ? "contact-subject-error" : undefined}
                className="form-field"
                defaultValue=""
                onChange={() => errors.subject && setErrors((prev) => ({ ...prev, subject: "" }))}
                style={errors.subject ? { borderColor: "#E03C33" } : undefined}
              >
                <option value="" disabled>
                  Select a subject
                </option>
                {subjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
              {errors.subject ? <div id="contact-subject-error" className="error-text" role="alert">{errors.subject}</div> : null}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="contact-message">
                Message <span className="required" aria-hidden="true">*</span>
              </label>
              <textarea
                id="contact-message"
                name="message"
                required
                aria-invalid={Boolean(errors.message)}
                aria-describedby={errors.message ? "contact-message-error" : undefined}
                className="form-field"
                placeholder="How can we help you?"
                rows={5}
                onChange={() => errors.message && setErrors((prev) => ({ ...prev, message: "" }))}
                style={errors.message ? { borderColor: "#E03C33" } : undefined}
              />
              {errors.message ? <div id="contact-message-error" className="error-text" role="alert">{errors.message}</div> : null}
            </div>

            <SubmitButton
              btnBgColor={resolvedBtnBg}
              btnTextColor={resolvedBtnText}
            />
          </form>
        </section>
      </div>
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
