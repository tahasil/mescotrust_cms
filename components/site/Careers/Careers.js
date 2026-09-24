"use client";

import { useState } from "react";
import { Button, Col, Form, Input, Modal, Row, Upload, notification } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import styled from "styled-components";
import {
  FullWidthBackground,
  getColor,
  MainTitle,
  PageContainer,
  SubTitle,
} from "@/styles/Theme";
import { renderHighlightedTitle } from "@/components/site/HighlightedTitle";

/* ── Styled Components ── */
const JobCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 32px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  background: #fff;
  margin-bottom: 16px;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
  &:last-child {
    margin-bottom: 0;
  }
  &:hover {
    border-color: rgba(0, 0, 0, 0.15);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
  @media (max-width: 576px) {
    flex-direction: column;
    align-items: flex-start;
    padding: 20px;
    gap: 12px;
  }
`;

const JobInfo = styled.div`
  flex: 1;
  min-width: 0;
  .job-title {
    font-size: 18px;
    font-weight: 700;
    line-height: 1.3;
    margin-bottom: 8px;
    @media (max-width: 576px) {
      font-size: 16px;
    }
  }
  .job-meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
    color: rgba(0, 0, 0, 0.6);
    @media (max-width: 576px) {
      gap: 10px;
    }
  }
  .job-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: inherit;
    @media (max-width: 576px) {
      font-size: 12px;
    }
  }
  .job-tag-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
`;

const ApplyBtn = styled.a`
  flex-shrink: 0;
  display: inline-block;
  padding: 10px 28px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 24px;
  text-decoration: none;
  transition: opacity 0.2s ease;
  &:hover {
    opacity: 0.85;
  }
  @media (max-width: 576px) {
    margin-top: 16px;
    padding: 8px 16px;
    width: 100%;
    text-align: center;
  }
