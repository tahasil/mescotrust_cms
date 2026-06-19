"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, InputNumber, Modal, Slider, Space, Typography } from "antd";
import { parsePositiveIntOrNull } from "./rasterMedia";
import styles from "./AdminMediaLibrary.module.css";

const Cropper = dynamic(
  () => import("react-cropper").then((module) => module.Cropper),
  { ssr: false },
);

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

function getCanvasMimeType(fileMimeType) {
  const normalized = String(fileMimeType || "").toLowerCase();
  if (normalized.includes("png")) return "image/png";
  if (normalized.includes("webp")) return "image/webp";
  return "image/jpeg";
}

function replaceFileExtension(name, ext) {
  const base = String(name || "cropped-image").replace(/\.[^.]+$/, "");
  return `${base}${ext}`;
}

function extensionFromMimeType(mimeType) {
  const normalized = String(mimeType || "").toLowerCase();
  if (normalized === "image/png") return ".png";
  if (normalized === "image/webp") return ".webp";
  return ".jpg";
}

function renderCanvasPreview({ cropper, width, height, mimeType }) {
  if (!cropper || !width || !height) return "";
  const canvas = cropper.getCroppedCanvas({
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height)),
    imageSmoothingEnabled: true,
    imageSmoothingQuality: "high",
  });
  if (!canvas) return "";
  return canvas.toDataURL(getCanvasMimeType(mimeType), 0.92);
}

function canvasToBlob(canvas, mimeType) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Unable to generate cropped image"));
          return;
        }
        resolve(blob);
      },
      mimeType,
      0.92,
    );
  });
}

