import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./context/AuthContext";
import { WebSocketProvider } from "./context/WebSocketContext";
import { ThemeProvider } from "./context/ThemeContext";
import ErrorBoundary from "./components/ErrorBoundary";
import useSettingsInit from "./hooks/useSettingsInit";

import Welcome from "@/pages/welcome";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import VideoCall from "@/pages/video-call";
import LoadingDemo from "@/pages/loading-demo";
import NotFound from "@/pages/not-found";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import Notifications from "@/pages/Notifications";
import Logout from "@/pages/Logout";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Welcome} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/video-call" component={VideoCall} />
      <Route path="/video-call/:id" component={VideoCall} />
      <Route path="/profile" component={Profile} />
      <Route path="/settings" component={Settings} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/logout" component={Logout} />
      <Route path="/loading-demo" component={LoadingDemo} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Initialize user settings from localStorage
  useSettingsInit();
  
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            {/* Wrap WebSocketProvider in another ErrorBoundary to prevent connection issues from breaking the app */}
            <ErrorBoundary>
              <WebSocketProvider>
                <Router />
                <Toaster />
              </WebSocketProvider>
            </ErrorBoundary>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
