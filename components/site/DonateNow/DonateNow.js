"use client";

import { useState, useRef, useEffect } from "react";
import { Row, Col, Select, notification } from "antd";
import styled from "styled-components";
import {
  FullWidthBackground,
  getColor,
  MainTitle,
  PageContainer,
  SubTitle,
} from "@/styles/Theme";
import {
  isValidEmail,
  isValidName,
  isValidPan,
  isValidPhone,
  normalizeText,
  toDigits,
} from "@/lib/formValidation";

/* ── Styled Components ── */
const PackageList = styled.div`
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  padding: 24px;
  .pkg-title {
    font-size: 22px;
    font-weight: 700;
    margin-bottom: 16px;
  }
  .pkg-cards {
    @media (max-width: 767px) {
      display: none;
    }
  }
  .pkg-dropdown {
    display: none;
    @media (max-width: 767px) {
      display: block;
    }
    .ant-select {
      width: 100%;
    }
    .ant-select-selection-item {
      white-space: normal !important;
      line-height: 1.4 !important;
      padding: 4px 0 !important;
    }
    .ant-select-item-option-content {
      white-space: normal !important;
      line-height: 1.4;
      padding: 4px 0;
    }
  }
`;

const PackageCard = styled.button`
  display: block;
  width: 100%;
  text-align: left;
  padding: 14px 18px;
  border: 1px solid rgba(38, 42, 44, 0.1);
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  background: #fff;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.5s ease;
  &:hover {
    border-color: ${getColor("primary")};
  }
  &.active {
    border-color: transparent;
    color: #fff;
  }
  .pkg-amount {
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 2px;
  }
  .pkg-desc {
    font-size: 12px;
    opacity: 0.8;
    line-height: 1.4;
  }
`;

const FormWrapper = styled.div`
  .form-title {
    font-size: 22px;
    font-weight: 700;
    margin-bottom: 8px;
  }
  .form-desc {
    font-size: 14px;
    color: rgba(0, 0, 0, 0.5);
    margin-bottom: 24px;
    line-height: 1.5;
  }
  .form-label {
    display: block;
    margin-bottom: 6px;
    font-weight: 600;
    font-size: 14px;
  }
  .form-label .req {
    color: #cf372f;
  }
  .form-field {
    width: 100%;
    padding: 10px 14px;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 8px;
    font-size: 14px;
    outline: none;
    background: #fff;
    transition: border-color 0.2s;
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
    background-position: right 14px center;
    padding-right: 36px;
    cursor: pointer;
  }
  .form-group {
    margin-bottom: 16px;
  }
`;

const BtnRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  flex-wrap: wrap;
  @media (max-width: 576px) {
    justify-content: center;
  }
`;

const DonateBtn = styled.button`
  padding: 12px 28px;
  border: none;
  border-radius: 50px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const QrBtn = styled.button`
  padding: 12px 28px;
  border: 1px solid ${getColor("primary")};
  border-radius: 50px;
  font-size: 14px;
  font-weight: 600;
  background: transparent;
  cursor: pointer;
  transition: opacity 0.2s;
`;

