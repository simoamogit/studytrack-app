import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Componenti
import Layout from './components/layout/Layout';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import VotiPage from './components/voti/VotiPage';
import OrarioPage from './components/orario/OrarioPage';
import MateriePage from './components/materie/MateriePage';
import EventiPage from './components/eventi/EventiPage';
import CalendarPage from './components/calendar/CalendarPage';
import ProfilePage from './components/profile/ProfilePage';
import SettingsPage from './components/settings/SettingsPage';
import NotFound from './components/common/NotFound';

// Route protetta
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <div>Caricamento...</div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const { userProfile } = useAuth();
  
  useEffect(() => {
    if (userProfile?.settings?.darkMode) {
      setDarkMode(true);
    }
  }, [userProfile]);
  
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#f50057',
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/voti" element={
            <ProtectedRoute>
              <Layout>
                <VotiPage />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/orario" element={
            <ProtectedRoute>
              <Layout>
                <OrarioPage />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/materie" element={
            <ProtectedRoute>
              <Layout>
                <MateriePage />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/eventi" element={
            <ProtectedRoute>
              <Layout>
                <EventiPage />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/calendario" element={
            <ProtectedRoute>
              <Layout>
                <CalendarPage />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/profilo" element={
            <ProtectedRoute>
              <Layout>
                <ProfilePage />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/impostazioni" element={
            <ProtectedRoute>
              <Layout>
                <SettingsPage />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default function AppWithAuth() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}