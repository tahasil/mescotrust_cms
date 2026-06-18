"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, Button, InputNumber, Modal, Slider, Space, Typography } from "antd";
import Cropper from "react-easy-crop";
import { parsePositiveIntOrNull } from "./rasterMedia";
import styles from "./AdminMediaLibrary.module.css";

function createObjectUrl(file) {
  if (!file) return "";
  try {
    return URL.createObjectURL(file);
  } catch {
    return "";
  }
}

function loadImageDimensions(src) {
  return new Promise((resolve, reject) => {
    if (!src) {
      reject(new Error("Image source not found"));
      return;
    }
    const image = new window.Image();
    image.onload = () =>
      resolve({
        width: Number(image.naturalWidth) || 0,
        height: Number(image.naturalHeight) || 0,
      });
    image.onerror = () => reject(new Error("Failed to read image dimensions"));
    image.src = src;
  });
}

function renderCropPreview({ src, cropPixels, width, height, mimeType }) {
  return new Promise((resolve, reject) => {
    if (!src || !cropPixels || !width || !height) {
      reject(new Error("Preview input missing"));
      return;
    }
    const image = new window.Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Preview context unavailable"));
        return;
      }
      context.drawImage(
        image,
        cropPixels.x,
        cropPixels.y,
        cropPixels.width,
        cropPixels.height,
        0,
        0,
        width,
        height,
      );
      const targetMime = String(mimeType || "").includes("png") ? "image/png" : "image/jpeg";
      resolve(canvas.toDataURL(targetMime, 0.92));
    };
    image.onerror = () => reject(new Error("Preview render failed"));
    image.src = src;
  });
}

function toCropPayload(croppedPixels) {
  if (!croppedPixels) return null;
  const x = Math.round(Number(croppedPixels.x) || 0);
  const y = Math.round(Number(croppedPixels.y) || 0);
  const width = Math.round(Number(croppedPixels.width) || 0);
  const height = Math.round(Number(croppedPixels.height) || 0);
  if (width <= 0 || height <= 0) return null;
  return { x, y, width, height };
}

