'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Download,
  Loader2,
  Shield,
  X,
  Info
} from "lucide-react";
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const FacultyImportPage = () => {
  const { data: session, status } = useSession();
  const [file, setFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [importing, setImporting] = useState(false);
  const [errors, setErrors] = useState([]);
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    setImportSuccess(false);
    setErrors([]);

    // Parse CSV for preview
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;

      // Helper function to parse CSV line respecting quotes
      const parseCSVLine = (line) => {
        const values = [];
        let currentValue = '';
        let insideQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];

          if (char === '"') {
            insideQuotes = !insideQuotes;
          } else if (char === ',' && !insideQuotes) {
            values.push(currentValue.trim());
            currentValue = '';
          } else {
            currentValue += char;
          }
        }
        values.push(currentValue.trim());
        return values;
      };

      // Split by newline but respect quotes potentially spanning lines (basic version assumes 1 line per row)
      // For more complex multi-line support, a full parser library is better, but this regex split handles standard CRLF/LF
      const rows = text.split(/\r?\n/).filter(row => row.trim());

      if (rows.length === 0) {
        setErrors(['File is empty']);
        return;
      }

      // Parse headers
      const headers = parseCSVLine(rows[0]).map(h => h.replace(/^"|"$/g, '').trim()); // Remove surrounding quotes

      // Validate headers
      const requiredHeaders = ['facultyName', 'email'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

      if (missingHeaders.length > 0) {
        setErrors([`Missing required columns: ${missingHeaders.join(', ')}`]);
        setCsvData([]);
        return;
      }

      // Parse data rows
      const data = [];
      const parseErrors = [];

      for (let i = 1; i < rows.length; i++) {
        const rowText = rows[i].trim();
        if (!rowText) continue;

        const values = parseCSVLine(rowText).map(v => v.replace(/^"|"$/g, '')); // Remove quotes

        if (values.length !== headers.length) {
          // Attempt to be lenient if trailing comma caused an empty extra field?
          // Or just report error.
          // Check if it's just a trailing comma case
          if (values.length > headers.length && !values[values.length - 1]) {
            values.pop();
          }

          if (values.length !== headers.length) {
            parseErrors.push(`Row ${i + 1}: Column count mismatch (Found ${values.length}, Expected ${headers.length})`);
            continue;
          }
        }

        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        // Validate required fields
        if (!row.facultyName || !row.email) {
          // parseErrors.push(`Row ${i + 1}: Missing facultyName or email`);
          // continue;
          // Skip instead of erroring? Or soft error?
        }

        // Basic email validation
        // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        // if (row.email && !emailRegex.test(row.email)) {
        //   parseErrors.push(`Row ${i + 1}: Invalid email format (${row.email})`);
        //   continue;
        // }

        if (row.facultyName && row.email) {
          data.push(row);
        }
      }

      setCsvData(data);
      if (parseErrors.length > 0) {
        // Only show first 10 errors to avoid flooding
        const limitedErrors = parseErrors.length > 10
          ? [...parseErrors.slice(0, 10), `... and ${parseErrors.length - 10} more errors`]
          : parseErrors;
        setErrors(limitedErrors);
      }
    };

    reader.readAsText(selectedFile);
  };

  const handleImport = async () => {
    if (!file || csvData.length === 0) {
      toast.error('No valid data to import');
      return;
    }

    setImporting(true);
    setErrors([]);

    try {
      // Read file content
      const reader = new FileReader();
      reader.onload = async (e) => {
        const fileContent = e.target.result;

        const response = await fetch('/api/admin/import/faculty', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ file: fileContent }),
        });

        const data = await response.json();

        if (response.ok) {
          toast.success(`Successfully imported ${csvData.length} faculty members`);
          setImportSuccess(true);
          // Reset form
          setTimeout(() => {
            setFile(null);
            setCsvData([]);
            setImportSuccess(false);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }, 3000);
        } else {
          toast.error(data.error || 'Failed to import faculty data');
          setErrors([data.error || 'Import failed']);
        }
      };

      reader.readAsText(file);
    } catch (error) {
      console.error('Error importing faculty:', error);
      toast.error('Error importing faculty data');
      setErrors(['Failed to connect to server']);
    } finally {
      setImporting(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setCsvData([]);
    setErrors([]);
    setImportSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const template = 'facultyName,email,imgURL,initials\n';
    const example1 = 'John Doe,john.doe@university.edu,https://example.com/john.jpg,"JD,JDO"\n';
    const example2 = 'Jane Smith,jane.smith@university.edu,,"JS,JSM"\n';
    const example3 = 'Bob Wilson,bob.wilson@university.edu,,BW\n';

    const blob = new Blob([template + example1 + example2 + example3], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'faculty_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Check if user is not admin
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-white" />
      </div>
    );
  }

  if (status === 'unauthenticated' || session?.user?.userrole !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="bg-white/50 dark:bg-gray-900/50 backdrop-blur border-0 shadow-xl max-w-md w-full">
          <CardContent className="text-center py-12">
            <div className="bg-red-100 dark:bg-red-900/20 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <Shield className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Access Denied
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              You need administrator privileges to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white flex items-center gap-3">
            <FileSpreadsheet className="h-10 w-10" />
            Import Faculty Data
          </h1>
          <p className="text-gray-400 mt-2">
            Upload a CSV file to bulk import faculty members
          </p>
        </div>

        {/* Instructions Card */}
        <Card className="bg-white/50 dark:bg-gray-900/50 backdrop-blur border-0 shadow-xl mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              CSV Format Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Your CSV file must include the following columns:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Required Fields:</h4>
                  <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                    <li>• <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">facultyName</code> - Full name of faculty</li>
                    <li>• <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">email</code> - Faculty email address</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Optional Fields:</h4>
                  <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                    <li>• <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">imgURL</code> - Profile image URL</li>
                    <li>• <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">initials</code> - Comma-separated initials</li>
                  </ul>
                </div>
              </div>
            </div>
            <Button
              onClick={downloadTemplate}
              variant="outline"
              className="w-full md:w-auto"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Template CSV
            </Button>
          </CardContent>
        </Card>

        {/* Upload Card */}
        <Card className="bg-white/50 dark:bg-gray-900/50 backdrop-blur border-0 shadow-xl mb-6">
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
            <CardDescription>
              Select a CSV file from your computer to import faculty data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!file ? (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Drag and drop your CSV file here, or click to browse
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label htmlFor="csv-upload">
                    <Button variant="outline" className="cursor-pointer" asChild>
                      <span>Select CSV File</span>
                    </Button>
                  </label>
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {file.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={handleRemoveFile}
                      variant="ghost"
                      size="icon"
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {errors.length > 0 && (
                <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertTitle>Validation Errors</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      {errors.slice(0, 5).map((error, idx) => (
                        <li key={idx} className="text-sm">{error}</li>
                      ))}
                      {errors.length > 5 && (
                        <li className="text-sm font-medium">
                          ... and {errors.length - 5} more errors
                        </li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Success Message */}
              {importSuccess && (
                <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle>Import Successful</AlertTitle>
                  <AlertDescription>
                    Faculty data has been successfully imported to the database.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Preview Table */}
        {csvData.length > 0 && (
          <Card className="bg-white/50 dark:bg-gray-900/50 backdrop-blur border-0 shadow-xl">
            <CardHeader>
              <CardTitle>Preview Data</CardTitle>
              <CardDescription>
                Review the data before importing ({csvData.length} valid records)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Faculty Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Image URL</TableHead>
                      <TableHead>Initials</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvData.slice(0, 10).map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell className="font-medium">{row.facultyName}</TableCell>
                        <TableCell>{row.email}</TableCell>
                        <TableCell>
                          {row.imgURL ? (
                            <Badge variant="secondary">Has Image</Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {row.initials ? (
                            <div className="flex gap-1 flex-wrap">
                              {row.initials.split(',').map((initial, i) => (
                                <Badge key={i} variant="outline">
                                  {initial.trim()}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {csvData.length > 10 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 text-center">
                    Showing first 10 of {csvData.length} records
                  </p>
                )}
              </div>

              <div className="mt-6 flex gap-3 justify-end">
                <Button
                  onClick={handleRemoveFile}
                  variant="outline"
                  disabled={importing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={importing || errors.length > 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {importing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Import {csvData.length} Records
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default FacultyImportPage;