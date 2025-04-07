
import React, { useState } from 'react';
import { Upload, FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function HealthDocumentManager() {
  const [documents, setDocuments] = useState<File[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDocuments(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleDelete = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Input
          type="file"
          accept=".pdf,.jpg,.png,.doc,.docx"
          onChange={handleFileUpload}
          className="hidden"
          id="file-upload"
          multiple
        />
        <label htmlFor="file-upload">
          <Button variant="outline" className="cursor-pointer">
            <Upload className="w-4 h-4 mr-2" />
            Upload Documents
          </Button>
        </label>
      </div>

      <div className="grid gap-4">
        {documents.map((doc, index) => (
          <Card key={index} className="p-4 flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="w-5 h-5 mr-3 text-blue-400" />
              <span className="text-sm">{doc.name}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(index)}
              className="text-red-400 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
