import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';
import { 
  collection, query, where, getDocs, addDoc, deleteDoc, doc, 
  orderBy, Timestamp, updateDoc 
} from 'firebase/firestore';
import { 
  Container, Typography, Box, Button, Grid, Paper, 
  List, ListItem, ListItemText, ListItemSecondaryAction,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, FormControl, InputLabel, Select, Chip,
  Divider, Card, CardContent, CardActions
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EventIcon from '@mui/icons-material/Event';
import AssignmentIcon from '@mui/icons-material/Assignment';
import QuizIcon from '@mui/icons-material/Quiz';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { it } from 'date-fns/locale';

const EventiPage = () => {
  const { currentUser, userProfile } = useAuth();
  const [eventi, setEventi] = useState([]);
  const [materie, setMaterie] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentEvento, setCurrentEvento] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    titolo: '',
    data: new Date(),
    tipo: 'Evento',
    materiaId: '',
    descrizione: ''
  });
  
  const annoCorrente = userProfile?.annoScolasticoCorrente || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
  
  // Carica materie ed eventi
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Carica le materie
        const materieRef = collection(db, `materie/${currentUser.uid}/anni/${annoCorrente}/materie`);
        const materieSnapshot = await getDocs(materieRef);
        const materieList = materieSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMaterie(materieList);
        
        // Carica gli eventi
        const eventiRef = collection(db, `eventi/${currentUser.uid}/anni/${annoCorrente}/eventi`);
        const eventiQuery = query(eventiRef, orderBy('data', 'asc'));
        const eventiSnapshot = await getDocs(eventiQuery);
        const eventiList = eventiSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          data: doc.data().data.toDate()
        }));
        
        setEventi(eventiList);
        setLoading(false);
      } catch (error) {
        console.error("Errore nel caricamento dei dati:", error);
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
  
  const handleDateChange = (newDate) => {
    setFormData({
      ...formData,
      data: newDate
    });
  };
  
  // Apertura dialog per nuovo evento
  const handleOpenDialog = () => {
    setCurrentEvento(null);
    setFormData({
      titolo: '',
      data: new Date(),
      tipo: 'Evento',
      materiaId: '',
      descrizione: ''
    });
    setOpenDialog(true);
  };
  
  // Apertura dialog per modifica evento
  const handleEditEvento = (evento) => {
    setCurrentEvento(evento);
    setFormData({
      titolo: evento.titolo,
      data: evento.data,
      tipo: evento.tipo,
      materiaId: evento.materiaId || '',
      descrizione: evento.descrizione || ''
    });
    setOpenDialog(true);
  };
  
  // Salvataggio evento (nuovo o modifica)
  const handleSaveEvento = async () => {
    try {
      // Validazione
      if (!formData.titolo || !formData.data || !formData.tipo) {
        alert('Compila tutti i campi obbligatori');
        return;
      }
      
      const eventoData = {
        titolo: formData.titolo,
        data: Timestamp.fromDate(formData.data),
        tipo: formData.tipo,
        materiaId: formData.materiaId || null,
        descrizione: formData.descrizione
      };
      
      if (currentEvento) {
        // Aggiorna evento esistente
        const eventoRef = doc(db, `eventi/${currentUser.uid}/anni/${annoCorrente}/eventi/${currentEvento.id}`);
        await updateDoc(eventoRef, eventoData);
        
        // Aggiorna stato locale
        setEventi(eventi.map(e => 
          e.id === currentEvento.id ? { ...e, ...eventoData, data: formData.data } : e
        ));
      } else {
        // Crea nuovo evento
        const eventiRef = collection(db, `eventi/${currentUser.uid}/anni/${annoCorrente}/eventi`);
        const docRef = await addDoc(eventiRef, eventoData);
        
        // Aggiorna stato locale
        setEventi([...eventi, { id: docRef.id, ...eventoData, data: formData.data }]);
      }
      
      setOpenDialog(false);
    } catch (error) {
      console.error("Errore nel salvataggio dell'evento:", error);
      alert("Si è verificato un errore durante il salvataggio");
    }
  };
  
  // Eliminazione evento
  const handleDeleteEvento = async (eventoId) => {
    if (window.confirm("Sei sicuro di voler eliminare questo evento?")) {
      try {
        const eventoRef = doc(db, `eventi/${currentUser.uid}/anni/${annoCorrente}/eventi/${eventoId}`);
        await deleteDoc(eventoRef);
        
        // Aggiorna stato locale
        setEventi(eventi.filter(e => e.id !== eventoId));
      } catch (error) {
        console.error("Errore nell'eliminazione dell'evento:", error);
        alert("Si è verificato un errore durante l'eliminazione");
      }
    }
  };
  
  // Formattazione data
  const formatDate = (date) => {
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };
  
  // Ottieni nome materia
  const getNomeMateria = (materiaId) => {
    const materia = materie.find(m => m.id === materiaId);
    return materia ? materia.nome : '';
  };
  
  // Ottieni icona in base al tipo di evento
  const getEventIcon = (tipo) => {
    switch (tipo.toLowerCase()) {
      case 'verifica':
        return <QuizIcon color="error" />;
      case 'compito':
        return <AssignmentIcon color="primary" />;
      default:
        return <EventIcon color="action" />;
    }
  };
  
  // Raggruppa eventi per mese
  const eventiRaggruppati = () => {
    const gruppi = {};
    
    eventi.forEach(evento => {
      const mese = new Date(evento.data).toLocaleString('it-IT', { month: 'long', year: 'numeric' });
      if (!gruppi[mese]) {
        gruppi[mese] = [];
      }
      gruppi[mese].push(evento);
    });
    
    return gruppi;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Gestione Eventi</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={handleOpenDialog}
        >
          Nuovo Evento
        </Button>
      </Box>
      
      {loading ? (
        <Typography>Caricamento...</Typography>
      ) : eventi.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6">Nessun evento programmato</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Clicca su "Nuovo Evento" per aggiungerne uno
          </Typography>
        </Paper>
      ) : (
        Object.entries(eventiRaggruppati()).map(([mese, eventiMese]) => (
          <Paper key={mese} sx={{ mb: 3, overflow: 'hidden' }}>
            <Box sx={{ px: 2, py: 1.5, bgcolor: 'primary.main', color: 'white' }}>
              <Typography variant="h6">{mese}</Typography>
            </Box>
            <List>
              {eventiMese.map((evento, index) => (
                <React.Fragment key={evento.id}>
                  <ListItem>
                    <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                      {getEventIcon(evento.tipo)}
                    </Box>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="subtitle1" component="span">
                            {evento.titolo}
                          </Typography>
                          <Chip 
                            label={evento.tipo} 
                            size="small" 
                            sx={{ ml: 1 }} 
                            color={
                              evento.tipo === 'Verifica' ? 'error' : 
                              evento.tipo === 'Compito' ? 'primary' : 'default'
                            }
                          />
                        </Box>
                      }
                      secondary={
                        <React.Fragment>
                          <Typography component="span" variant="body2" color="text.primary">
                            {formatDate(evento.data)}
                          </Typography>
                          {evento.materiaId && (
                            <Typography component="span" variant="body2" sx={{ ml: 1 }}>
                              • {getNomeMateria(evento.materiaId)}
                            </Typography>
                          )}
                          {evento.descrizione && (
                            <Typography variant="body2" component="div" sx={{ mt: 0.5 }}>
                              {evento.descrizione}
                            </Typography>
                          )}
                        </React.Fragment>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" onClick={() => handleEditEvento(evento)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton edge="end" onClick={() => handleDeleteEvento(evento.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < eventiMese.length - 1 && <Divider variant="inset" component="li" />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        ))
      )}
      
      {/* Dialog per aggiunta/modifica evento */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {currentEvento ? 'Modifica Evento' : 'Nuovo Evento'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              fullWidth
              margin="normal"
              label="Titolo"
              name="titolo"
              value={formData.titolo}
              onChange={handleInputChange}
              required
            />
            
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={it}>
              <DatePicker
                label="Data"
                value={formData.data}
                onChange={handleDateChange}
                renderInput={(params) => <TextField {...params} fullWidth margin="normal" required />}
              />
            </LocalizationProvider>
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Tipo</InputLabel>
              <Select
                name="tipo"
                value={formData.tipo}
                onChange={handleInputChange}
                required
              >
                <MenuItem value="Evento">Evento</MenuItem>
                <MenuItem value="Verifica">Verifica</MenuItem>
                <MenuItem value="Compito">Compito</MenuItem>
                <MenuItem value="Supplenza">Supplenza</MenuItem>
                <MenuItem value="Altro">Altro</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Materia</InputLabel>
              <Select
                name="materiaId"
                value={formData.materiaId}
                onChange={handleInputChange}
              >
                <MenuItem value="">Nessuna</MenuItem>
                {materie.map((materia) => (
                  <MenuItem key={materia.id} value={materia.id}>
                    {materia.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              margin="normal"
              label="Descrizione"
              name="descrizione"
              multiline
              rows={3}
              value={formData.descrizione}
              onChange={handleInputChange}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Annulla</Button>
          <Button onClick={handleSaveEvento} variant="contained">Salva</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EventiPage;