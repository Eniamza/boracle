"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AlertCircle, CheckCircle, FileText, Upload, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function DataImportPage() {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [importResults, setImportResults] = useState(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      setUploadStatus(null);
      setImportResults(null);
    } else {
      toast.error("Please select a valid CSV file");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a CSV file first");
      return;
    }

    setIsUploading(true);
    setUploadStatus("uploading");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/faculty/import", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setUploadStatus("success");
        setImportResults(result);
        toast.success(`Successfully imported ${result.successCount} faculty records${result.errorCount > 0 ? ` with ${result.errorCount} errors` : ''}`);
      } else {
        setUploadStatus("error");
        toast.error(result.error || "Import failed");
      }
    } catch (error) {
      setUploadStatus("error");
      toast.error("Network error during import");
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };


  return (
    <div className="container mx-auto p-6 space-y-6">

      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Data Import</h1>
        <p className="text-muted-foreground">
          Import faculty data from CSV files to update the BUCC database
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload CSV File
            </CardTitle>
            <CardDescription>
              Select a CSV file containing faculty information to import
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              {file && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  {file.name}
                </div>
              )}
            </div>

            <Button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="w-full"
            >
              {isUploading ? "Importing..." : "Import Data"}
            </Button>

            {/* Upload Status */}
            {uploadStatus && (
              <div className="flex items-center gap-2 p-3 rounded-lg border">
                {uploadStatus === "uploading" && (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm">Uploading and processing...</span>
                  </>
                )}
                {uploadStatus === "success" && (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">Import completed successfully!</span>
                  </>
                )}
                {uploadStatus === "error" && (
                  <>
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-600">Import failed. Please try again.</span>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Import Instructions
            </CardTitle>
            <CardDescription>
              Follow these guidelines for successful data import
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium">CSV Format Requirements:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                  <li>First row must contain headers: facultyName, email, imgURL, initials</li>
                  <li>facultyName: Full name of the faculty member</li>
                  <li>email: Valid email address (must end with @g.bracu.ac.bd)</li>
                  <li>imgURL: Valid HTTPS URL for profile image</li>
                  <li>initials: Faculty initials (comma-separated if multiple)</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium">Important Notes:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                  <li>Only admin users can access this feature</li>
                  <li>Duplicate emails will be skipped</li>
                  <li>Invalid data rows will be reported</li>
                  <li>Backup your data before large imports</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Import Results */}
      {importResults && (
        <Card>
          <CardHeader>
            <CardTitle>Import Results</CardTitle>
            <CardDescription>
              Summary of the data import process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {importResults.successCount}
                </div>
                <div className="text-sm text-green-600">Successfully Imported</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {importResults.errorCount}
                </div>
                <div className="text-sm text-red-600">Errors</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {importResults.totalCount}
                </div>
                <div className="text-sm text-blue-600">Total Processed</div>
              </div>
            </div>

            {importResults.errors && importResults.errors.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-red-600 mb-2">Error Details:</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {importResults.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      Row {error.row}: {error.message}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}