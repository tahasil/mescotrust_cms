"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Form,
  Input,
  Button,
  Card,
  Collapse,
  Select,
  Row,
  Col,
  Drawer,
  Space,
  Tag,
  Typography,
  message,
  Spin,
} from "antd";
import {
  ArrowLeftOutlined,
  SaveOutlined,
  EditOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import styled from "styled-components";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import SortableFormList from "@/components/admin/SortableFormList";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import TeamEmbed from "@/components/site/TeamEmbed/TeamEmbed";
import {
  getManageSectionInitialValues,
  getManageSectionPayload,
} from "@/lib/manageSectionFields";
import { getTitleAndColorsConfig } from "@/lib/titleAndColorsConfig";

const PREFIX = "committeeMembers";
const REQUIRED_DESKTOP_IMAGE_WIDTH = 290;
const REQUIRED_DESKTOP_IMAGE_HEIGHT = 400;
const REQUIRED_DESKTOP_IMAGE_TEXT = `${REQUIRED_DESKTOP_IMAGE_WIDTH} \u00D7 ${REQUIRED_DESKTOP_IMAGE_HEIGHT} px`;

const TopActionBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  padding: 16px 24px;
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  flex-wrap: wrap;
  gap: 12px;

  .left-section {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .back-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 15px;
    font-weight: 600;
    color: #1f2937;
    text-decoration: none;
    transition: color 0.2s ease;
    &:hover {
      color: #1677ff;
    }
  }

  .right-section {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
`;

const ShortcodeBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  padding: 4px 12px;
  border-radius: 6px;
  font-family: monospace;
  font-size: 13px;
  color: #374151;
`;

const PreviewWrapper = styled.div`
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #f0f0f0;
  min-height: 400px;
`;

function getImageDimensions(imageUrl) {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () =>
      resolve({
        width: Number(image.naturalWidth) || 0,
        height: Number(image.naturalHeight) || 0,
      });
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = imageUrl;
  });
}

async function validateDesktopImageDimensions(_, value) {
  const imageUrl = String(value || "").trim();
  if (!imageUrl) return Promise.resolve();

  try {
    const { width, height } = await getImageDimensions(imageUrl);
    if (
      width === REQUIRED_DESKTOP_IMAGE_WIDTH &&
      height === REQUIRED_DESKTOP_IMAGE_HEIGHT
    ) {
      return Promise.resolve();
    }
    return Promise.reject(
      new Error(
        `Desktop Image must be exactly ${REQUIRED_DESKTOP_IMAGE_TEXT}. Selected image is ${width} \u00D7 ${height} px.`,
      ),
    );
  } catch {
    return Promise.reject(
      new Error(
        `Unable to validate desktop image size. Please select an image of ${REQUIRED_DESKTOP_IMAGE_TEXT}.`,
      ),
    );
  }
}

