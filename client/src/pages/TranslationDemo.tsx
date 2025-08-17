import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import TranslationService from '@/components/translation/TranslationService';
import { ArrowLeft, Globe, Languages } from 'lucide-react';

export default function TranslationDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-950 to-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="mr-4">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-blue-600">
              Translation Services
            </h1>
            <p className="text-gray-400">Multilingual support for healthcare communication</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <TranslationService initialText="Hello, I'm experiencing severe headaches and dizziness for the past three days. The pain is concentrated on the right side of my head and gets worse when I move suddenly." />
          
          <Card className="bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 border border-indigo-900/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="h-5 w-5 text-primary" />
                About Our Translation Service
              </CardTitle>
              <CardDescription>
                Breaking language barriers in healthcare
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Our translation service uses advanced AI to provide accurate translations for medical terminology and healthcare communications. This helps patients and healthcare providers overcome language barriers.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                  <h3 className="text-lg font-medium text-white mb-2">For Patients</h3>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">•</span>
                      Describe symptoms in your native language
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">•</span>
                      Understand doctor's instructions clearly
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">•</span>
                      Access medical information in your preferred language
                    </li>
                  </ul>
                </div>
                
                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                  <h3 className="text-lg font-medium text-white mb-2">For Healthcare Providers</h3>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">•</span>
                      Communicate effectively with international patients
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">•</span>
                      Translate medical documents and records
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">•</span>
                      Provide care instructions in multiple languages
                    </li>
                  </ul>
                </div>
              </div>
              
              <p className="text-sm text-gray-400 mt-4">
                Our system supports 10+ languages and is specifically trained on medical terminology to ensure accurate translations for healthcare contexts.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}