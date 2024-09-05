"use client";
import React, { useState, useRef } from 'react';

const ImageResizer: React.FC = () => {
  const [ogImageRatio, setOgImageRatio] = useState<number | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [quality, setQuality] = useState<boolean>(false);
  const [ratio, setRatio] = useState<boolean>(false);

  const previewImgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageSrc(url);
      const img = new Image();
      img.src = url;
      img.onload = () => {
        setWidth(img.naturalWidth);
        setHeight(img.naturalHeight);
        setOgImageRatio(img.naturalWidth / img.naturalHeight);
        // Add the 'active' class if needed
      };
    }
  };

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = parseInt(e.target.value);
    const newHeight = ratio ? newWidth / (ogImageRatio || 1) : height;
    setWidth(newWidth);
    setHeight(Math.floor(newHeight));
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHeight = parseInt(e.target.value);
    const newWidth = ratio ? newHeight * (ogImageRatio || 1) : width;
    setHeight(newHeight);
    setWidth(Math.floor(newWidth));
  };

  const handleQualityChange = () => setQuality(!quality);
  const handleRatioChange = () => setRatio(!ratio);

  const resizeAndDownload = () => {
    if (previewImgRef.current) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(previewImgRef.current, 0, 0, canvas.width, canvas.height);
        const imgQuality = quality ? 0.5 : 1.0;
        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/jpeg', imgQuality);
        a.download = new Date().getTime().toString();
        a.click();
      }
    }
  };

  return (
    <div className="upload-box">
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={handleFileChange} 
      />
      {imageSrc ? (
        <img 
          src={imageSrc} 
          alt="Preview" 
          ref={previewImgRef} 
          style={{ display: 'block', maxWidth: '100%' }} 
        />
      ):(<div onClick={() => fileInputRef.current?.click()} className='w-96 h-96 border-dotted border' children={"Drop your File Here"}/>)}
      <div className="controls">
        <div className="width">
          <input 
            type="number" 
            value={width} 
            onChange={handleWidthChange} 
            placeholder="Width" 
          />
        </div>
        <div className="height">
          <input 
            type="number" 
            value={height} 
            onChange={handleHeightChange} 
            placeholder="Height" 
          />
        </div>
        <div className="ratio">
          <input 
            type="checkbox" 
            checked={ratio} 
            onChange={handleRatioChange} 
          />
          <label>Maintain Aspect Ratio</label>
        </div>
        <div className="quality">
          <input 
            type="checkbox" 
            checked={quality} 
            onChange={handleQualityChange} 
          />
          <label>Reduce Quality</label>
        </div>
        <button className="download-btn" onClick={resizeAndDownload}>
          Download
        </button>
      </div>
    </div>
  );
};

export default ImageResizer;