export default function DonateNow(props) {
  const formRef = useRef(null);
  const gatewayFormRef = useRef(null);
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [encData, setEncData] = useState(null);
  const [errors, setErrors] = useState({});
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  useEffect(() => {
    const updateViewport = () => setIsMobileViewport(window.innerWidth <= 767);
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  /* ── Title ── */
  const mainTitle = (props?.mainTitle ?? "").toString().trim();
  const subTitle = (props?.subTitle ?? "").toString().trim();
  const titleEnabled = props?.donateNowTitleEnabled !== false;
  const subTitleEnabled = props?.donateNowSubTitleEnabled !== false;
  const titleColorKey = (props?.titleColorKey ?? "").toString().trim();
  const titleColor = titleColorKey
    ? getColor(titleColorKey)
    : getColor("primary");
  const subTitleColorKey = (props?.donateNowSubTitleColorKey ?? "")
    .toString()
    .trim();
  const subTitleColor = subTitleColorKey
    ? getColor(subTitleColorKey)
    : undefined;

  /* ── Colors ── */
  const btnBgColorKey = (props?.donateNowBtnBgColorKey ?? "").toString().trim();
  const btnBgColor = btnBgColorKey ? getColor(btnBgColorKey) : "#8b1a1a";
  const btnTextColorKey = (props?.donateNowBtnTextColorKey ?? "")
    .toString()
    .trim();
  const btnTextColor = btnTextColorKey ? getColor(btnTextColorKey) : "#fff";
  const qrBtnBorderColorKey = (props?.donateNowQrBtnBorderColorKey ?? "")
    .toString()
    .trim();
  const qrBtnBorderColor = qrBtnBorderColorKey
    ? getColor(qrBtnBorderColorKey)
    : "#000";
  const qrBtnTextColorKey = (props?.donateNowQrBtnTextColorKey ?? "")
    .toString()
    .trim();
  const qrBtnTextColor = qrBtnTextColorKey
    ? getColor(qrBtnTextColorKey)
    : "#000";
  const pkgActiveColorKey = (props?.donateNowPkgActiveColorKey ?? "")
    .toString()
    .trim();
  const pkgActiveColor = pkgActiveColorKey
    ? getColor(pkgActiveColorKey)
    : "#8b1a1a";
  const formHeadingColorKey = (props?.donateNowFormHeadingColorKey ?? "")
    .toString()
    .trim();
  const formHeadingColor = formHeadingColorKey
    ? getColor(formHeadingColorKey)
    : undefined;

  /* ── Packages ── */
  const packages = Array.isArray(props?.donateNowPackages)
    ? props.donateNowPackages
    : [];

  /* ── Purpose options ── */
  const purposeOptions = (props?.donateNowPurposeOptions ?? "")
    .toString()
    .trim()
    ? props.donateNowPurposeOptions
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  /* ── QR ── */
  const qrImageDesktop = (
    props?.donateNowQrImageDesktop ?? props?.donateNowQrImageUrl ?? ""
  )
    .toString()
    .trim();
  const qrImageMobile = (props?.donateNowQrImageMobile ?? "")
    .toString()
    .trim();
  const qrImageUrl =
    isMobileViewport && qrImageMobile ? qrImageMobile : qrImageDesktop || qrImageMobile;

  /* ── Section bg (standard boilerplate) ── */
  const PREFIX = "donateNow";
  const sectionBgType = (
    props?.[PREFIX + "SectionBgType"] ?? "default"
  ).toString();
  const sectionBgImage = (props?.[PREFIX + "SectionBgImage"] ?? "")
    .toString()
    .trim();
  const sectionBgColorKey = (props?.[PREFIX + "SectionBgColorKey"] ?? "")
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

  const pageContainerBgType = (
    props?.[PREFIX + "PageContainerBgType"] ?? "default"
  ).toString();
  const pageContainerBgImage = (props?.[PREFIX + "PageContainerBgImage"] ?? "")
    .toString()
    .trim();
  const pageContainerBgColorKey = (
    props?.[PREFIX + "PageContainerBgColorKey"] ?? ""
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

  /* ── Auto-fill donor lookup ── */
  const handleLookup = async (val) => {
    if (!val || val.length < 5) return;
    try {
      const res = await fetch(
        `/api/payment/donor-lookup?q=${encodeURIComponent(val)}`,
      );
      const data = await res.json();
      if (data.donor && formRef.current) {
        const f = formRef.current;
        if (data.donor.name)
          f.querySelector('[name="name"]').value = data.donor.name;
        if (data.donor.email)
          f.querySelector('[name="email"]').value = data.donor.email;
        if (data.donor.mobile)
          f.querySelector('[name="mobile"]').value = data.donor.mobile;
        if (data.donor.pan)
          f.querySelector('[name="pan"]').value = data.donor.pan;
        if (data.donor.address)
          f.querySelector('[name="address"]').value = data.donor.address;
        if (data.donor.city)
          f.querySelector('[name="city"]').value = data.donor.city;
        if (data.donor.state)
          f.querySelector('[name="state"]').value = data.donor.state;
        if (data.donor.country)
          f.querySelector('[name="country"]').value = data.donor.country;
        if (data.donor.pincode)
          f.querySelector('[name="pincode"]').value = data.donor.pincode;
        notification.success({
          message: "Info",
          description: "Previous details found and filled",
          placement: "bottomRight",
        });
      }
    } catch (_) {}
  };

  /* ── Submit to CCAvenue ── */
  const handleDonate = async () => {
    const f = formRef.current;
    if (!f) return;

    const lookup = normalizeText(f.querySelector('[name="lookup"]')?.value);
    const amount = normalizeText(f.querySelector('[name="amount"]')?.value);
    const purpose = normalizeText(f.querySelector('[name="purpose"]')?.value);
    const name = normalizeText(f.querySelector('[name="name"]')?.value);
    const pan = normalizeText(f.querySelector('[name="pan"]')?.value);
    const email = normalizeText(f.querySelector('[name="email"]')?.value);
    const mobile = normalizeText(f.querySelector('[name="mobile"]')?.value);
    const nextErrors = {};
    if (!lookup) nextErrors.lookup = "Email / Mobile is required";
    if (lookup) {
      const isEmail = lookup.includes("@");
      if (isEmail) {
        if (!isValidEmail(lookup)) {
          nextErrors.lookup = "Please enter a valid email";
        }
      } else {
        const lookupDigits = toDigits(lookup);
        if (lookupDigits.length < 10 || lookupDigits.length > 15) {
          nextErrors.lookup = "Please enter a valid mobile number";
        }
      }
    }
    if (!purpose) nextErrors.purpose = "Purpose is required";
    if (!amount) nextErrors.amount = "Amount is required";
    if (amount && (Number.isNaN(Number(amount)) || Number(amount) <= 0)) nextErrors.amount = "Please enter a valid amount";
    if (!name) nextErrors.name = "Full name is required";
    if (name && !isValidName(name)) nextErrors.name = "Name should contain alphabets only";
    if (!pan) nextErrors.pan = "PAN is required";
    if (pan && !isValidPan(pan)) nextErrors.pan = "Please enter a valid PAN";
    if (!email) nextErrors.email = "Email is required";
    if (email && !isValidEmail(email)) nextErrors.email = "Please enter a valid email address";
    if (!mobile) nextErrors.mobile = "Mobile number is required";
    if (mobile && !isValidPhone(mobile)) nextErrors.mobile = "Please enter a valid mobile number";
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});

    setSubmitting(true);
    try {
      const res = await fetch("/api/payment/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          purpose: purpose || "",
          zakat: f.querySelector('[name="zakat"]')?.value || "No",
          note: f.querySelector('[name="note"]')?.value || "",
          donor: {
            name,
            email,
            mobile,
            pan: pan || "",
            address: f.querySelector('[name="address"]')?.value || "",
            city: f.querySelector('[name="city"]')?.value || "",
            state: f.querySelector('[name="state"]')?.value || "",
            country: f.querySelector('[name="country"]')?.value || "",
            pincode: f.querySelector('[name="pincode"]')?.value || "",
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        notification.error({
          message: "Submission failed",
          description: data.error || "Failed to initiate payment",
          placement: "bottomRight",
        });
        setSubmitting(false);
        return;
      }
      notification.success({
        message: "Success",
        description: "Redirecting to payment gateway...",
        placement: "bottomRight",
      });
      // Set encrypted data and submit hidden form to CCAvenue
      setEncData(data);
      setTimeout(() => {
        gatewayFormRef.current?.submit();
      }, 100);
    } catch (err) {
      notification.error({
        message: "Submission failed",
        description: "Something went wrong",
        placement: "bottomRight",
      });
      setSubmitting(false);
    }
  };

  return (
    <FullWidthBackground className={sectionBgClassName} style={sectionBgStyle}>
      <PageContainer style={pageContainerBgStyle}>
        {(titleEnabled || subTitleEnabled) && (mainTitle || subTitle) && (
          <Row gutter={[16, 16]}>
            <Col span={24} className="mb-4">
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
            </Col>
          </Row>
        )}
        <Row gutter={[32, 32]}>
          {/* LEFT: Donation Packages */}
          <Col xs={24} md={8}>
            <PackageList>
              <div
                className="pkg-title"
                style={
                  formHeadingColor ? { color: formHeadingColor } : undefined
                }
              >
                Donate
              </div>
              {/* Desktop: card list */}
              <div className="pkg-cards">
                {packages.map((pkg, idx) => {
                  const amt = (pkg?.amount ?? "").toString().trim();
                  const desc = (pkg?.description ?? "").toString().trim();
                  const isActive = selectedPkg === idx;
                  return (
                    <PackageCard
                      key={idx}
                      type="button"
                      className={isActive ? "active" : ""}
                      style={
                        isActive ? { background: pkgActiveColor } : undefined
                      }
                      onClick={() => {
                        setSelectedPkg(idx);
                        if (formRef.current && amt) {
                          formRef.current.querySelector('[name="amount"]').value =
                            amt.replace(/[^0-9.]/g, "");
                        }
                      }}
                    >
                      <div className="pkg-amount">
                        {amt.startsWith("₹") ? amt : `₹${amt}/-`}
                      </div>
                      {desc && <div className="pkg-desc">{desc}</div>}
                    </PackageCard>
                  );
                })}
              </div>
              {/* Mobile: dropdown */}
              <div className="pkg-dropdown">
                <Select
                  placeholder="Select a package"
                  size="large"
                  value={selectedPkg}
                  onChange={(idx) => {
                    setSelectedPkg(idx);
                    if (idx !== null && idx !== undefined && formRef.current) {
                      const amt = (packages[idx]?.amount ?? "").toString().trim();
                      if (amt) {
                        formRef.current.querySelector('[name="amount"]').value = amt.replace(/[^0-9.]/g, "");
                      }
                    }
                  }}
                  popupMatchSelectWidth={true}
                  optionLabelProp="selectedLabel"
                >
                  {packages.map((pkg, idx) => {
                    const amt = (pkg?.amount ?? "").toString().trim();
                    const desc = (pkg?.description ?? "").toString().trim();
                    const label = amt.startsWith("₹") ? amt : `₹${amt}/-`;
                    return (
                      <Select.Option key={idx} value={idx} selectedLabel={label}>
                        {desc ? `${label} — ${desc}` : label}
                      </Select.Option>
                    );
                  })}
                </Select>
              </div>
            </PackageList>
          </Col>

          {/* RIGHT: Donation Form */}
          <Col xs={24} md={16}>
            <FormWrapper className="mt-3">
              <div
                className="form-title"
                style={
                  formHeadingColor ? { color: formHeadingColor } : undefined
                }
              >
                Details
              </div>
              <p className="form-desc">
                If you have already donated before type your email ID or Mobile
                No., the remaining details will be filled automatically.
              </p>

              <div ref={formRef}>
                {/* Auto-fill lookup */}
                <div className="form-group">
                  <label className="form-label">
                    Email / Mobile No. <span className="req">*</span>
                  </label>
                  <input
                    name="lookup"
                    inputMode="text"
                    className="form-field"
                    placeholder="Enter email / Mobile to fill the data"
                    onBlur={(e) => handleLookup(e.target.value)}
                    onChange={() =>
                      errors.lookup &&
                      setErrors((prev) => ({ ...prev, lookup: "" }))
                    }
                    style={errors.lookup ? { borderColor: "#cf372f" } : undefined}
                  />
                  {errors.lookup ? (
                    <div style={{ color: "#cf372f", fontSize: 12, marginTop: 6 }}>
                      {errors.lookup}
                    </div>
                  ) : null}
                </div>

                <Row gutter={[16, 0]}>
                  <Col xs={24} md={12}>
                    <div className="form-group">
                      <label className="form-label">
                        Zakat <span className="req">*</span>
                      </label>
                      <select
                        name="zakat"
                        className="form-field"
                        defaultValue="Yes"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                  </Col>
                  <Col xs={24} md={12}>
                    <div className="form-group">
                      <label className="form-label">
                        Purpose of Donation <span className="req">*</span>
                      </label>
                      <select
                        name="purpose"
                        className="form-field"
                        defaultValue=""
                        required
                        onChange={() => errors.purpose && setErrors((prev) => ({ ...prev, purpose: "" }))}
                        style={errors.purpose ? { borderColor: "#cf372f" } : undefined}
                      >
                        <option value="" disabled>
                          Select
                        </option>
                        {purposeOptions.map((opt, i) => (
                          <option key={i} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                      {errors.purpose ? (
                        <div style={{ color: "#cf372f", fontSize: 12, marginTop: 6 }}>{errors.purpose}</div>
                      ) : null}
                    </div>
                  </Col>
                  <Col xs={24} md={12}>
                    <div className="form-group">
                      <label className="form-label">
                        Amount <span className="req">*</span>
                      </label>
                      <input
                        name="amount"
                        type="number"
                        className="form-field"
                        placeholder="Enter amount"
                        required
                        min="1"
                        onChange={() => errors.amount && setErrors((prev) => ({ ...prev, amount: "" }))}
                        style={errors.amount ? { borderColor: "#cf372f" } : undefined}
                      />
                      {errors.amount ? (
                        <div style={{ color: "#cf372f", fontSize: 12, marginTop: 6 }}>{errors.amount}</div>
                      ) : null}
                    </div>
                  </Col>
                  <Col xs={24} md={12}>
                    <div className="form-group">
                      <label className="form-label">
                        Full Name <span className="req">*</span>
                      </label>
                      <input
                        name="name"
                        className="form-field"
                        placeholder="Enter full name"
                        required
                        onChange={() => errors.name && setErrors((prev) => ({ ...prev, name: "" }))}
                        style={errors.name ? { borderColor: "#cf372f" } : undefined}
                      />
                      {errors.name ? (
                        <div style={{ color: "#cf372f", fontSize: 12, marginTop: 6 }}>{errors.name}</div>
                      ) : null}
                    </div>
                  </Col>
                  <Col xs={24} md={12}>
                    <div className="form-group">
                      <label className="form-label">
                        PAN No. <span className="req">*</span>
                      </label>
                      <input
                        name="pan"
                        className="form-field"
                        placeholder="PAN No."
                        maxLength={10}
                        style={errors.pan ? { borderColor: "#cf372f", textTransform: "uppercase" } : { textTransform: "uppercase" }}
                        required
                        onChange={() =>
                          errors.pan && setErrors((prev) => ({ ...prev, pan: "" }))
                        }
                      />
                      {errors.pan ? (
                        <div style={{ color: "#cf372f", fontSize: 12, marginTop: 6 }}>
                          {errors.pan}
                        </div>
                      ) : null}
                    </div>
                  </Col>
                  <Col xs={24} md={12}>
                    <div className="form-group">
                      <label className="form-label">
                        Email ID <span className="req">*</span>
                      </label>
                      <input
                        name="email"
                        type="email"
                        className="form-field"
                        placeholder="Email ID"
                        required
                        onChange={() => errors.email && setErrors((prev) => ({ ...prev, email: "" }))}
                        style={errors.email ? { borderColor: "#cf372f" } : undefined}
                      />
                      {errors.email ? (
                        <div style={{ color: "#cf372f", fontSize: 12, marginTop: 6 }}>{errors.email}</div>
                      ) : null}
                    </div>
                  </Col>
                  <Col xs={24} md={12}>
                    <div className="form-group">
                      <label className="form-label">
                        Mobile No. <span className="req">*</span>
                      </label>
                      <input
                        name="mobile"
                        type="tel"
                        inputMode="numeric"
                        maxLength={15}
                        className="form-field"
                        placeholder="Mobile No."
                        required
                        onChange={() => errors.mobile && setErrors((prev) => ({ ...prev, mobile: "" }))}
                        style={errors.mobile ? { borderColor: "#cf372f" } : undefined}
                      />
                      {errors.mobile ? (
                        <div style={{ color: "#cf372f", fontSize: 12, marginTop: 6 }}>{errors.mobile}</div>
                      ) : null}
                    </div>
                  </Col>
                  <Col xs={24} md={12}>
                    <div className="form-group">
                      <label className="form-label">Pincode</label>
                      <input
                        name="pincode"
                        className="form-field"
                        placeholder="Enter pincode"
                      />
                    </div>
                  </Col>
                  <Col xs={24} md={12}>
                    <div className="form-group">
                      <label className="form-label">Address</label>
                      <input
                        name="address"
                        className="form-field"
                        placeholder="Address"
                      />
                    </div>
                  </Col>
                  <Col xs={24} md={12}>
                    <div className="form-group">
                      <label className="form-label">City</label>
                      <input
                        name="city"
                        className="form-field"
                        placeholder="City"
                      />
                    </div>
                  </Col>
                  <Col xs={24} md={12}>
                    <div className="form-group">
                      <label className="form-label">State</label>
                      <input
                        name="state"
                        className="form-field"
                        placeholder="State"
                      />
                    </div>
                  </Col>
                  <Col xs={24} md={12}>
                    <div className="form-group">
                      <label className="form-label">Country</label>
                      <input
                        name="country"
                        className="form-field"
                        placeholder="Country"
                        defaultValue="India"
                      />
                    </div>
                  </Col>
                  <Col span={24}>
                    <div className="form-group">
                      <label className="form-label">Note</label>
                      <input
                        name="note"
                        className="form-field"
                        placeholder="Enter note"
                      />
                    </div>
                  </Col>
                </Row>

                <BtnRow>
                  {qrImageUrl && (
                    <QrBtn
                      type="button"
                      style={{
                        color: qrBtnTextColor,
                        borderColor: qrBtnBorderColor,
                      }}
                      onClick={() => window.open(qrImageUrl, "_blank")}
                    >
                      Donate Now with QR
                    </QrBtn>
                  )}
                  <DonateBtn
                    type="button"
                    disabled={submitting}
                    style={{ background: btnBgColor, color: btnTextColor }}
                    onClick={handleDonate}
                  >
                    {submitting ? "Processing..." : "Donate Now"}
                  </DonateBtn>
                </BtnRow>
              </div>
            </FormWrapper>
          </Col>
        </Row>

        {/* Hidden form that auto-submits to CCAvenue */}
        {encData && (
          <form
            ref={gatewayFormRef}
            method="POST"
            action={encData.gatewayUrl}
            style={{ display: "none" }}
          >
            <input type="hidden" name="encRequest" value={encData.encRequest} />
            <input
              type="hidden"
              name="access_code"
              value={encData.accessCode}
            />
          </form>
        )}
      </PageContainer>
    </FullWidthBackground>
  );
}
