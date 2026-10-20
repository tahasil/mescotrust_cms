"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { Collapse, Col, Form, Input, InputNumber, message, Row, Select, Spin } from "antd";
import ManageSectionFields from "@/components/admin/ManageSectionFields";
import TitleAndColorsSection from "@/components/admin/TitleAndColorsSection";
import MediaPickerInput from "@/components/admin/media/MediaPickerInput";
import SortableFormList from "@/components/admin/SortableFormList";
import {
  LINK_TARGET_OPTIONS,
  normalizeTarget,
} from "@/components/appearance/editorUtils";
import {
  getManageSectionInitialValues,
  getManageSectionPayload,
} from "@/lib/manageSectionFields";

const API_PATH = "/api/theme/WelcometoMESCO";
const PREFIX = "welcometoMESCO";

const COLOR_ITEMS = [
  ["welcometoMESCOSubTitleColorKey", "Sub Title"],
  ["welcometoMESCOStatementColorKey", "Statement words"],
  ["welcometoMESCOPrimaryButtonBgColorKey", "MESCO at a Glance background"],
  ["welcometoMESCOPrimaryButtonTextColorKey", "MESCO at a Glance text"],
  ["welcometoMESCOPrimaryButtonBorderColorKey", "MESCO at a Glance border"],
  ["welcometoMESCOPrimaryButtonHoverBgColorKey", "MESCO at a Glance hover background"],
  ["welcometoMESCOPrimaryButtonHoverTextColorKey", "MESCO at a Glance hover text"],
  ["welcometoMESCOPrimaryButtonHoverBorderColorKey", "MESCO at a Glance hover border"],
  ["welcometoMESCOSecondaryLinkColorKey", "Zakat Appeal"],
  ["welcometoMESCOSecondaryLinkHoverColorKey", "Zakat Appeal hover"],
  ["welcometoMESCOEstablishmentLabelColorKey", "Establishment label"],
  ["welcometoMESCOEstablishmentTextColorKey", "Establishment description"],
].map(([name, label]) => ({ name, label, tooltip: `${label} color.` }));

const INITIAL_CONTENT = {
  welcometoMESCOSubTitle: "Welcome to MESCO",
  welcometoMESCOStatementText:
    "A selfless effort for serving mankind. What began in 1968 as a few friends around a table now reaches 15,000 families a year, carrying education, medical aid and dignity from those who want to give to those who need it most.",
  welcometoMESCOPrimaryButtonText: "MESCO at a Glance",
  welcometoMESCOPrimaryButtonLink: "/about-us/mesco-at-glance",
  welcometoMESCOPrimaryButtonTarget: "_self",
  welcometoMESCOSecondaryLinkText: "Zakat Appeal",
  welcometoMESCOSecondaryLinkUrl: "/donate-now",
  welcometoMESCOSecondaryLinkTarget: "_self",
  welcometoMESCOEstablishmentLabel: "Est. 1968",
  welcometoMESCOEstablishmentText: "Charity Commissioner of Mumbai",
  welcometoMESCOInlineImages: [
    {
      imageUrl: "https://mescotrust.org/uploads/142023143119787_1.jpg",
      alt: "Students at their felicitation",
      afterWord: 24,
    },
    {
      imageUrl:
        "https://mescotrust.org/uploads/2632025123339212_webimage1.jpg",
      alt: "A patient receiving medical aid",
      afterWord: 25,
    },
    {
      imageUrl: "https://mescotrust.org/uploads/34202310157525_3.jpg",
      alt: "A woman receiving a sewing machine",
      afterWord: 28,
    },
  ],
};