export default function RasterCropConfirmModal({
  open,
  file,
  title = "Crop image before upload",
  confirmText = "Confirm crop",
  onCancel,
  onConfirm,
}) {
  const [imageUrl, setImageUrl] = useState("");
  const [sourceWidth, setSourceWidth] = useState(0);
  const [sourceHeight, setSourceHeight] = useState(0);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [widthInput, setWidthInput] = useState(null);
  const [heightInput, setHeightInput] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewError, setPreviewError] = useState("");

  useEffect(() => {
    if (!open || !file) return;
    const nextUrl = createObjectUrl(file);
    setImageUrl(nextUrl);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setWidthInput(null);
    setHeightInput(null);
    setPreviewUrl("");
    setPreviewError("");
    loadImageDimensions(nextUrl)
      .then((size) => {
        setSourceWidth(size.width);
        setSourceHeight(size.height);
      })
      .catch((err) => {
        setSourceWidth(0);
        setSourceHeight(0);
        setPreviewError(err.message || "Failed to read image");
      });
    return () => {
      if (nextUrl) URL.revokeObjectURL(nextUrl);
    };
  }, [open, file]);

  const parsedWidth = useMemo(() => parsePositiveIntOrNull(widthInput), [widthInput]);
  const parsedHeight = useMemo(() => parsePositiveIntOrNull(heightInput), [heightInput]);
  const hasWidth = parsedWidth !== null;
  const hasHeight = parsedHeight !== null;

  const aspect = useMemo(() => {
    if (Number.isFinite(parsedWidth) && Number.isFinite(parsedHeight)) {
      return parsedWidth / parsedHeight;
    }
    return undefined;
  }, [parsedWidth, parsedHeight]);

  const cropPayload = useMemo(() => toCropPayload(croppedAreaPixels), [croppedAreaPixels]);

  const validationError = useMemo(() => {
    if (!cropPayload) return "Select a crop area to continue.";
    if (hasWidth !== hasHeight) return "Width and height must be set together.";
    if (
      (hasWidth && !Number.isFinite(parsedWidth)) ||
      (hasHeight && !Number.isFinite(parsedHeight))
    ) {
      return "Width and height must be positive integers.";
    }
    if (Number.isFinite(parsedWidth) && Number.isFinite(parsedHeight)) {
      if (parsedWidth > sourceWidth || parsedHeight > sourceHeight) {
        return "Width and height must be less than or equal to source dimensions.";
      }
    }
    return "";
  }, [
    cropPayload,
    hasWidth,
    hasHeight,
    parsedWidth,
    parsedHeight,
    sourceWidth,
    sourceHeight,
  ]);

  const finalWidth =
    Number.isFinite(parsedWidth) && Number.isFinite(parsedHeight)
      ? parsedWidth
      : cropPayload?.width || 0;
  const finalHeight =
    Number.isFinite(parsedWidth) && Number.isFinite(parsedHeight)
      ? parsedHeight
      : cropPayload?.height || 0;

  useEffect(() => {
    let cancelled = false;
    setPreviewError("");
    if (!open || !imageUrl || !cropPayload || !finalWidth || !finalHeight) {
      setPreviewUrl("");
      return () => {
        cancelled = true;
      };
    }
    renderCropPreview({
      src: imageUrl,
      cropPixels: cropPayload,
      width: finalWidth,
      height: finalHeight,
      mimeType: file?.type,
    })
      .then((nextPreviewUrl) => {
        if (!cancelled) setPreviewUrl(nextPreviewUrl);
      })
      .catch((err) => {
        if (!cancelled) {
          setPreviewUrl("");
          setPreviewError(err.message || "Unable to render preview");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, imageUrl, cropPayload, finalWidth, finalHeight, file?.type]);

  const handleConfirm = () => {
    if (validationError || !cropPayload) return;
    onConfirm?.({
      crop: cropPayload,
      width: Number.isFinite(parsedWidth) ? parsedWidth : null,
      height: Number.isFinite(parsedHeight) ? parsedHeight : null,
      finalWidth,
      finalHeight,
    });
  };

  return (
    <Modal
      open={open}
      title={title}
      onCancel={onCancel}
      width={980}
      destroyOnClose
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button
          key="confirm"
          type="primary"
          onClick={handleConfirm}
          disabled={Boolean(validationError)}
        >
          {confirmText}
        </Button>,
      ]}
    >
      <div className={styles.cropModalBody}>
        <div className={styles.cropModalGrid}>
          <div>
            <div className={styles.cropEditor}>
              {imageUrl ? (
                <Cropper
                  image={imageUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={aspect}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
                  minZoom={1}
                  maxZoom={4}
                  restrictPosition={false}
                />
              ) : null}
            </div>

            <div className={styles.cropControls}>
              <div className={styles.cropControlItem}>
                <Typography.Text>Zoom</Typography.Text>
                <Slider
                  min={1}
                  max={4}
                  step={0.01}
                  value={zoom}
                  onChange={setZoom}
                  tooltip={{ formatter: (value) => `${Number(value || 1).toFixed(2)}x` }}
                />
              </div>
            </div>
          </div>

          <div className={styles.cropPreviewPanel}>
            <Typography.Text strong>Output settings</Typography.Text>
            <Space size={8} wrap>
              <InputNumber
                min={1}
                controls={false}
                placeholder="Width"
                value={widthInput}
                onChange={setWidthInput}
              />
              <InputNumber
                min={1}
                controls={false}
                placeholder="Height"
                value={heightInput}
                onChange={setHeightInput}
              />
            </Space>
            <Typography.Text type="secondary">
              Enter both width and height to lock aspect ratio. Leave both empty to use crop
              area dimensions.
            </Typography.Text>

            <div className={styles.cropMetaBlock}>
              <div>
                <Typography.Text type="secondary">Source</Typography.Text>
                <div>
                  {sourceWidth || 0} x {sourceHeight || 0}
                </div>
              </div>
              <div>
                <Typography.Text type="secondary">Final output</Typography.Text>
                <div>
                  {finalWidth || 0} x {finalHeight || 0}
                </div>
              </div>
            </div>

            <Typography.Text strong>Preview</Typography.Text>
            <div className={styles.cropPreviewFrame}>
              {previewUrl ? (
                <img src={previewUrl} alt="Crop preview" className={styles.cropPreviewImage} />
              ) : (
                <Typography.Text type="secondary">Preview will appear after crop selection.</Typography.Text>
              )}
            </div>

            {previewError ? <Alert type="warning" showIcon message={previewError} /> : null}
            {validationError ? <Alert type="error" showIcon message={validationError} /> : null}
          </div>
        </div>
      </div>
    </Modal>
  );
}
