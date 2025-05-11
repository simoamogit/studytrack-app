import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc 
} from 'firebase/firestore';
import { 
  Container, Typography, Box, Button, Grid, Paper, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, FormControl, InputLabel, Select, Tabs, Tab
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';

const OrarioPage = () => {
  const { currentUser, userProfile } = useAuth();
  const [materie, setMaterie] = useState([]);
  const [orario, setOrario] = useState({});
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentLezione, setCurrentLezione] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    ora: '',
    materiaId: '',
    aula: '',
    inizio: '',
    fine: ''
  });
  
  const annoCorrente = userProfile?.annoScolasticoCorrente || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
  const giorni = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
  const oreDefault = [1, 2, 3, 4, 5, 6, 7, 8];
  
  // Carica materie e orario
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
        
        // Carica l'orario
        const orarioData = {};
        
        for (const giorno of giorni) {
          const orarioRef = doc(db, `orario/${currentUser.uid}/anni/${annoCorrente}/giorni/${giorno}`);
          const orarioDoc = await getDoc(orarioRef);
          
          if (orarioDoc.exists()) {
            orarioData[giorno] = orarioDoc.data().lezioni || [];
          } else {
            // Crea un documento vuoto se non esiste
            orarioData[giorno] = [];
            await setDoc(orarioRef, { lezioni: [] });
          }
        }
        
        setOrario(orarioData);
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
  
  // Apertura dialog per modifica lezione
  const handleOpenDialog = (giorno, ora) => {
    const lezioneCorrente = orario[giorno]?.find(l => l.ora === ora);
    
    if (lezioneCorrente) {
      setCurrentLezione({ giorno, ...lezioneCorrente });
      setFormData({
        ora: lezioneCorrente.ora,
        materiaId: lezioneCorrente.materiaId || '',
        aula: lezioneCorrente.aula || '',
        inizio: lezioneCorrente.inizio || '',
        fine: lezioneCorrente.fine || ''
      });
    } else {
      setCurrentLezione({ giorno, ora });
      setFormData({
        ora: ora,
        materiaId: '',
        aula: '',
        inizio: '',
        fine: ''
      });
    }
    
    setOpenDialog(true);
  };
  
  // Salvataggio lezione
  const handleSaveLezione = async () => {
    try {
      const { giorno } = currentLezione;
      const lezioneData = {
        ora: formData.ora,
        materiaId: formData.materiaId,
        aula: formData.aula,
        inizio: formData.inizio,
        fine: formData.fine
      };
      
      // Aggiorna l'orario locale
      const nuoveLezioni = [...(orario[giorno] || [])];
      const index = nuoveLezioni.findIndex(l => l.ora === formData.ora);
      
      if (index !== -1) {
        nuoveLezioni[index] = lezioneData;
      } else {
        nuoveLezioni.push(lezioneData);
      }
      
      // Ordina le lezioni per ora
      nuoveLezioni.sort((a, b) => a.ora - b.ora);
      
      setOrario({
        ...orario,
        [giorno]: nuoveLezioni
      });
      
      // Aggiorna il database
      const orarioRef = doc(db, `orario/${currentUser.uid}/anni/${annoCorrente}/giorni/${giorno}`);
      await updateDoc(orarioRef, { lezioni: nuoveLezioni });
      
      setOpenDialog(false);
    } catch (error) {
      console.error("Errore nel salvataggio della lezione:", error);
      alert("Si è verificato un errore durante il salvataggio");
    }
  };
  
  // Rimozione lezione
  const handleRemoveLezione = async () => {
    try {
      const { giorno, ora } = currentLezione;
      
      // Aggiorna l'orario locale
      const nuoveLezioni = orario[giorno].filter(l => l.ora !== ora);
      
      setOrario({
        ...orario,
        [giorno]: nuoveLezioni
      });
      
      // Aggiorna il database
      const orarioRef = doc(db, `orario/${currentUser.uid}/anni/${annoCorrente}/giorni/${giorno}`);
      await updateDoc(orarioRef, { lezioni: nuoveLezioni });
      
      setOpenDialog(false);
    } catch (error) {
      console.error("Errore nella rimozione della lezione:", error);
      alert("Si è verificato un errore durante la rimozione");
    }
  };
  
  // Cambio tab
  const handleChangeTab = (event, newValue) => {
    setCurrentTab(newValue);
  };
  
  // Ottieni nome materia
  const getNomeMateria = (materiaId) => {
    const materia = materie.find(m => m.id === materiaId);
    return materia ? materia.nome : '';
  };
  
  // Ottieni cella orario
  const getOrarioCell = (giorno, ora) => {
    const lezione = orario[giorno]?.find(l => l.ora === ora);
    
    if (!lezione || !lezione.materiaId) {
      return editMode ? (
        <Button 
          variant="outlined" 
          size="small" 
          onClick={() => handleOpenDialog(giorno, ora)}
          sx={{ width: '100%', height: '100%', minHeight: '80px' }}
        >
          +
        </Button>
      ) : null;
    }
    
    return (
      <Box 
        sx={{ 
          p: 1, 
          height: '100%',
          cursor: editMode ? 'pointer' : 'default',
          '&:hover': { bgcolor: editMode ? 'action.hover' : 'transparent' }
        }}
        onClick={editMode ? () => handleOpenDialog(giorno, ora) : undefined}
      >
<Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
          {getNomeMateria(lezione.materiaId)}
        </Typography>
        {lezione.aula && (
          <Typography variant="body2" color="text.secondary">
            Aula: {lezione.aula}
          </Typography>
        )}
        {lezione.inizio && lezione.fine && (
          <Typography variant="body2" color="text.secondary">
            {lezione.inizio} - {lezione.fine}
          </Typography>
        )}
      </Box>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Orario Scolastico</Typography>
        <Button 
          variant="contained" 
          startIcon={editMode ? <SaveIcon /> : <EditIcon />} 
          onClick={() => setEditMode(!editMode)}
        >
          {editMode ? 'Termina Modifica' : 'Modifica Orario'}
        </Button>
      </Box>
      
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={currentTab}
          onChange={handleChangeTab}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          {giorni.map((giorno, index) => (
            <Tab key={giorno} label={giorno} id={`tab-${index}`} />
          ))}
        </Tabs>
        
        {giorni.map((giorno, index) => (
          <Box
            key={giorno}
            role="tabpanel"
            hidden={currentTab !== index}
            id={`tabpanel-${index}`}
            aria-labelledby={`tab-${index}`}
            sx={{ p: 2 }}
          >
            {currentTab === index && (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell width="10%">Ora</TableCell>
                      <TableCell width="90%">Materia</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {oreDefault.map((ora) => (
                      <TableRow key={ora}>
                        <TableCell>{ora}</TableCell>
                        <TableCell>{getOrarioCell(giorno, ora)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        ))}
      </Paper>
      
      {/* Dialog per modifica lezione */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {currentLezione?.materiaId ? 'Modifica Lezione' : 'Aggiungi Lezione'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
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
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Aula"
                  name="aula"
                  value={formData.aula}
                  onChange={handleInputChange}
                />
              </Grid>
              
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Ora inizio"
                  name="inizio"
                  value={formData.inizio}
                  onChange={handleInputChange}
                  placeholder="es. 8:00"
                />
              </Grid>
              
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Ora fine"
                  name="fine"
                  value={formData.fine}
                  onChange={handleInputChange}
                  placeholder="es. 9:00"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          {currentLezione?.materiaId && (
            <Button onClick={handleRemoveLezione} color="error">
              Rimuovi
            </Button>
          )}
          <Button onClick={() => setOpenDialog(false)}>Annulla</Button>
          <Button onClick={handleSaveLezione} variant="contained">Salva</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default OrarioPage;

