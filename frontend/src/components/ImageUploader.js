import React, { useRef, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';

export default function ImageUploader({ value, onChange, label, className = '' }) {
  const { getAuthHeaders } = useAuth();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleUpload = async (file) => {
    if (!file) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/upload`,
        formData,
        {
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      // Construct full URL
      const fullUrl = `${process.env.REACT_APP_BACKEND_URL}${response.data.url}`;
      onChange(fullUrl);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Erreur lors de l\'upload de l\'image');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) handleUpload(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleUpload(file);
    }
  };

  const clearImage = () => {
    onChange('');
  };

  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium mb-2">{label}</label>}
      
      <div className="space-y-3">
        {/* URL Input */}
        <div className="flex space-x-2">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="URL de l'image ou glissez une image ci-dessous"
            className="flex-1 px-4 py-2 border border-input rounded-sm focus:outline-none focus:ring-2 focus:ring-ring text-sm"
          />
          {value && (
            <button
              type="button"
              onClick={clearImage}
              className="p-2 border border-border rounded-sm hover:bg-red-50 hover:border-red-200"
              title="Supprimer"
            >
              <X size={18} className="text-red-500" />
            </button>
          )}
        </div>

        {/* Upload Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-sm p-6 text-center cursor-pointer transition-colors ${
            dragActive 
              ? 'border-accent bg-accent/5' 
              : 'border-border hover:border-accent/50 hover:bg-secondary/30'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          
          {uploading ? (
            <div className="flex flex-col items-center">
              <Loader2 size={32} className="text-accent animate-spin mb-2" />
              <p className="text-sm text-muted-foreground">Upload en cours...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload size={32} className="text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                <span className="text-accent font-medium">Cliquez</span> ou glissez une image ici
              </p>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF jusqu'à 10MB</p>
            </div>
          )}
        </div>

        {/* Preview */}
        {value && (
          <div className="relative">
            <img
              src={value}
              alt="Aperçu"
              className="w-full h-40 object-cover rounded-sm border border-border"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
