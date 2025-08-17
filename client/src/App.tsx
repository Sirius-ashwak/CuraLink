import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./context/AuthContext";

import { ThemeProvider } from "./context/ThemeContext";
import { SettingsProvider } from "./context/SettingsContext";
import { TranslationProvider } from "./context/TranslationContext";
import { LightThemeProvider } from "./components/light-theme/LightThemeProvider";
import ForceLight from "./components/light-theme/ForceLight";
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
import LightThemeShowcase from "@/pages/LightThemeShowcase";
import EnhancedEmergencyTransport from "@/pages/EnhancedEmergencyTransport";
import Doctors from "@/pages/doctors";
import Appointments from "@/pages/appointments";
import ComprehensiveSettings from "@/pages/ComprehensiveSettings";
import SymptomChecker from "@/pages/SymptomChecker";
import IndustryDashboard from "@/pages/IndustryDashboard";
import MapTest from "@/pages/MapTest";
import MapboxEmergencyPage from "@/pages/MapboxEmergencyPage";
import TranslationDemo from "@/pages/TranslationDemo";

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
      <Route path="/settings" component={ComprehensiveSettings} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/logout" component={Logout} />
      <Route path="/loading-demo" component={LoadingDemo} />
      <Route path="/light-theme-showcase" component={LightThemeShowcase} />
      <Route path="/emergency-transport" component={EnhancedEmergencyTransport} />
      <Route path="/doctors" component={Doctors} />
      <Route path="/appointments" component={Appointments} />
      <Route path="/symptom-checker" component={SymptomChecker} />
      <Route path="/industry-dashboard" component={IndustryDashboard} />
      <Route path="/map-test" component={MapTest} />
      <Route path="/mapbox-emergency" component={MapboxEmergencyPage} />
      <Route path="/translation" component={TranslationDemo} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Initialize user settings from localStorage
  useSettingsInit();
  
  return (
    <ErrorBoundary>
      <SettingsProvider>
        <ThemeProvider>
          <TranslationProvider>
            <AuthProvider>
              <Router />
              <Toaster />
            </AuthProvider>
          </TranslationProvider>
        </ThemeProvider>
      </SettingsProvider>
    </ErrorBoundary>
  );
}

export default App;