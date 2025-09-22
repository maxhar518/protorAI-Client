import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Upload,
  FileText,
  Shield,
  CheckCircle,
  AlertCircle,
  X,
  Download,
  Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { log } from "console";

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  parsedText?: string;
  analysisResult?: {
    riskLevel: 'low' | 'medium' | 'high';
    detectedIssues: string[];
    confidence: number;
  };
}

const PdfUpload = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const processFile = async (file: File): Promise<UploadedFile> => {
    const fileId = Math.random().toString(36).substr(2, 9);
    const uploadedFile: UploadedFile = {
      id: fileId,
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      status: 'uploading',
      progress: 0,
    };
    setFiles(prev => [...prev, uploadedFile]);

    // Simulate upload progress
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, progress } : f));
    }

    // Change to processing
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: 'processing', progress: 0 } : f));

    // Simulate processing
    for (let progress = 0; progress <= 100; progress += 20) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, progress } : f));
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Send to backend
      const response = await fetch("http://localhost:3000/parser/parseDocument", {
        method: "POST",
        body: formData,
      });

      console.log(!response)
      const result = await response.json();

      const finalFile: UploadedFile = {
        ...uploadedFile,
        status: 'completed',
        progress: 100,
        parsedText: result.parsedText || '',
        analysisResult: result.analysisResult || null,
      };

      setFiles(prev =>
        prev.map(f => f.id === fileId ? finalFile : f)
      );

      return finalFile;
    } catch (error) {
      console.error(error);
      setFiles(prev =>
        prev.map(f => f.id === fileId ? { ...f, status: 'error', progress: 100 } : f)
      );
      throw error;
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const droppedFiles = await Array.from(e.dataTransfer.files);
    const pdfFiles = await droppedFiles.filter(file => file.type === 'application/pdf');

    if (!pdfFiles) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file.",
        variant: "destructive",
      });
      return;
    }

    // Process each file
    for (const file of pdfFiles) {
      try {
        await processFile(file);
        toast({
          title: "File processed successfully",
          description: `${file.name} has been analyzed.`,
        });
      } catch (error) {
        toast({
          title: "Processing failed",
          description: `Failed to process ${file.name}${error}.`,
          variant: "destructive",
        });
      }
    }
  }, [toast]);

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const pdfFiles = selectedFiles.filter(file => file.type === 'application/pdf');

    if (pdfFiles.length === 0) {
      toast({
        title: "Invalid file type",
        description: "Please upload PDF files only.",
        variant: "destructive",
      });
      return;
    }

    const newFiles = pdfFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      status: 'uploading' as const,
      progress: 0,
    }));

    setFiles(prev => [...prev, ...newFiles]);

    for (const file of pdfFiles) {
      try {
        await processFile(file);
      } catch (error) {
        console.error('Processing failed:', error);
      }
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const getRiskBadgeVariant = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <div className="bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">PDF Document Analysis</h1>
              <p className="text-muted-foreground">Upload and analyze PDF documents for potential security risks</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Area */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload PDF Documents
                </CardTitle>
                <CardDescription>
                  Drop your PDF files here or click to browse. Maximum file size: 10MB.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragOver
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                    }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="mx-auto w-12 h-12 mb-4 text-muted-foreground">
                    <FileText className="w-full h-full" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Drop PDF files here</h3>
                  <p className="text-muted-foreground mb-4">
                    or click to browse from your computer
                  </p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileInput}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button variant="outline" className="cursor-pointer">
                      Browse Files
                    </Button>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* File List */}
            {files.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Uploaded Files</CardTitle>
                  <CardDescription>
                    Track the progress and results of your uploaded documents.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      {files.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <FileText className="h-8 w-8 text-primary" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{file.name}</p>
                              <p className="text-sm text-muted-foreground">{file.size}</p>

                              {file.status !== 'completed' && (
                                <div className="mt-2">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs text-muted-foreground">
                                      {file.status === 'uploading' ? 'Uploading...' : 'Processing...'}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {file.progress}%
                                    </span>
                                  </div>
                                  <Progress value={file.progress} className="h-2" />
                                </div>
                              )}

                              {file.status === 'completed' && file.analysisResult && (
                                <div className="mt-2 flex items-center gap-2">
                                  <Badge variant={getRiskBadgeVariant(file.analysisResult.riskLevel)}>
                                    {file.analysisResult.riskLevel} risk
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {file.analysisResult.confidence}% confidence
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {file.status === 'completed' ? (
                              <>
                                <Button variant="ghost" size="icon">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon">
                                  <Download className="h-4 w-4" />
                                </Button>
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              </>
                            ) : file.status === 'error' ? (
                              <AlertCircle className="h-5 w-5 text-red-500" />
                            ) : null}

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFile(file.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Analysis Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Analysis Summary</CardTitle>
                <CardDescription>
                  Overview of your document analysis results.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">
                      {files.filter(f => f.status === 'completed').length}
                    </div>
                    <p className="text-sm text-muted-foreground">Documents Analyzed</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-lg font-semibold text-green-600">
                        {files.filter(f => f.analysisResult?.riskLevel === 'low').length}
                      </div>
                      <p className="text-xs text-muted-foreground">Low Risk</p>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-yellow-600">
                        {files.filter(f => f.analysisResult?.riskLevel === 'medium').length}
                      </div>
                      <p className="text-xs text-muted-foreground">Medium Risk</p>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-red-600">
                        {files.filter(f => f.analysisResult?.riskLevel === 'high').length}
                      </div>
                      <p className="text-xs text-muted-foreground">High Risk</p>
                    </div>
                  </div>

                  {files.some(f => f.status === 'processing' || f.status === 'uploading') && (
                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground mb-2">Processing Queue</p>
                      <div className="text-lg font-semibold">
                        {files.filter(f => f.status === 'processing' || f.status === 'uploading').length} files
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfUpload;