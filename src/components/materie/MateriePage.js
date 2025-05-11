import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';
import { 
  collection, query, getDocs, addDoc, deleteDoc, doc, updateDoc 
} from 'firebase/firestore';
import { 
  Container, Typography, Box, Button, Grid, Paper, 
  List, ListItem, ListItemText, ListItemSecondaryAction,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Divider, Card, CardContent, CardActions
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SchoolIcon from '@mui/icons-material/School';

const MateriePage = () => {
  const { currentUser, userProfile } = useAuth();
  const [materie, setMaterie] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentMateria, setCurrentMateria] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    professore: '',
    colore: '#1976d2',
    note: ''
  });
  
  const annoCorrente = userProfile?.annoScolasticoCorrente || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
  
  // Carica materie
  useEffect(() => {
    const fetchData = async () => {
      try {
        const materieRef = collection(db, `materie/${currentUser.uid}/anni/${annoCorrente}/materie`);
        const materieSnapshot = await getDocs(materieRef);
        const materieList = materieSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMaterie(materieList);
        setLoading(false);
      } catch (error) {
        console.error("Errore nel caricamento delle materie:", error);
        setLoading(false);
      }
    };
    
    if (currentUser) {
      fetchData();
    }
  }, [currentUser, annoCorrente]);
  
  // Gestione form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Apertura dialog per nuova materia
  const handleOpenDialog = () => {
    setCurrentMateria(null);
    setFormData({
      nome: '',
      professore: '',
      colore: '#1976d2',
      note: ''
    });
    setOpenDialog(true);
  };
  
  // Apertura dialog per modifica materia
  const handleEditMateria = (materia) => {
    setCurrentMateria(materia);
    setFormData({
      nome: materia.nome,
      professore: materia.professore || '',
      colore: materia.colore || '#1976d2',
      note: materia.note || ''
    });
    setOpenDialog(true);
  };
  
  // Salvataggio materia (nuova o modifica)
  const handleSaveMateria = async () => {
    try {
      // Validazione
      if (!formData.nome) {
        alert('Il nome della materia è obbligatorio');
        return;
      }
      
      const materiaData = {
        nome: formData.nome,
        professore: formData.professore,
        colore: formData.colore,
        note: formData.note
      };
      
      if (currentMateria) {
        // Aggiorna materia esistente
        const materiaRef = doc(db, `materie/${currentUser.uid}/anni/${annoCorrente}/materie/${currentMateria.id}`);
        await updateDoc(materiaRef, materiaData);
        
        // Aggiorna stato locale
        setMaterie(materie.map(m => 
          m.id === currentMateria.id ? { ...m, ...materiaData } : m
        ));
      } else {
        // Crea nuova materia
        const materieRef = collection(db, `materie/${currentUser.uid}/anni/${annoCorrente}/materie`);
        const docRef = await addDoc(materieRef, materiaData);
        
        // Aggiorna stato locale
        setMaterie([...materie, { id: docRef.id, ...materiaData }]);
      }
      
      setOpenDialog(false);
    } catch (error) {
      console.error("Errore nel salvataggio della materia:", error);
      alert("Si è verificato un errore durante il salvataggio");
    }
  };
  
  // Eliminazione materia
  const handleDeleteMateria = async (materiaId) => {
    if (window.confirm("Sei sicuro di voler eliminare questa materia? Verranno eliminati anche tutti i voti associati.")) {
      try {
        const materiaRef = doc(db, `materie/${currentUser.uid}/anni/${annoCorrente}/materie/${materiaId}`);
        await deleteDoc(materiaRef);
        
        // Aggiorna stato locale
        setMaterie(materie.filter(m => m.id !== materiaId));
      } catch (error) {
        console.error("Errore nell'eliminazione della materia:", error);
        alert("Si è verificato un errore durante l'eliminazione");
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Gestione Materie</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={handleOpenDialog}
        >
          Nuova Materia
        </Button>
      </Box>
      
      <Grid container spacing={3}>
        {materie.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6">Nessuna materia presente</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Clicca su "Nuova Materia" per aggiungerne una
              </Typography>
            </Paper>
          </Grid>
        ) : (
          materie.map((materia) => (
            <Grid item xs={12} sm={6} md={4} key={materia.id}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                borderTop: `4px solid ${materia.colore || '#1976d2'}`
              }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <SchoolIcon sx={{ mr: 1, color: materia.colore || '#1976d2' }} />
                    <Typography variant="h6" component="div">
                      {materia.nome}
                    </Typography>
                  </Box>
                  
                  {materia.professore && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Prof: {materia.professore}
                    </Typography>
                  )}
                  
                  {materia.note && (
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      {materia.note}
                    </Typography>
                  )}
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    startIcon={<EditIcon />}
                    onClick={() => handleEditMateria(materia)}
                  >
                    Modifica
                  </Button>
                  <Button 
                    size="small" 
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDeleteMateria(materia.id)}
                  >
                    Elimina
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
      
      {/* Dialog per aggiunta/modifica materia */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {currentMateria ? 'Modifica Materia' : 'Nuova Materia'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              fullWidth
              margin="normal"
              label="Nome Materia"
              name="nome"
              value={formData.nome}
              onChange={handleInputChange}
              required
            />
            
            <TextField
              fullWidth
              margin="normal"
              label="Professore"
              name="professore"
              value={formData.professore}
              onChange={handleInputChange}
            />
            
            <Box sx={{ mt: 2, mb: 1 }}>
              <Typography variant="body2" gutterBottom>
                Colore
              </Typography>
              <TextField
                fullWidth
                name="colore"
                type="color"
                value={formData.colore}
                onChange={handleInputChange}
                sx={{ width: '100%' }}
              />
            </Box>
            
            <TextField
              fullWidth
              margin="normal"
              label="Note"
              name="note"
              multiline
              rows={3}
              value={formData.note}
              onChange={handleInputChange}
            />
           </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Annulla</Button>
          <Button onClick={handleSaveMateria} variant="contained">Salva</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MateriePage;

