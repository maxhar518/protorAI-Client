import { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Shield, } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PdfUpload = () => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileResult, setFileResult] = useState(null);
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const processFile = async (file) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({ title: "Login Required", description: "Please log in first.", variant: "destructive" });
        return;
      }
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://localhost:3000/parser/parseDocument", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();
      setFileResult(result)
      if (result?.success) {
        toast({
          title: "Success",
          description: result.message || "successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(error.message);
      toast({
        title: "Error",
        description: "Failed to load. Please try again.",
        variant: "destructive",
      });
    }
  };


  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      const pdfFiles = droppedFiles.filter(file => file.type === "application/pdf");

      if (pdfFiles.length === 0) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file.",
          variant: "destructive",
        });
        return;
      }

      for (const file of pdfFiles) {
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds 10MB.`,
            variant: "destructive",
          });
          continue;
        }

        try {
          await processFile(file);
        } catch (error) {
          console.error(error);
          toast({
            title: "Processing failed",
            description: `Failed to process ${file.name}.`,
            variant: "destructive",
          });
        }
      }
    },
    [toast, processFile]
  );

  const handleButtonClick = () => {
    fileInputRef.current.click(); // Trigger hidden file input
  };

  const handleFileChange = useCallback(async (e) => {
    e.preventDefault();
    const file = e.target.files[0]
    try {
      await processFile(file)
    } catch (error) {
      toast({
        title: "Processing failed",
        description: `Failed to process ${file.name}.`,
        variant: "destructive",
      });
    }
  }, [toast]);


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
                  onDrop={handleDrop}>
                  <div className="mx-auto w-12 h-12 mb-4 text-muted-foreground">
                    <FileText className="w-full h-full" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Drop PDF files here</h3>
                  <div>
                    <input
                      type="file"
                      accept="application/pdf"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                    <Button type="button" onClick={handleButtonClick}>
                      Upload PDF
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2">
            <Card className="pl-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {fileResult?.message}
                </CardTitle>
              </CardHeader>
              {fileResult?.parsedText?.map((item, index) => (
                <div key={index}>
                  <br />
                  <h2> <strong>{item.question}</strong>
                    <hr />
                  </h2>
                  <ul>
                    {item.options?.map((option, i) => (
                      <li key={i}>{option}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfUpload;