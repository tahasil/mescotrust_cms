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

function getRadianAngle(degreeValue) {
  return (Number(degreeValue || 0) * Math.PI) / 180;
}

function rotateSize(width, height, rotation) {
  const rotRad = getRadianAngle(rotation);
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

function normalizeRotationDegrees(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  const wrapped = ((numeric % 360) + 360) % 360;
  return Number(wrapped.toFixed(2));
}

function renderCropPreview({ src, cropPixels, width, height, rotation, mimeType }) {
  return new Promise((resolve, reject) => {
    if (!src || !cropPixels || !width || !height) {
      reject(new Error("Preview input missing"));
      return;
    }
    const image = new window.Image();
    image.onload = () => {
      const rotatedCanvas = document.createElement("canvas");
      const { width: rotatedWidth, height: rotatedHeight } = rotateSize(
        image.width,
        image.height,
        rotation,
      );
      rotatedCanvas.width = Math.max(1, Math.floor(rotatedWidth));
      rotatedCanvas.height = Math.max(1, Math.floor(rotatedHeight));
      const rotatedContext = rotatedCanvas.getContext("2d");
      if (!rotatedContext) {
        reject(new Error("Preview context unavailable"));
        return;
      }

      rotatedContext.translate(rotatedCanvas.width / 2, rotatedCanvas.height / 2);
      rotatedContext.rotate(getRadianAngle(rotation));
      rotatedContext.drawImage(image, -image.width / 2, -image.height / 2);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Preview context unavailable"));
        return;
      }
      context.drawImage(rotatedCanvas, cropPixels.x, cropPixels.y, cropPixels.width, cropPixels.height, 0, 0, width, height);
      const targetMime = String(mimeType || "").includes("png") ? "image/png" : "image/jpeg";
      resolve(canvas.toDataURL(targetMime, 0.92));
    };
    image.onerror = () => reject(new Error("Preview render failed"));
    image.src = src;
  });
}

function toCropPayload(croppedPixels) {
  if (!croppedPixels) return null;
  const rawX = Number(croppedPixels.x);
  const rawY = Number(croppedPixels.y);
  const rawWidth = Number(croppedPixels.width);
  const rawHeight = Number(croppedPixels.height);
  if (
    !Number.isFinite(rawX) ||
    !Number.isFinite(rawY) ||
    !Number.isFinite(rawWidth) ||
    !Number.isFinite(rawHeight) ||
    rawWidth <= 0 ||
    rawHeight <= 0
  ) {
    return null;
  }
  const x = Math.floor(rawX);
  const y = Math.floor(rawY);
  const right = Math.ceil(rawX + rawWidth);
  const bottom = Math.ceil(rawY + rawHeight);
  const width = right - x;
  const height = bottom - y;
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
  const [rotation, setRotation] = useState(0);
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
    setRotation(0);
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
  const normalizedRotation = useMemo(() => normalizeRotationDegrees(rotation), [rotation]);
  const hasWidth = parsedWidth !== null;
  const hasHeight = parsedHeight !== null;

  const orientedSource = useMemo(
    () => rotateSize(sourceWidth, sourceHeight, normalizedRotation),
    [sourceWidth, sourceHeight, normalizedRotation],
  );
  const orientedSourceWidth = Math.max(1, Math.ceil(orientedSource.width || 0));
  const orientedSourceHeight = Math.max(1, Math.ceil(orientedSource.height || 0));

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
      const maxWidth = Number(cropPayload?.width) || orientedSourceWidth;
      const maxHeight = Number(cropPayload?.height) || orientedSourceHeight;
      if (parsedWidth > maxWidth + 1 || parsedHeight > maxHeight + 1) {
        return "Width and height must be less than or equal to the crop area dimensions.";
      }
    }
    return "";
  }, [
    cropPayload,
    hasWidth,
    hasHeight,
    parsedWidth,
    parsedHeight,
    orientedSourceWidth,
    orientedSourceHeight,
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
      rotation: normalizedRotation,
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
  }, [open, imageUrl, cropPayload, finalWidth, finalHeight, normalizedRotation, file?.type]);

  const handleConfirm = () => {
    if (validationError || !cropPayload) return;
    onConfirm?.({
      crop: cropPayload,
      width: Number.isFinite(parsedWidth) ? parsedWidth : null,
      height: Number.isFinite(parsedHeight) ? parsedHeight : null,
      rotationDegrees: normalizedRotation,
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
                  rotation={normalizedRotation}
                  aspect={aspect}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onRotationChange={setRotation}
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
              <div className={styles.cropControlItem}>
                <Typography.Text>Rotation</Typography.Text>
                <Slider
                  min={0}
                  max={359}
                  step={0.1}
                  value={normalizedRotation}
                  onChange={setRotation}
                  tooltip={{ formatter: (value) => `${Number(value || 0).toFixed(1)} deg` }}
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
                  {orientedSourceWidth || 0} x {orientedSourceHeight || 0}
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