function normalizeMember(it) {
  const desktopImage =
    it?.imageDesktop != null
      ? String(it.imageDesktop).trim()
      : it?.image != null
        ? String(it.image).trim()
        : "";
  const mobileImage =
    it?.imageMobile != null ? String(it.imageMobile).trim() : "";
  return {
    name: it?.name != null ? String(it.name).trim() : "",
    qualification:
      it?.qualification != null ? String(it.qualification).trim() : "",
    title: it?.title != null ? String(it.title).trim() : "",
    imageDesktop: desktopImage,
    imageMobile: mobileImage,
    image: desktopImage,
    bio: it?.bio != null ? String(it.bio).trim() : "",
    order: Number(it?.order) || 0,
  };
}

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminTeamEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [team, setTeam] = useState(null);
  const [themeColorOptions, setThemeColorOptions] = useState([]);
  const [form] = Form.useForm();

  const [reorderMovedIndex, setReorderMovedIndex] = useState(-1);
  const [reorderDirection, setReorderDirection] = useState(null);

  const fetchThemeColors = useCallback(async () => {
    try {
      const res = await fetch("/api/theme", { cache: "no-store" });
      if (!res.ok) return;
      const theme = await res.json();
      const palette = theme?.themePalette || {};
      const customColors = Array.isArray(theme?.colors) ? theme.colors : [];
      const names = [
        ...new Set([
          ...Object.keys(palette),
          ...customColors.map((c) => c?.name).filter(Boolean),
        ]),
      ].sort();
      setThemeColorOptions(names.map((name) => ({ label: name, value: name })));
    } catch {
      // ignore
    }
  }, []);

  const populateForm = useCallback(
    (data) => {
      const members =
        Array.isArray(data?.members) && data.members.length > 0
          ? data.members.map(normalizeMember)
          : Array.isArray(data?.committeeMembersItems) &&
              data.committeeMembersItems.length > 0
            ? data.committeeMembersItems.map(normalizeMember)
            : [normalizeMember({})];

      const manageSectionData = {
        [PREFIX + "SectionBgType"]:
          data?.sectionBgType || data?.committeeMembersSectionBgType,
        [PREFIX + "SectionBgImage"]:
          data?.sectionBgImage || data?.committeeMembersSectionBgImage,
        [PREFIX + "SectionBgColorKey"]:
          data?.sectionBgColorKey || data?.committeeMembersSectionBgColorKey,
        [PREFIX + "SectionPaddingTop"]:
          data?.sectionPaddingTop ?? data?.committeeMembersSectionPaddingTop,
        [PREFIX + "SectionPaddingBottom"]:
          data?.sectionPaddingBottom ??
          data?.committeeMembersSectionPaddingBottom,
        [PREFIX + "SectionMarginTop"]:
          data?.sectionMarginTop ?? data?.committeeMembersSectionMarginTop,
        [PREFIX + "SectionMarginBottom"]:
          data?.sectionMarginBottom ??
          data?.committeeMembersSectionMarginBottom,
        [PREFIX + "PageContainerBgType"]:
          data?.pageContainerBgType || data?.committeeMembersPageContainerBgType,
        [PREFIX + "PageContainerBgImage"]:
          data?.pageContainerBgImage ||
          data?.committeeMembersPageContainerBgImage,
        [PREFIX + "PageContainerBgColorKey"]:
          data?.pageContainerBgColorKey ||
          data?.committeeMembersPageContainerBgColorKey,
        [PREFIX + "PageContainerPaddingTop"]:
          data?.containerPaddingTop ??
          data?.committeeMembersContainerPaddingTop,
        [PREFIX + "PageContainerPaddingRight"]:
          data?.containerPaddingRight ??
          data?.committeeMembersContainerPaddingRight,
        [PREFIX + "PageContainerPaddingBottom"]:
          data?.containerPaddingBottom ??
          data?.committeeMembersContainerPaddingBottom,
        [PREFIX + "PageContainerPaddingLeft"]:
          data?.containerPaddingLeft ??
          data?.committeeMembersContainerPaddingLeft,
        [PREFIX + "PageContainerMarginTop"]:
          data?.containerMarginTop ??
          data?.committeeMembersContainerMarginTop,
        [PREFIX + "PageContainerMarginBottom"]:
          data?.containerMarginBottom ??
          data?.committeeMembersContainerMarginBottom,
      };

      form.setFieldsValue({
        name: data?.name || "Team",
        shortcode: data?.shortcode || "",
        status: data?.status || "published",
        description: data?.description || "",
        committeeMembersSubTitle:
          data?.subTitle ?? data?.committeeMembersSubTitle ?? "",
        committeeMembersMainTitle:
          data?.mainTitle ??
          data?.committeeMembersMainTitle ??
          data?.name ??
          "Committee Members",
        committeeMembersSubTitleColorKey:
          data?.subTitleColorKey ??
          data?.committeeMembersSubTitleColorKey ??
          "",
        committeeMembersTitleColorKey:
          data?.titleColorKey ?? data?.committeeMembersTitleColorKey ?? "",
        committeeMembersCardTitleColorKey:
          data?.cardTitleColorKey ??
          data?.committeeMembersCardTitleColorKey ??
          "",
        committeeMembersCardDescriptionColorKey:
          data?.cardDescriptionColorKey ??
          data?.committeeMembersCardDescriptionColorKey ??
          "",
        committeeMembersButtonBgColorKey:
          data?.buttonBgColorKey ??
          data?.committeeMembersButtonBgColorKey ??
          "",
        committeeMembersButtonTextColorKey:
          data?.buttonTextColorKey ??
          data?.committeeMembersButtonTextColorKey ??
          "",
        committeeMembersButtonBorderColorKey:
          data?.buttonBorderColorKey ??
          data?.committeeMembersButtonBorderColorKey ??
          "",
        committeeMembersButtonHoverBgColorKey:
          data?.buttonHoverBgColorKey ??
          data?.committeeMembersButtonHoverBgColorKey ??
          "",
        committeeMembersButtonHoverTextColorKey:
          data?.buttonHoverTextColorKey ??
          data?.committeeMembersButtonHoverTextColorKey ??
          "",
        committeeMembersButtonHoverBorderColorKey:
          data?.buttonHoverBorderColorKey ??
          data?.committeeMembersButtonHoverBorderColorKey ??
          "",
        committeeMembersModalBgColorKey:
          data?.modalBgColorKey ??
          data?.committeeMembersModalBgColorKey ??
          "",
        committeeMembersModalNameColorKey:
          data?.modalNameColorKey ??
          data?.committeeMembersModalNameColorKey ??
          "",
        committeeMembersModalQualificationColorKey:
          data?.modalQualificationColorKey ??
          data?.committeeMembersModalQualificationColorKey ??
          "",
        committeeMembersModalRoleColorKey:
          data?.modalRoleColorKey ??
          data?.committeeMembersModalRoleColorKey ??
          "",
        committeeMembersModalBioColorKey:
          data?.modalBioColorKey ??
          data?.committeeMembersModalBioColorKey ??
          "",
        committeeMembersModalDividerColorKey:
          data?.modalDividerColorKey ??
          data?.committeeMembersModalDividerColorKey ??
          "",
        committeeMembersModalImageBorderColorKey:
          data?.modalImageBorderColorKey ??
          data?.committeeMembersModalImageBorderColorKey ??
          "",
        committeeMembersItems: members,
        ...getManageSectionInitialValues(PREFIX, manageSectionData),
      });
    },
    [form],
  );

  const fetchTeam = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/teams/${encodeURIComponent(id)}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to load team");
      setTeam(data);
      populateForm(data);
    } catch (err) {
      message.error(err?.message || "Failed to load team");
      router.push("/admin/team");
    } finally {
      setLoading(false);
    }
  }, [id, populateForm, router]);

  useEffect(() => {
    fetchThemeColors();
    fetchTeam();
  }, [fetchTeam, fetchThemeColors]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const manageSection = getManageSectionPayload(PREFIX, values);

      const members = (values.committeeMembersItems || [])
        .map(normalizeMember)
        .filter((m) => m.name)
        .map((m, idx) => ({ ...m, order: idx + 1 }));

      const payload = {
        name: values.name?.trim(),
        shortcode: slugify(values.shortcode || values.name),
        status: values.status || "published",
        description: values.description?.trim() || "",

        subTitle: values.committeeMembersSubTitle ?? "",
        mainTitle: values.committeeMembersMainTitle ?? values.name,
        subTitleColorKey: values.committeeMembersSubTitleColorKey ?? "",
        titleColorKey: values.committeeMembersTitleColorKey ?? "",
        cardTitleColorKey: values.committeeMembersCardTitleColorKey ?? "",
        cardDescriptionColorKey:
          values.committeeMembersCardDescriptionColorKey ?? "",
        buttonBgColorKey: values.committeeMembersButtonBgColorKey ?? "",
        buttonTextColorKey: values.committeeMembersButtonTextColorKey ?? "",
        buttonBorderColorKey: values.committeeMembersButtonBorderColorKey ?? "",
        buttonHoverBgColorKey:
          values.committeeMembersButtonHoverBgColorKey ?? "",
        buttonHoverTextColorKey:
          values.committeeMembersButtonHoverTextColorKey ?? "",
        buttonHoverBorderColorKey:
          values.committeeMembersButtonHoverBorderColorKey ?? "",
        modalBgColorKey: values.committeeMembersModalBgColorKey ?? "",
        modalNameColorKey: values.committeeMembersModalNameColorKey ?? "",
        modalQualificationColorKey:
          values.committeeMembersModalQualificationColorKey ?? "",
        modalRoleColorKey: values.committeeMembersModalRoleColorKey ?? "",
        modalBioColorKey: values.committeeMembersModalBioColorKey ?? "",
        modalDividerColorKey: values.committeeMembersModalDividerColorKey ?? "",
        modalImageBorderColorKey:
          values.committeeMembersModalImageBorderColorKey ?? "",

        // Manage Section
        sectionBgType: manageSection[PREFIX + "SectionBgType"],
        sectionBgImage: manageSection[PREFIX + "SectionBgImage"],
        sectionBgColorKey: manageSection[PREFIX + "SectionBgColorKey"],
        sectionPaddingTop: manageSection[PREFIX + "SectionPaddingTop"],
        sectionPaddingBottom: manageSection[PREFIX + "SectionPaddingBottom"],
        sectionMarginTop: manageSection[PREFIX + "SectionMarginTop"],
        sectionMarginBottom: manageSection[PREFIX + "SectionMarginBottom"],

        pageContainerBgType: manageSection[PREFIX + "PageContainerBgType"],
        pageContainerBgImage: manageSection[PREFIX + "PageContainerBgImage"],
        pageContainerBgColorKey:
          manageSection[PREFIX + "PageContainerBgColorKey"],
        containerPaddingTop:
          manageSection[PREFIX + "PageContainerPaddingTop"],
        containerPaddingRight:
          manageSection[PREFIX + "PageContainerPaddingRight"],
        containerPaddingBottom:
          manageSection[PREFIX + "PageContainerPaddingBottom"],
        containerPaddingLeft:
          manageSection[PREFIX + "PageContainerPaddingLeft"],
        containerMarginTop:
          manageSection[PREFIX + "PageContainerMarginTop"],
        containerMarginBottom:
          manageSection[PREFIX + "PageContainerMarginBottom"],

        members,
      };

      const res = await fetch(`/api/admin/teams/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const updated = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(updated?.error || "Failed to save team");

      message.success("Team saved successfully");
      setTeam(updated);
      populateForm(updated);
      setDrawerOpen(false);
    } catch (err) {
      if (err?.errorFields) {
        message.error("Please fill in all required fields");
      } else {
        message.error(err?.message || "Failed to save team");
      }
    } finally {
      setSaving(false);
    }
  };

  const shortcodeString = `[shortcode="${team?.shortcode || ""}"]`;

  if (loading) {
    return (
      <div style={{ padding: 80, textAlign: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: "0 0 40px" }}>
      {/* Top Bar */}
      <TopActionBar>
        <div className="left-section">
          <Link href="/admin/team" className="back-btn">
            <ArrowLeftOutlined /> Team
          </Link>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {team?.name || "Team"}
          </Typography.Title>
          <Tag color={team?.status === "published" ? "green" : "orange"}>
            {String(team?.status || "published").toUpperCase()}
          </Tag>
        </div>

        <div className="right-section">
          <ShortcodeBadge>
            <span>{shortcodeString}</span>
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              title="Copy Shortcode"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(shortcodeString);
                  message.success("Shortcode copied to clipboard");
                } catch {
                  message.error("Failed to copy shortcode");
                }
              }}
            />
          </ShortcodeBadge>

          <Button
            type="default"
            icon={<EditOutlined />}
            onClick={() => setDrawerOpen(true)}
            size="middle"
          >
            Edit
          </Button>

          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            onClick={handleSave}
            size="middle"
          >
            Save
          </Button>
        </div>
      </TopActionBar>

      {/* Live Preview Area */}
      <PreviewWrapper>
        <TeamEmbed initialTeam={team} />
      </PreviewWrapper>

      {/* Edit Drawer */}
      <Drawer
        title={`Edit Team: ${team?.name || ""}`}
        placement="right"
        width={720}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={saving}
              onClick={handleSave}
            >
              Update
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Card title="Team Settings" size="small" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="Team Name"
                  rules={[{ required: true, message: "Team name is required" }]}
                >
                  <Input placeholder="e.g. Committee Members" size="large" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="shortcode"
                  label="Shortcode Slug"
                  rules={[
                    { required: true, message: "Shortcode slug is required" },
                  ]}
                  tooltip="Used in [shortcode='slug'] on pages"
                >
                  <Input placeholder="e.g. committee-members" size="large" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="status" label="Status">
                  <Select
                    options={[
                      { value: "published", label: "Published" },
                      { value: "draft", label: "Draft" },
                      { value: "archived", label: "Archived" },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="description" label="Description / Internal Notes">
                  <Input placeholder="Optional internal team description" />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Collapse
            defaultActiveKey={["members", "title-colors", "manage-section"]}
            items={[
              {
                key: "manage-section",
                label: "Manage Section",
                children: (
                  <ManageSectionFields
                    prefix={PREFIX}
                    form={form}
                    themeColorOptions={themeColorOptions}
                  />
                ),
              },
              {
                key: "title-colors",
                label: "Title & Colors",
                children: (
                  <TitleAndColorsSection
                    form={form}
                    themeColorOptions={themeColorOptions}
                    {...getTitleAndColorsConfig("CommitteeMembers")}
                  />
                ),
              },
              {
                key: "members",
                label: "Manage Members",
                children: (
                  <Form.List name="committeeMembersItems">
                    {(fields, { add, remove, move }) => (
                      <SortableFormList
                        fields={fields}
                        add={add}
                        remove={remove}
                        move={move}
                        itemLabel="Member"
                        addButtonText="Add member"
                        defaultAddPayload={normalizeMember({})}
                        reorderMovedIndex={reorderMovedIndex}
                        reorderDirection={reorderDirection}
                        onMoveWithTransition={(from, to) => {
                          setReorderDirection(to < from ? "up" : "down");
                          setReorderMovedIndex(to);
                          setTimeout(() => setReorderMovedIndex(-1), 400);
                        }}
                        renderItemContent={(name, restField) => (
                          <Row gutter={[16, 16]}>
                            <Col span={24}>
                              <Form.Item
                                {...restField}
                                name={[name, "name"]}
                                label="Name"
                                rules={[
                                  {
                                    required: true,
                                    message: "Name is required",
                                  },
                                ]}
                              >
                                <Input
                                  placeholder="e.g. Prof. M. Farhaan Makba"
                                  size="large"
                                />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                {...restField}
                                name={[name, "qualification"]}
                                label="Qualification"
                              >
                                <Input placeholder="e.g. M.Sc., PGDME" />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                {...restField}
                                name={[name, "title"]}
                                label="Title / Role"
                              >
                                <Input placeholder="e.g. President" />
                              </Form.Item>
                            </Col>
                            <Col span={24}>
                              <Form.Item
                                {...restField}
                                name={[name, "imageDesktop"]}
                                label="Desktop Image"
                                validateTrigger={["onChange", "onBlur"]}
                                rules={[
                                  {
                                    validator:
                                      validateDesktopImageDimensions,
                                  },
                                ]}
                              >
                                <MediaPickerInput
                                  placeholder="/images/members-1.png"
                                  uiVariant="stacked"
                                  hintText={`Required size: ${REQUIRED_DESKTOP_IMAGE_TEXT}`}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={24}>
                              <Form.Item
                                {...restField}
                                name={[name, "imageMobile"]}
                                label="Mobile Image"
                              >
                                <MediaPickerInput
                                  placeholder="/images/members-1-mobile.png"
                                  uiVariant="stacked"
                                  hintText="Optional. Desktop image will be used if empty."
                                />
                              </Form.Item>
                            </Col>
                            <Col span={24}>
                              <Form.Item
                                {...restField}
                                name={[name, "bio"]}
                                label="Bio"
                              >
                                <Input.TextArea
                                  placeholder="Short biography..."
                                  rows={3}
                                />
                              </Form.Item>
                            </Col>
                          </Row>
                        )}
                      />
                    )}
                  </Form.List>
                ),
              },
            ]}
          />
        </Form>
      </Drawer>
    </div>
  );
}
