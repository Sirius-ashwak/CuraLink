import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { LoadingMascot } from '@/components/ui/loading-mascot';
import { HealthMascot } from '@/components/ui/health-mascot';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export default function LoadingDemo() {
  const [variant, setVariant] = useState<'default' | 'appointment' | 'emergency' | 'consultation'>('default');
  const [size, setSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [mascotColor, setMascotColor] = useState<'primary' | 'blue' | 'green' | 'red' | 'orange'>('primary');
  const [showMascot, setShowMascot] = useState(true);
  const [showSpinner, setShowSpinner] = useState(true);
  const [showOverlay, setShowOverlay] = useState(false);
  const [customMessage, setCustomMessage] = useState('Your health is loading...');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold">Healthcare Loading Mascot</h1>
        <p className="mt-2 text-muted-foreground">
          Animated loading screens with a friendly healthcare mascot
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="type">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="type">Type</TabsTrigger>
                <TabsTrigger value="appearance">Appearance</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
              </TabsList>
              
              <TabsContent value="type" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Loading Type</Label>
                  <Select value={variant} onValueChange={(value) => setVariant(value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="appointment">Appointment</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="consultation">Consultation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="show-overlay">Show Overlay</Label>
                  <Switch 
                    id="show-overlay" 
                    checked={showOverlay} 
                    onCheckedChange={setShowOverlay} 
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="appearance" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Size</Label>
                  <Select value={size} onValueChange={(value) => setSize(value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sm">Small</SelectItem>
                      <SelectItem value="md">Medium</SelectItem>
                      <SelectItem value="lg">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Mascot Color</Label>
                  <Select value={mascotColor} onValueChange={(value) => setMascotColor(value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">Primary</SelectItem>
                      <SelectItem value="blue">Blue</SelectItem>
                      <SelectItem value="green">Green</SelectItem>
                      <SelectItem value="red">Red</SelectItem>
                      <SelectItem value="orange">Orange</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="show-mascot">Show Mascot</Label>
                  <Switch 
                    id="show-mascot" 
                    checked={showMascot} 
                    onCheckedChange={setShowMascot} 
                  />
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="show-spinner">Show Spinner</Label>
                  <Switch 
                    id="show-spinner" 
                    checked={showSpinner} 
                    onCheckedChange={setShowSpinner} 
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="content" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="custom-message">Custom Message</Label>
                  <input
                    id="custom-message"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </TabsContent>
            </Tabs>
            
            <Separator className="my-6" />
            
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setShowOverlay(!showOverlay)}>
                {showOverlay ? 'Hide' : 'Show'} Overlay
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setVariant('default');
                  setSize('md');
                  setMascotColor('primary');
                  setShowMascot(true);
                  setShowSpinner(true);
                  setCustomMessage('Your health is loading...');
                }}
              >
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border p-4">
              <h3 className="mb-4 text-sm font-medium">Current Settings:</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Type: <span className="font-medium">{variant}</span></div>
                <div>Size: <span className="font-medium">{size}</span></div>
                <div>Show Mascot: <span className="font-medium">{showMascot ? 'Yes' : 'No'}</span></div>
                <div>Show Spinner: <span className="font-medium">{showSpinner ? 'Yes' : 'No'}</span></div>
                <div className="col-span-2">Message: <span className="font-medium">{customMessage}</span></div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-center">
              <div className="h-[300px] w-full max-w-md overflow-hidden rounded-lg border">
                {showOverlay ? (
                  <div className="relative h-full w-full">
                    <div className="absolute inset-0 flex items-center justify-center bg-muted/20 p-6">
                      <p className="text-center">Content behind overlay</p>
                    </div>
                    <LoadingScreen
                      type="overlay"
                      variant={variant}
                      message={customMessage}
                      submessage="Please wait while we prepare your health information"
                      showMascot={showMascot}
                      showSpinner={showSpinner}
                    />
                  </div>
                ) : (
                  <div className="h-full w-full p-6">
                    <LoadingScreen
                      type="minimal"
                      variant={variant}
                      message={customMessage}
                      showMascot={showMascot}
                      showSpinner={showSpinner}
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-10">
        <h2 className="mb-4 text-2xl font-bold">Loading Components</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Health Mascot</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <HealthMascot size={size} color={mascotColor} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Loading Mascot</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <LoadingMascot 
                variant={variant} 
                size={size} 
                message="Processing..." 
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Full Page Loading</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button
                onClick={() => {
                  setShowOverlay(true);
                  setShowMascot(true);
                  setShowSpinner(true);
                }}
              >
                Show Full Screen
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}