const COLOR_FIELDS = [
  "welcometoMESCOSubTitleColorKey",
  "welcometoMESCOStatementColorKey",
  "welcometoMESCOPrimaryButtonBgColorKey",
  "welcometoMESCOPrimaryButtonTextColorKey",
  "welcometoMESCOPrimaryButtonBorderColorKey",
  "welcometoMESCOPrimaryButtonHoverBgColorKey",
  "welcometoMESCOPrimaryButtonHoverTextColorKey",
  "welcometoMESCOPrimaryButtonHoverBorderColorKey",
  "welcometoMESCOSecondaryLinkColorKey",
  "welcometoMESCOSecondaryLinkHoverColorKey",
  "welcometoMESCOEstablishmentLabelColorKey",
  "welcometoMESCOEstablishmentTextColorKey",
];

const textValue = (value) => (value == null ? "" : String(value).trim());
const previousSubTitleToken = ["Eye", "brow"].join("");
const previousSubTitleField = (data, suffix = "") =>
  data?.[`welcometoMESCO${previousSubTitleToken}${suffix}`];

function normalizeInlineImages(items) {
  return (Array.isArray(items) ? items : []).map((item) => ({
    imageUrl: textValue(
      item?.imageUrl ?? item?.urlDesktop ?? item?.url ?? item?.src,
    ),
    alt: textValue(item?.alt),
    afterWord: Number.isFinite(Number(item?.afterWord))
      ? Math.max(0, Math.round(Number(item.afterWord)))
      : 0,
  }));
}

function initialValues(data = {}) {
  const primaryTarget = normalizeTarget(
    data.welcometoMESCOPrimaryButtonTarget ??
      (data.welcometoMESCOPrimaryButtonNewTab === true ? "_blank" : "_self"),
  );
  const secondaryTarget = normalizeTarget(
    data.welcometoMESCOSecondaryLinkTarget ??
      (data.welcometoMESCOSecondaryLinkNewTab === true ? "_blank" : "_self"),
  );
  const hasSavedImages = Array.isArray(data.welcometoMESCOInlineImages);
  const savedImages = normalizeInlineImages(data.welcometoMESCOInlineImages);

  return {
    ...INITIAL_CONTENT,
    ...getManageSectionInitialValues(PREFIX, data),
    welcometoMESCOSubTitle:
      data.welcometoMESCOSubTitle != null
        ? textValue(data.welcometoMESCOSubTitle)
        : data.welcomeLabel != null
          ? textValue(data.welcomeLabel)
          : INITIAL_CONTENT.welcometoMESCOSubTitle,
    welcometoMESCOStatementText:
      data.welcometoMESCOStatementText != null
        ? textValue(data.welcometoMESCOStatementText)
        : INITIAL_CONTENT.welcometoMESCOStatementText,
    welcometoMESCOPrimaryButtonText:
      data.welcometoMESCOPrimaryButtonText != null
        ? textValue(data.welcometoMESCOPrimaryButtonText)
        : INITIAL_CONTENT.welcometoMESCOPrimaryButtonText,
    welcometoMESCOPrimaryButtonLink:
      data.welcometoMESCOPrimaryButtonLink != null
        ? textValue(data.welcometoMESCOPrimaryButtonLink)
        : INITIAL_CONTENT.welcometoMESCOPrimaryButtonLink,
    welcometoMESCOPrimaryButtonTarget: primaryTarget,
    welcometoMESCOSecondaryLinkText:
      data.welcometoMESCOSecondaryLinkText != null
        ? textValue(data.welcometoMESCOSecondaryLinkText)
        : data.buttonText != null
          ? textValue(data.buttonText)
          : INITIAL_CONTENT.welcometoMESCOSecondaryLinkText,
    welcometoMESCOSecondaryLinkUrl:
      data.welcometoMESCOSecondaryLinkUrl != null
        ? textValue(data.welcometoMESCOSecondaryLinkUrl)
        : data.buttonLink != null
          ? textValue(data.buttonLink)
          : INITIAL_CONTENT.welcometoMESCOSecondaryLinkUrl,
    welcometoMESCOSecondaryLinkTarget: secondaryTarget,
    welcometoMESCOEstablishmentLabel:
      data.welcometoMESCOEstablishmentLabel != null
        ? textValue(data.welcometoMESCOEstablishmentLabel)
        : INITIAL_CONTENT.welcometoMESCOEstablishmentLabel,
    welcometoMESCOEstablishmentText:
      data.welcometoMESCOEstablishmentText != null
        ? textValue(data.welcometoMESCOEstablishmentText)
        : INITIAL_CONTENT.welcometoMESCOEstablishmentText,
    welcometoMESCOInlineImages:
      hasSavedImages
        ? savedImages
        : INITIAL_CONTENT.welcometoMESCOInlineImages,
    ...Object.fromEntries(
      COLOR_FIELDS.map((key) => [
        key,
        textValue(
          data[key] ??
            (key === "welcometoMESCOSubTitleColorKey"
              ? previousSubTitleField(data, "ColorKey")
              : ""),
        ),
      ]),
    ),
  };
}

