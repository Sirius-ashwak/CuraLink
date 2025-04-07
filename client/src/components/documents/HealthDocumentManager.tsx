
import React, { useState, useEffect } from 'react';
import { Upload, FileText, Trash2, Download, Eye, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { firebaseStorage } from '@/lib/firebaseStorage';
import { useAuth } from '@/hooks/useAuth';
import { Progress } from '@/components/ui/progress';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';

type DocumentItem = {
  name: string;
  path: string;
  url: string;
  uploadDate?: string;
};

export default function HealthDocumentManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [localFiles, setLocalFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [viewDocument, setViewDocument] = useState<DocumentItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // User path for storing documents
  const userStoragePath = user ? `users/${user.id}/documents` : '';

  useEffect(() => {
    if (user) {
      loadDocuments();
    }
  }, [user]);

  const loadDocuments = async () => {
    if (!userStoragePath) return;
    
    setIsLoading(true);
    try {
      const files = await firebaseStorage.listFiles(userStoragePath);
      setDocuments(files);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast({
        title: "Failed to load documents",
        description: "There was an error loading your health documents. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setLocalFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleUpload = async () => {
    if (!userStoragePath || localFiles.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      await firebaseStorage.uploadMultipleFiles(
        localFiles,
        userStoragePath,
        (progress) => setUploadProgress(progress)
      );
      
      toast({
        title: "Documents uploaded successfully",
        description: `${localFiles.length} ${localFiles.length === 1 ? 'document' : 'documents'} uploaded successfully.`,
      });
      
      // Clear local files and reload from storage
      setLocalFiles([]);
      await loadDocuments();
    } catch (error) {
      console.error('Error uploading documents:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your documents. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveLocalFile = (index: number) => {
    setLocalFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteStoredFile = async (document: DocumentItem) => {
    if (!userStoragePath) return;
    
    try {
      await firebaseStorage.deleteFile(document.path);
      toast({
        title: "Document deleted",
        description: `${document.name} has been deleted.`,
      });
      
      // Update the UI
      setDocuments(prev => prev.filter(doc => doc.path !== document.path));
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Delete failed",
        description: "There was an error deleting the document. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDownload = (documentItem: DocumentItem) => {
    // Open in new tab, the browser will handle the download
    window.open(documentItem.url, '_blank');
  };

  const handleView = (document: DocumentItem) => {
    setViewDocument(document);
  };

  const fileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const isImage = (filename: string) => {
    const ext = fileExtension(filename);
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext);
  };

  const isPdf = (filename: string) => {
    return fileExtension(filename) === 'pdf';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Health Documents</h3>
        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
            multiple
          />
          <label htmlFor="file-upload">
            <Button variant="outline" className="cursor-pointer" disabled={isUploading}>
              <Upload className="w-4 h-4 mr-2" />
              Select Files
            </Button>
          </label>
        </div>
      </div>

      {/* Staged files for upload */}
      {localFiles.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium">Files to Upload ({localFiles.length})</h4>
            <Button 
              onClick={handleUpload} 
              disabled={isUploading}
              size="sm"
            >
              {isUploading ? 'Uploading...' : 'Upload All'}
            </Button>
          </div>
          
          {isUploading && (
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1">
                <span>Uploading...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
          
          <div className="grid gap-2 max-h-48 overflow-y-auto">
            {localFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-white dark:bg-gray-900 p-2 rounded-md">
                <div className="flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-blue-400" />
                  <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveLocalFile(index)}
                  disabled={isUploading}
                >
                  <X className="w-4 h-4 text-gray-500" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stored documents */}
      <div>
        <h4 className="text-sm font-medium mb-2">Your Documents</h4>
        {isLoading ? (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {[1, 2, 3].map(i => (
              <Card key={i} className="p-4 flex animate-pulse">
                <div className="w-full h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </Card>
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
            <FileText className="w-10 h-10 mx-auto text-gray-400" />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No documents yet</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Upload your medical records, prescriptions, and test results
            </p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {documents.map((doc) => (
              <Card key={doc.path} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 mr-3 text-blue-400" />
                    <div>
                      <span className="text-sm font-medium block truncate max-w-[220px]">
                        {doc.name}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {doc.uploadDate || 'Recently uploaded'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {(isImage(doc.name) || isPdf(doc.name)) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleView(doc)}
                        title="View"
                      >
                        <Eye className="w-4 h-4 text-gray-500" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownload(doc)}
                      title="Download"
                    >
                      <Download className="w-4 h-4 text-gray-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteStoredFile(doc)}
                      className="text-red-500"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Document Viewer Dialog */}
      <Dialog open={viewDocument !== null} onOpenChange={(open) => !open && setViewDocument(null)}>
        <DialogContent className="max-w-4xl w-[90vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              {viewDocument?.name}
            </DialogTitle>
            <DialogDescription>
              View your medical document
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {viewDocument && (
              <>
                {isImage(viewDocument.name) ? (
                  <img 
                    src={viewDocument.url} 
                    alt={viewDocument.name} 
                    className="max-h-[70vh] mx-auto"
                  />
                ) : isPdf(viewDocument.name) ? (
                  <iframe 
                    src={`${viewDocument.url}#view=FitH`}
                    title={viewDocument.name}
                    className="w-full h-[70vh]"
                  />
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>This file type cannot be previewed directly.</p>
                    <Button 
                      onClick={() => handleDownload(viewDocument)}
                      className="mt-4"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
