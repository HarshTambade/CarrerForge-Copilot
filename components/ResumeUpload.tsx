'use client';

import React, { useCallback, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import { extractTextFromFile, validateFileType, formatFileSize } from '@/lib/fileUtils';
import { parseResumeText, ProcessedResumeData } from '@/lib/huggingface';

interface ResumeUploadProps {
  onResumeProcessed: (data: ProcessedResumeData) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

export default function ResumeUpload({ onResumeProcessed, isProcessing, setIsProcessing }: ResumeUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    
    // Validate file type
    if (!validateFileType(file)) {
      setError('Please upload a PDF, DOC, DOCX, or TXT file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setUploadedFile(file);
    setIsProcessing(true);
    setProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Extract text from file
      const extractedText = await extractTextFromFile(file);
      
      // Parse resume using AI
      const processedData = await parseResumeText(extractedText);
      
      setProgress(100);
      setTimeout(() => {
        onResumeProcessed(processedData);
        setIsProcessing(false);
      }, 500);

    } catch (error) {
      console.error('Error processing resume:', error);
      setError('Failed to process resume. Please try again.');
      setIsProcessing(false);
      setProgress(0);
    }
  }, [onResumeProcessed, setIsProcessing]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }, [handleFile]);

  const removeFile = useCallback(() => {
    setUploadedFile(null);
    setError(null);
    setProgress(0);
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="w-5 h-5" />
          <span>Upload Resume</span>
        </CardTitle>
        <CardDescription>
          Upload your resume to get started with AI-powered career insights
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!uploadedFile && !isProcessing && (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Drop your resume here
            </h3>
            <p className="text-gray-500 mb-4">
              or click to browse files
            </p>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileInput}
              className="hidden"
              id="resume-upload"
              disabled={isProcessing}
            />
            <label htmlFor="resume-upload">
              <Button className="cursor-pointer" disabled={isProcessing}>
                <Upload className="w-4 h-4 mr-2" />
                Choose File
              </Button>
            </label>
            <p className="text-xs text-gray-400 mt-4">
              Supports PDF, DOC, DOCX, TXT (max 10MB)
            </p>
          </div>
        )}

        {uploadedFile && !isProcessing && (
          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <FileText className="w-8 h-8 text-green-600" />
              <div>
                <p className="font-medium text-green-900">{uploadedFile.name}</p>
                <p className="text-sm text-green-700">{formatFileSize(uploadedFile.size)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <Button
                variant="ghost"
                size="sm"
                onClick={removeFile}
                className="text-green-700 hover:text-green-900"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <FileText className="w-8 h-8 text-blue-600" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">Processing resume...</p>
                <p className="text-sm text-gray-500">AI is analyzing your resume</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}