export default function RasterCropConfirmModal({
  open,
  file,
  title = "Crop image before upload",
  confirmText = "Confirm crop",
  onCancel,
  onConfirm,
}) {
  const cropperRef = useRef(null);
  const [imageUrl, setImageUrl] = useState("");
  const [sourceWidth, setSourceWidth] = useState(0);
  const [sourceHeight, setSourceHeight] = useState(0);
  const [cropperReady, setCropperReady] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [cropBoxPixels, setCropBoxPixels] = useState(null);
  const [widthInput, setWidthInput] = useState(null);
  const [heightInput, setHeightInput] = useState(null);
  const [manualSizeMode, setManualSizeMode] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewError, setPreviewError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [interactionTick, setInteractionTick] = useState(0);

  useEffect(() => {
    if (!open || !file) return;
    const nextUrl = createObjectUrl(file);
    setImageUrl(nextUrl);
    setSourceWidth(0);
    setSourceHeight(0);
    setCropperReady(false);
    setZoom(1);
    setRotation(0);
    setCropBoxPixels(null);
    setWidthInput(null);
    setHeightInput(null);
    setManualSizeMode(false);
    setPreviewUrl("");
    setPreviewError("");
    setInteractionTick(0);
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

  const normalizedRotation = useMemo(() => normalizeRotationDegrees(rotation), [rotation]);
  const parsedWidth = useMemo(() => parsePositiveIntOrNull(widthInput), [widthInput]);
  const parsedHeight = useMemo(() => parsePositiveIntOrNull(heightInput), [heightInput]);

  const orientedSource = useMemo(
    () => rotateSize(sourceWidth, sourceHeight, normalizedRotation),
    [sourceWidth, sourceHeight, normalizedRotation],
  );
  const orientedSourceWidth = Math.max(1, Math.ceil(orientedSource.width || 0));
  const orientedSourceHeight = Math.max(1, Math.ceil(orientedSource.height || 0));

  const selectedCropWidth = Math.max(0, Math.round(Number(cropBoxPixels?.width) || 0));
  const selectedCropHeight = Math.max(0, Math.round(Number(cropBoxPixels?.height) || 0));

  const isManualSizeComplete =
    manualSizeMode && Number.isFinite(parsedWidth) && Number.isFinite(parsedHeight);
  const hasManualWidth = manualSizeMode && parsedWidth !== null;
  const hasManualHeight = manualSizeMode && parsedHeight !== null;

  const displayWidth = manualSizeMode ? widthInput : selectedCropWidth || null;
  const displayHeight = manualSizeMode ? heightInput : selectedCropHeight || null;

  const finalWidth = isManualSizeComplete ? parsedWidth : selectedCropWidth;
  const finalHeight = isManualSizeComplete ? parsedHeight : selectedCropHeight;

  const validationError = useMemo(() => {
    if (!cropperReady) return "Loading image editor.";
    if (!selectedCropWidth || !selectedCropHeight) return "Select a crop area to continue.";
    if (manualSizeMode && hasManualWidth !== hasManualHeight) {
      return "Width and height must be set together.";
    }
    if (
      (manualSizeMode && hasManualWidth && !Number.isFinite(parsedWidth)) ||
      (manualSizeMode && hasManualHeight && !Number.isFinite(parsedHeight))
    ) {
      return "Width and height must be positive integers.";
    }
    if (!finalWidth || !finalHeight) {
      return "Select a crop area to continue.";
    }
    return "";
  }, [
    cropperReady,
    selectedCropWidth,
    selectedCropHeight,
    manualSizeMode,
    hasManualWidth,
    hasManualHeight,
    parsedWidth,
    parsedHeight,
    finalWidth,
    finalHeight,
  ]);

  const syncCropData = useCallback(() => {
    const cropper = cropperRef.current;
    if (!cropper) return;
    const data = cropper.getData(true);
    if (!data) return;
    const width = Number(data.width) || 0;
    const height = Number(data.height) || 0;
    if (width <= 0 || height <= 0) return;
    const x = Math.max(0, Number(data.x) || 0);
    const y = Math.max(0, Number(data.y) || 0);
    setCropBoxPixels({
      x,
      y,
      width,
      height,
    });
    setInteractionTick((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const cropper = cropperRef.current;
    if (!cropper || !cropperReady) return;
    if (isManualSizeComplete) {
      cropper.setAspectRatio(parsedWidth / parsedHeight);
    } else {
      cropper.setAspectRatio(NaN);
    }
    syncCropData();
  }, [cropperReady, isManualSizeComplete, parsedWidth, parsedHeight, syncCropData]);

  useEffect(() => {
    const cropper = cropperRef.current;
    if (!cropper || !cropperReady) return;
    cropper.rotateTo(normalizedRotation);
    syncCropData();
  }, [cropperReady, normalizedRotation, syncCropData]);

  useEffect(() => {
    const cropper = cropperRef.current;
    if (!cropper || !cropperReady) return;
    cropper.zoomTo(zoom);
    syncCropData();
  }, [cropperReady, zoom, syncCropData]);

  const handleWidthChange = (nextValue) => {
    const next = nextValue === null ? null : Number(nextValue);
    if (!manualSizeMode) {
      if (next === null) return;
      setManualSizeMode(true);
      setWidthInput(next);
      setHeightInput(selectedCropHeight || null);
      return;
    }
    setWidthInput(next);
    if (next === null && heightInput === null) {
      setManualSizeMode(false);
    }
  };

  const handleHeightChange = (nextValue) => {
    const next = nextValue === null ? null : Number(nextValue);
    if (!manualSizeMode) {
      if (next === null) return;
      setManualSizeMode(true);
      setHeightInput(next);
      setWidthInput(selectedCropWidth || null);
      return;
    }
    setHeightInput(next);
    if (next === null && widthInput === null) {
      setManualSizeMode(false);
    }
  };

  const resetManualSize = () => {
    setManualSizeMode(false);
    setWidthInput(null);
    setHeightInput(null);
  };

  useEffect(() => {
    let cancelled = false;
    if (!open || !cropperReady) {
      setPreviewUrl("");
      return () => {
        cancelled = true;
      };
    }
    if (!finalWidth || !finalHeight || validationError) {
      setPreviewUrl("");
      return () => {
        cancelled = true;
      };
    }
    try {
      const cropper = cropperRef.current;
      const nextPreview = renderCanvasPreview({
        cropper,
        width: finalWidth,
        height: finalHeight,
        mimeType: file?.type,
      });
      if (!cancelled) {
        setPreviewError("");
        setPreviewUrl(nextPreview);
      }
    } catch (err) {
      if (!cancelled) {
        setPreviewUrl("");
        setPreviewError(err?.message || "Unable to render preview");
      }
    }
    return () => {
      cancelled = true;
    };
  }, [
    open,
    cropperReady,
    interactionTick,
    finalWidth,
    finalHeight,
    file?.type,
    validationError,
  ]);

  const handleConfirm = async () => {
    if (validationError || confirming) return;
    const cropper = cropperRef.current;
    if (!cropper) return;
    try {
      setConfirming(true);
      setPreviewError("");
      const targetMime = getCanvasMimeType(file?.type);
      const canvas = cropper.getCroppedCanvas({
        width: Math.max(1, Math.round(finalWidth)),
        height: Math.max(1, Math.round(finalHeight)),
        imageSmoothingEnabled: true,
        imageSmoothingQuality: "high",
      });
      if (!canvas) {
        throw new Error("Unable to generate cropped image");
      }
      const blob = await canvasToBlob(canvas, targetMime);
      const outputMime = String(blob.type || targetMime);
      const outputExt = extensionFromMimeType(outputMime);
      const outputName = replaceFileExtension(file?.name, outputExt);
      const processedFile = new File([blob], outputName, { type: outputMime });
      const outputWidth = Math.max(1, Number(canvas.width) || Math.round(finalWidth));
      const outputHeight = Math.max(1, Number(canvas.height) || Math.round(finalHeight));
      onConfirm?.({
        processedFile,
        crop: {
          x: 0,
          y: 0,
          width: outputWidth,
          height: outputHeight,
        },
        width: null,
        height: null,
        rotationDegrees: 0,
        finalWidth: outputWidth,
        finalHeight: outputHeight,
      });
    } catch (err) {
      setPreviewError(err?.message || "Unable to generate cropped image");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <Modal
      open={open}
      title={title}
      onCancel={onCancel}
      width="min(980px, calc(100vw - 24px))"
      destroyOnClose
      footer={[
        <Button key="cancel" onClick={onCancel} disabled={confirming}>
          Cancel
        </Button>,
        <Button
          key="confirm"
          type="primary"
          onClick={handleConfirm}
          disabled={Boolean(validationError)}
          loading={confirming}
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
                  src={imageUrl}
                  style={{ width: "100%", height: "100%" }}
                  viewMode={1}
                  dragMode="move"
                  guides
                  background={false}
                  responsive
                  checkOrientation={false}
                  autoCropArea={0.8}
                  toggleDragModeOnDblclick={false}
                  cropBoxMovable
                  cropBoxResizable
                  minCropBoxWidth={20}
                  minCropBoxHeight={20}
                  ready={() => {
                    setCropperReady(true);
                    syncCropData();
                  }}
                  crop={syncCropData}
                  onInitialized={(instance) => {
                    cropperRef.current = instance;
                  }}
                />
              ) : null}
            </div>

            <div className={styles.cropControls}>
              <div className={styles.cropControlItem}>
                <Typography.Text>Zoom</Typography.Text>
                <Slider
                  min={0.1}
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
                value={displayWidth}
                onChange={handleWidthChange}
              />
              <InputNumber
                min={1}
                controls={false}
                placeholder="Height"
                value={displayHeight}
                onChange={handleHeightChange}
              />
            </Space>
            <Typography.Text type="secondary">
              Drag or resize the crop box directly. Leave width and height empty to use crop area
              size.
            </Typography.Text>
            {manualSizeMode ? (
              <Button type="link" size="small" style={{ padding: 0 }} onClick={resetManualSize}>
                Use crop area size
              </Button>
            ) : null}

            <div className={styles.cropMetaBlock}>
              <div>
                <Typography.Text type="secondary">Source</Typography.Text>
                <div>
                  {orientedSourceWidth || 0} x {orientedSourceHeight || 0}
                </div>
              </div>
              <div>
                <Typography.Text type="secondary">Output</Typography.Text>
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