`;

/**
 * Site component: Careers.
 * Vertical list of job cards with title, department, location, type, and Apply button.
 */
export default function Careers(props) {
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);

  const handleOpenApplyModal = (jobItem) => {
    setSelectedJob(jobItem);
    setFileList([]);
    form.resetFields();
    setApplyModalOpen(true);
  };

  const handleApplySubmit = async () => {
    try {
      const values = await form.validateFields();
      if (fileList.length === 0) {
        notification.error({
          message: "Resume Required",
          description: "Please upload your resume (PDF/DOC).",
          placement: "bottomRight",
        });
        return;
      }
      setSubmitting(true);
      const formData = new FormData();
      formData.append("jobTitle", selectedJob?.title || "General Application");
      formData.append("name", values.name);
      formData.append("email", values.email);
      formData.append("phone", values.phone);
      if (values.experience) formData.append("experience", values.experience);
      if (values.currentOrganization) formData.append("currentOrganization", values.currentOrganization);
      if (values.coverLetter) formData.append("coverLetter", values.coverLetter);
      if (fileList[0]?.originFileObj) {
        formData.append("resume", fileList[0].originFileObj);
      }

      const res = await fetch("/api/public/careers/apply", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        notification.success({
          message: "Application Submitted",
          description: "Thank you for applying! Our hiring team will review your profile.",
          placement: "bottomRight",
        });
        setApplyModalOpen(false);
        form.resetFields();
        setFileList([]);
      } else {
        notification.error({
          message: "Submission Failed",
          description: data.error || "Unable to submit application.",
          placement: "bottomRight",
        });
      }
    } catch (err) {
      if (!err?.errorFields) {
        notification.error({
          message: "Submission Error",
          description: err?.message || "An unexpected error occurred.",
          placement: "bottomRight",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Title fields ── */
  const mainTitle = (props?.mainTitle ?? "").toString().trim();
  const subTitle = (props?.subTitle ?? "").toString().trim();
  const titleEnabled = props?.careersTitleEnabled !== false;
  const subTitleEnabled = props?.careersSubTitleEnabled !== false;
  const titleColorKey = (props?.titleColorKey ?? "").toString().trim();
  const titleColor = titleColorKey
    ? getColor(titleColorKey)
    : getColor("primary");
  const subTitleColorKey = (props?.careersSubTitleColorKey ?? "")
    .toString()
    .trim();
  const subTitleColor = subTitleColorKey
    ? getColor(subTitleColorKey)
    : undefined;

  /* ── Colors ── */
  const jobTitleColorKey = (props?.careersJobTitleColorKey ?? "")
    .toString()
    .trim();
  const jobTitleColor = jobTitleColorKey
    ? getColor(jobTitleColorKey)
    : undefined;
  const metaIconColorKey = (props?.careersMetaIconColorKey ?? "")
    .toString()
    .trim();
  const metaIconColor = metaIconColorKey
    ? getColor(metaIconColorKey)
    : "#8b1a1a";
  const metaTextColorKey = (props?.careersMetaTextColorKey ?? "")
    .toString()
    .trim();
  const metaTextColor = metaTextColorKey
    ? getColor(metaTextColorKey)
    : undefined;
  const btnBgColorKey = (props?.careersBtnBgColorKey ?? "").toString().trim();
  const btnBgColor = btnBgColorKey ? getColor(btnBgColorKey) : "#8b1a1a";
  const btnTextColorKey = (props?.careersBtnTextColorKey ?? "")
    .toString()
    .trim();
  const btnTextColor = btnTextColorKey ? getColor(btnTextColorKey) : "#fff";

  /* ── Items ── */
  const items = Array.isArray(props?.careersItems) ? props.careersItems : [];

  /* ── Section bg ── */
  const PREFIX = "careers";
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

  return (
    <FullWidthBackground className={sectionBgClassName} $managedStyle={sectionBgStyle}>
      <PageContainer $managedStyle={pageContainerBgStyle}>
        <div className="fable-section">
        {(titleEnabled || subTitleEnabled) && (mainTitle || subTitle) && (
          <Row gutter={[16, 16]}>
            <Col span={24} className="mb-4">
              {subTitleEnabled && subTitle && (
                <SubTitle className="fable-eyebrow"
                  style={subTitleColor ? { color: subTitleColor } : undefined}
                >
                  {subTitle}
                </SubTitle>
              )}
              {titleEnabled && mainTitle && (
                <MainTitle className="fable-heading" color={titleColor}>{renderHighlightedTitle(mainTitle, props)}</MainTitle>
              )}
            </Col>
          </Row>
        )}
        <div className="fable-row-list">
        {items.map((item, idx) => {
          const title = (item?.title ?? "").toString().trim();
          const department = (item?.department ?? "").toString().trim();
          const location = (item?.location ?? "").toString().trim();
          const type = (item?.type ?? "").toString().trim();
          const applyUrl = (item?.applyUrl ?? "").toString().trim();
          const btnText = (item?.btnText ?? "Apply Now").toString().trim();
          return (
            <JobCard className="fable-row-link" key={idx}>
              <span className="fable-row-icon" aria-hidden="true">↗</span>
              <JobInfo className="fable-row-copy">
                {title && (
                  <div
                    className="job-title"
                    style={jobTitleColor ? { color: jobTitleColor } : undefined}
                  >
                    {title}
                  </div>
                )}
                <div
                  className="job-meta"
                  style={metaTextColor ? { color: metaTextColor } : undefined}
                >
                  {department && (
                    <span className="job-tag">
                      <svg
                        className="job-tag-icon"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <rect
                          x="2"
                          y="3"
                          width="12"
                          height="10"
                          rx="1.5"
                          stroke={metaIconColor}
                          strokeWidth="1.5"
                          fill="none"
                        />
                        <line
                          x1="5"
                          y1="3"
                          x2="5"
                          y2="13"
                          stroke={metaIconColor}
                          strokeWidth="1"
                        />
                        <line
                          x1="11"
                          y1="3"
                          x2="11"
                          y2="13"
                          stroke={metaIconColor}
                          strokeWidth="1"
                        />
                        <line
                          x1="2"
                          y1="7"
                          x2="14"
                          y2="7"
                          stroke={metaIconColor}
                          strokeWidth="1"
                        />
                      </svg>
                      {department}
                    </span>
                  )}
                  {location && (
                    <span className="job-tag">
                      <svg
                        className="job-tag-icon"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6C3.5 9.5 8 14.5 8 14.5C8 14.5 12.5 9.5 12.5 6C12.5 3.5 10.5 1.5 8 1.5Z"
                          fill={metaIconColor}
                        />
                        <circle cx="8" cy="6" r="2" fill="#fff" />
                      </svg>
                      {location}
                    </span>
                  )}
                  {type && (
                    <span className="job-tag">
                      <svg
                        className="job-tag-icon"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle
                          cx="8"
                          cy="8"
                          r="6"
                          stroke={metaIconColor}
                          strokeWidth="1.5"
                          fill="none"
                        />
                        <path
                          d="M8 4V8L11 10"
                          stroke={metaIconColor}
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                      {type}
                    </span>
                  )}
                </div>
              </JobInfo>
              <ApplyBtn
                as="button"
                type="button"
                style={{
                  background: btnBgColor,
                  color: btnTextColor,
                  cursor: "pointer",
                  border: "none",
                }}
                onClick={() => {
                  if (applyUrl && /^https?:\/\//i.test(applyUrl)) {
                    window.open(applyUrl, "_blank", "noopener,noreferrer");
                  } else {
                    handleOpenApplyModal(item);
                  }
                }}
              >
                {btnText}
              </ApplyBtn>
            </JobCard>
          );
        })}
        </div>
        </div>

        <Modal
          title={`Apply for ${selectedJob?.title || "Position"}`}
          open={applyModalOpen}
          onCancel={() => setApplyModalOpen(false)}
          onOk={handleApplySubmit}
          okText="Submit Application"
          confirmLoading={submitting}
          destroyOnClose
          width={600}
        >
          <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="name"
                  label="Full Name"
                  rules={[{ required: true, message: "Please enter your full name" }]}
                >
                  <Input placeholder="e.g. Sarah Khan" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="email"
                  label="Email Address"
                  rules={[
                    { required: true, message: "Please enter your email" },
                    { type: "email", message: "Please enter a valid email" },
                  ]}
                >
                  <Input placeholder="sarah@example.com" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="phone"
                  label="Phone Number"
                  rules={[{ required: true, message: "Please enter your contact number" }]}
                >
                  <Input placeholder="+91 98765 43210" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="experience" label="Relevant Experience">
                  <Input placeholder="e.g. 3 years" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="currentOrganization" label="Current / Recent Organization">
              <Input placeholder="e.g. ABC Foundation" />
            </Form.Item>

            <Form.Item label="Resume / CV (PDF, DOC, DOCX)" required>
              <Upload
                beforeUpload={() => false}
                fileList={fileList}
                onChange={({ fileList: nextList }) => setFileList(nextList.slice(-1))}
                maxCount={1}
                accept=".pdf,.doc,.docx"
              >
                <Button icon={<UploadOutlined />}>Select Resume File</Button>
              </Upload>
            </Form.Item>

            <Form.Item name="coverLetter" label="Cover Letter / Why MESCO?">
              <Input.TextArea
                rows={3}
                placeholder="Briefly describe your background and interest in this role..."
              />
            </Form.Item>
          </Form>
        </Modal>
      </PageContainer>
    </FullWidthBackground>
  );
}
