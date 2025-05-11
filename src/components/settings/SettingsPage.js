import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { 
  Container, Typography, Box, Paper, Grid, 
  Switch, FormControlLabel, Divider, Alert,
  Button, List, ListItem, ListItemText, ListItemIcon
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PaletteIcon from '@mui/icons-material/Palette';
import SecurityIcon from '@mui/icons-material/Security';
import DeleteIcon from '@mui/icons-material/Delete';

const SettingsPage = () => {
  const { currentUser, userProfile, updateUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [settings, setSettings] = useState({
    notificheEventi: userProfile?.settings?.notificheEventi !== false,
    notificheVoti: userProfile?.settings?.notificheVoti !== false,
    darkMode: userProfile?.settings?.darkMode || false,
    mostraMediaVoti: userProfile?.settings?.mostraMediaVoti !== false
  });
  
  // Gestione switch
  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setSettings({
      ...settings,
      [name]: checked
    });
  };
  
  // Salvataggio impostazioni
  const handleSaveSettings = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        settings,
        updatedAt: new Date()
      });
      
      // Aggiorna contesto
      updateUserProfile({ settings });
      
      setSuccess(true);
      setLoading(false);
    } catch (error) {
      console.error("Errore nell'aggiornamento delle impostazioni:", error);
      setError('Si è verificato un errore durante il salvataggio delle impostazioni');
      setLoading(false);
    }
  };
  
  // Eliminazione account
  const handleDeleteAccount = () => {
    if (window.confirm("Sei sicuro di voler eliminare il tuo account? Questa azione è irreversibile e tutti i tuoi dati verranno persi.")) {
      alert("Funzionalità non ancora implementata");
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Impostazioni
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mt: 3 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            {success && (
              <Alert severity="success" sx={{ mb: 3 }}>
                Impostazioni salvate con successo!
              </Alert>
            )}
            
            <List>
              <ListItem>
                <ListItemIcon>
                  <NotificationsIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Notifiche" 
                  secondary="Gestisci le notifiche dell'applicazione"
                />
              </ListItem>
              <Divider component="li" />
              
              <ListItem>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notificheEventi}
                      onChange={handleSwitchChange}
                      name="notificheEventi"
                    />
                  }
                  label="Notifiche per eventi e verifiche"
                />
              </ListItem>
              
              <ListItem>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notificheVoti}
                      onChange={handleSwitchChange}
                      name="notificheVoti"
                    />
                  }
                  label="Notifiche per nuovi voti"
                />
              </ListItem>
              
              <ListItem sx={{ mt: 2 }}>
                <ListItemIcon>
                  <PaletteIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Aspetto" 
                  secondary="Personalizza l'aspetto dell'applicazione"
                />
              </ListItem>
              <Divider component="li" />
              
              <ListItem>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.darkMode}
                      onChange={handleSwitchChange}
                      name="darkMode"
                    />
                  }
                  label="Modalità scura"
                />
              </ListItem>
              
              <ListItem sx={{ mt: 2 }}>
                <ListItemIcon>
                  <SecurityIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Privacy" 
                  secondary="Gestisci le impostazioni sulla privacy"
                />
              </ListItem>
              <Divider component="li" />
              
              <ListItem>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.mostraMediaVoti}
                      onChange={handleSwitchChange}
                      name="mostraMediaVoti"
                    />
                  }
                  label="Mostra media voti nella dashboard"
                />
              </ListItem>
            </List>
            
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveSettings}
                disabled={loading}
              >
                {loading ? 'Salvataggio...' : 'Salva Impostazioni'}
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom color="error">
              Zona Pericolosa
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Typography variant="body2" paragraph>
              L'eliminazione dell'account è un'azione irreversibile. Tutti i tuoi dati, inclusi voti, eventi e impostazioni, verranno eliminati permanentemente.
            </Typography>
            
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDeleteAccount}
              fullWidth
            >
              Elimina Account
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default SettingsPage;