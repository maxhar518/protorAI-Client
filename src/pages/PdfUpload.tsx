import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, Shield, } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PdfUpload = () => {
  const [files, setFiles] = useState([]);
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

  const processFile = async (file) => {
    const fileId = Math.random().toString(36).substr(2, 9);
    const uploadedFile = {
      id: fileId,
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      progress: 0,
    };
    setFiles(prev => [...prev, uploadedFile]);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://localhost:3000/parser/parseDocument", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();

      const finalFile = {
        ...uploadedFile,
        progress: 100,
        parsedText: result?.parsedText || result?.text || 'No text found',
        parsedQuestion: result?.count ?? null,
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

    const droppedFiles = Array.from(e.dataTransfer.files)
    const pdfFiles = droppedFiles.filter(file => file.type === 'application/pdf');

    if (pdfFiles.length === 0) {
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
          description: `${file.name} has been Upload & Parsed successfully`,
        });
      } catch (error) {
        toast({
          title: "Processing failed",
          description: `Failed to process ${file.name}.`,
          variant: "destructive",
        });
      }
    }
  }, [toast]);

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
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