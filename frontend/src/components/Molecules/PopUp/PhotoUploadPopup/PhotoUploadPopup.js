// src/components/PhotoUploadPopup/PhotoUploadPopup.js
import React, { useState, useCallback, useRef } from "react";
import ReactDOM from "react-dom";
import Cropper from "react-easy-crop";
import styles from "./PhotoUploadPopup.module.css";
import getCroppedImg from "./CropImage";
import Button from "../../../Atoms/Button/Button";

const PhotoUploadPopup = ({ isOpen, onClose, onFileSelect }) => {
  const fileInputRef = useRef(null);

  // State
  const [imageSrc, setImageSrc] = useState(null);
  const [fileType, setFileType] = useState("image/jpeg");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // UI State
  const [isDragging, setIsDragging] = useState(false);
  const [isCropping, setIsCropping] = useState(false);

  // --- Handlers ---

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileSelectedForCropping = (file) => {
    setFileType(file.type || "image/jpeg");

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setImageSrc(reader.result);
      setZoom(1); // Reset zoom saat ganti gambar
    });
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelectedForCropping(e.target.files[0]);
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        handleFileSelectedForCropping(file);
      } else {
        alert("Please select an image file.");
      }
      e.dataTransfer.clearData();
    }
  }, []);

  const showCroppedImage = useCallback(async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      setIsCropping(true);
      const croppedImage = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        fileType
      );

      onFileSelect(croppedImage);
      handleClose();
    } catch (e) {
      console.error("Failed to crop image:", e);
      alert("Something went wrong while cropping the image.");
    } finally {
      setIsCropping(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageSrc, croppedAreaPixels, fileType, onFileSelect]);

  const handleClose = () => {
    setImageSrc(null);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    setCroppedAreaPixels(null);
    setIsDragging(false);
    onClose();
  };

  // --- Drag Styling Logic ---
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback(
    (e) => {
      handleDrag(e);
      if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        setIsDragging(true);
      }
    },
    [handleDrag]
  );

  const handleDragOut = useCallback(
    (e) => {
      handleDrag(e);
      setIsDragging(false);
    },
    [handleDrag]
  );

  const onBrowseClick = () => {
    fileInputRef.current?.click();
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className={styles.overlay} onClick={handleClose}>
      <div
        className={styles.popupContainer}
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.closeButton} onClick={handleClose}>
          ×
        </button>

        {imageSrc ? (
          /* --- TAMPILAN CROPPER --- */
          <>
            <div className={styles.cropperContainer}>
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={3 / 4}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                showGrid={true}
                restrictPosition={false}
              />
            </div>

            <div className={styles.controls}>
              <div className={styles.sliderContainer}>
                <label>Zoom</label>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className={styles.zoomRange}
                />
              </div>
            </div>

            <div className={styles.actionButtons}>
              <Button
                className={styles.cancelButton}
                onClick={() => setImageSrc(null)}
                variant="outline"
              >
                Change Photo
              </Button>
              <Button
                className={styles.saveButton}
                onClick={showCroppedImage}
                disabled={isCropping}
                variant="solid"
              >
                {isCropping ? "Saving..." : "Save Photo"}
              </Button>
            </div>
          </>
        ) : (
          /* --- TAMPILAN DRAG & DROP --- */
          <div
            className={styles.dragAndDrop}
            onDragEnter={handleDragIn}
            onDragLeave={handleDragOut}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {isDragging ? (
              <div className={styles.dropYourFileWrapper}>
                <div className={styles.dropYourFile}>
                  Drop your file to upload
                </div>
              </div>
            ) : (
              <div className={styles.dragAndDropYourFileHereParent}>
                <div className={styles.dragAndDropTitle}>
                  Drag and drop your file here
                </div>
                <div className={styles.or}>or</div>
                <Button
                  className={styles.browseButton}
                  onClick={onBrowseClick}
                  variant="solid"
                >
                  <span className={styles.browseText}>Browse Files</span>
                </Button>
              </div>
            )}
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/jpg"
          style={{ display: "none" }}
        />
      </div>
    </div>,
    document.body
  );
};

export default PhotoUploadPopup;
