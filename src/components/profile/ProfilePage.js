import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db, storage } from '../../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  Container, Typography, Box, Paper, Grid, 
  TextField, Button, Avatar, Divider, Alert,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import SaveIcon from '@mui/icons-material/Save';

const ProfilePage = () => {
  const { currentUser, userProfile, updateUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    nome: userProfile?.nome || '',
    cognome: userProfile?.cognome || '',
    scuola: userProfile?.scuola || '',
    classe: userProfile?.classe || '',
    annoScolasticoCorrente: userProfile?.annoScolasticoCorrente || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(userProfile?.photoURL || '');
  
  // Gestione form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Modifica la funzione handlePhotoChange
const handlePhotoChange = (e) => {
  if (e.target.files[0]) {
    setPhotoFile(e.target.files[0]);
    // Usa URL.createObjectURL per creare un'anteprima locale
    setPhotoPreview(URL.createObjectURL(e.target.files[0]));
  }
};

// Modifica la funzione handleSaveProfile
const handleSaveProfile = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');
  setSuccess(false);
  
  try {
    // Invece di caricare la foto su Firebase Storage, usa un servizio esterno o un avatar predefinito
    let photoURL = userProfile?.photoURL || '';
    
    // Se l'utente ha selezionato una nuova foto, potresti:
    // 1. Usare un avatar predefinito basato sul nome
    // 2. Usare un servizio di avatar come Gravatar
    // 3. Informare l'utente che il caricamento delle foto è temporaneamente disabilitato
    if (photoFile) {
      // Opzione 1: Usa un avatar predefinito basato sul nome
      const initials = `${formData.nome.charAt(0)}${formData.cognome.charAt(0)}`.toUpperCase();
      const colors = ['#1976d2', '#388e3c', '#d32f2f', '#f57c00', '#7b1fa2'];
      const colorIndex = (formData.nome.length + formData.cognome.length) % colors.length;
      photoURL = `https://ui-avatars.com/api/?name=${initials}&background=${colors[colorIndex].substring(1)}&color=fff`;
      
      // Opzione 2: Se l'utente ha un'email, potresti usare Gravatar
      // const emailHash = md5(currentUser.email.trim().toLowerCase());
      // photoURL = `https://www.gravatar.com/avatar/${emailHash}?d=identicon`;
    }
    
    // Aggiorna profilo
    const profileData = {
      ...formData,
      photoURL,
      updatedAt: new Date()
    };
    
    const userRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userRef, profileData);
    
    // Aggiorna contesto
    updateUserProfile(profileData);
    
    setSuccess(true);
    setLoading(false);
  } catch (error) {
    console.error("Errore nell'aggiornamento del profilo:", error);
    setError('Si è verificato un errore durante il salvataggio del profilo');
    setLoading(false);
  }
};
  
  // Genera anni scolastici
  const getAnniScolastici = () => {
    const currentYear = new Date().getFullYear();
    const anni = [];
    
    for (let i = -2; i <= 2; i++) {
      const year = currentYear + i;
      anni.push(`${year}-${year + 1}`);
    }
    
    return anni;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Profilo Utente
      </Typography>
      
      <Paper sx={{ p: 3, mt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Profilo aggiornato con successo!
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSaveProfile}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Avatar
                src={photoPreview}
                sx={{ width: 150, height: 150, mb: 2 }}
              />
              <Button
                variant="outlined"
                component="label"
                startIcon={<PhotoCameraIcon />}
              >
                Cambia Foto
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handlePhotoChange}
                />
              </Button>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                Dimensione massima: 5MB
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>
                Informazioni Personali
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Nome"
                    name="nome"
                    value={formData.nome}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Cognome"
                    name="cognome"
                    value={formData.cognome}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={currentUser.email}
                    disabled
                  />
                </Grid>
              </Grid>
              
              <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                Informazioni Scolastiche
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Scuola"
  name="scuola"
                    value={formData.scuola}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Classe"
                    name="classe"
                    value={formData.classe}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Anno Scolastico Corrente</InputLabel>
                    <Select
                      name="annoScolasticoCorrente"
                      value={formData.annoScolasticoCorrente}
                      onChange={handleInputChange}
                    >
                      {getAnniScolastici().map((anno) => (
                        <MenuItem key={anno} value={anno}>
                          {anno}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={loading}
                >
                  {loading ? 'Salvataggio...' : 'Salva Profilo'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default ProfilePage;