function WelcometoMESCOEditForm(
  {
    source,
    initialData: initialDataProp,
    onSaveToPage,
    onSuccess,
    themeColorOptions: providedColors = [],
  },
  ref,
) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [colors, setColors] = useState(providedColors);
  const isPageBlock = source === "page";

  useEffect(() => {
    if (providedColors.length) setColors(providedColors);
  }, [providedColors]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function load() {
      const data = isPageBlock
        ? initialDataProp || {}
        : await fetch(API_PATH, { cache: "no-store" }).then((response) =>
            response.ok ? response.json() : {},
          );
      const theme = providedColors.length
        ? {}
        : await fetch("/api/theme", { cache: "no-store" })
            .then((response) => (response.ok ? response.json() : {}))
            .catch(() => ({}));
      if (cancelled) return;

      if (!providedColors.length) {
        const names = [
          ...new Set([
            ...Object.keys(theme?.themePalette || {}),
            ...(Array.isArray(theme?.colors)
              ? theme.colors.map((item) => item?.name).filter(Boolean)
              : []),
          ]),
        ].sort();
        setColors(names.map((name) => ({ label: name, value: name })));
      }
      form.setFieldsValue(initialValues(data));
    }

    load()
      .catch(() => message.error("Failed to load Welcome to MESCO"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [form, initialDataProp, isPageBlock, providedColors.length]);

  const update = async () => {
    const values = await form.validateFields();
    const payload = {
      ...values,
      ...getManageSectionPayload(PREFIX, values),
      welcometoMESCOSubTitle: textValue(values.welcometoMESCOSubTitle),
      welcometoMESCOStatementText: textValue(
        values.welcometoMESCOStatementText,
      ),
      welcometoMESCOPrimaryButtonText: textValue(
        values.welcometoMESCOPrimaryButtonText,
      ),
      welcometoMESCOPrimaryButtonLink: textValue(
        values.welcometoMESCOPrimaryButtonLink,
      ),
      welcometoMESCOPrimaryButtonTarget: normalizeTarget(
        values.welcometoMESCOPrimaryButtonTarget,
      ),
      welcometoMESCOSecondaryLinkText: textValue(
        values.welcometoMESCOSecondaryLinkText,
      ),
      welcometoMESCOSecondaryLinkUrl: textValue(
        values.welcometoMESCOSecondaryLinkUrl,
      ),
      welcometoMESCOSecondaryLinkTarget: normalizeTarget(
        values.welcometoMESCOSecondaryLinkTarget,
      ),
      welcometoMESCOEstablishmentLabel: textValue(
        values.welcometoMESCOEstablishmentLabel,
      ),
      welcometoMESCOEstablishmentText: textValue(
        values.welcometoMESCOEstablishmentText,
      ),
      welcometoMESCOInlineImages: normalizeInlineImages(
        values.welcometoMESCOInlineImages,
      ),
    };

    if (isPageBlock && onSaveToPage) {
      onSaveToPage(payload);
      message.success("Component updated. Click the page Save button to persist changes.");
      onSuccess?.();
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(API_PATH, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw await response.json();
      message.success("Welcome to MESCO saved");
      onSuccess?.();
    } catch (error) {
      message.error(error?.error || "Failed to save Welcome to MESCO");
    } finally {
      setSaving(false);
    }
  };

  useImperativeHandle(ref, () => ({ update }), [
    form,
    isPageBlock,
    onSaveToPage,
    onSuccess,
  ]);

  if (loading || saving) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <Spin />
      </div>
    );
  }

  return (
    <Form form={form} layout="vertical">
      <Collapse
        defaultActiveKey={["content", "inline-images", "buttons"]}
        items={[
          {
            key: "section",
            label: "Manage Section",
            children: (
              <ManageSectionFields
                prefix={PREFIX}
                form={form}
                themeColorOptions={colors}
              />
            ),
          },
          {
            key: "content",
            label: "Statement Content",
            children: (
              <>
                <Form.Item
                  name="welcometoMESCOEstablishmentLabel"
                  label="Establishment label"
                >
                  <Input placeholder="Est. 1968" />
                </Form.Item>
                <Form.Item
                  name="welcometoMESCOEstablishmentText"
                  label="Establishment description"
                >
                  <Input placeholder="Charity Commissioner of Mumbai" />
                </Form.Item>
              </>
            ),
          },
          {
            key: "inline-images",
            label: "Inline Photo Chips",
            children: (
              <Form.List name="welcometoMESCOInlineImages">
                {(fields, { add, remove, move }) => (
                  <SortableFormList
                    fields={fields}
                    add={add}
                    remove={remove}
                    move={move}
                    itemLabel="Photo chip"
                    addButtonText="Add photo chip"
                    defaultAddPayload={{ imageUrl: "", alt: "", afterWord: 0 }}
                    renderItemContent={(name, restField) => (
                      <Row gutter={16}>
                        <Col span={24}>
                          <Form.Item
                            {...restField}
                            name={[name, "imageUrl"]}
                            label="Image"
                            rules={[{ required: true, message: "Image is required" }]}
                          >
                            <MediaPickerInput
                              uiVariant="stacked"
                              hintText="Recommended: landscape image suitable for a small pill crop"
                            />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item
                            {...restField}
                            name={[name, "alt"]}
                            label="Alternative text"
                          >
                            <Input />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item
                            {...restField}
                            name={[name, "afterWord"]}
                            label="Insert after word number"
                            tooltip="Words are counted from 1 in the statement above."
                          >
                            <InputNumber min={0} precision={0} style={{ width: "100%" }} />
                          </Form.Item>
                        </Col>
                      </Row>
                    )}
                  />
                )}
              </Form.List>
            ),
          },
          {
            key: "buttons",
            label: "Buttons",
            children: (
              <>
                <Form.Item
                  name="welcometoMESCOPrimaryButtonText"
                  label="MESCO at a Glance label"
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  name="welcometoMESCOPrimaryButtonLink"
                  label="MESCO at a Glance URL"
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  name="welcometoMESCOPrimaryButtonTarget"
                  label="MESCO at a Glance target"
                >
                  <Select options={LINK_TARGET_OPTIONS} />
                </Form.Item>
                <Form.Item
                  name="welcometoMESCOSecondaryLinkText"
                  label="Zakat Appeal label"
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  name="welcometoMESCOSecondaryLinkUrl"
                  label="Zakat Appeal URL"
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  name="welcometoMESCOSecondaryLinkTarget"
                  label="Zakat Appeal target"
                >
                  <Select options={LINK_TARGET_OPTIONS} />
                </Form.Item>
              </>
            ),
          },
          {
            key: "title-colors",
            label: "Title & Colors",
            children: (
              <TitleAndColorsSection
                form={form}
                themeColorOptions={colors}
                {...getTitleAndColorsConfig("WelcometoMESCO")}
              />
            ),
          },
        ]}
      />
    </Form>
  );
}

export default forwardRef(WelcometoMESCOEditForm);
