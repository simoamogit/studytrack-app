import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';
import { 
  collection, query, where, getDocs, addDoc, deleteDoc, doc, 
  orderBy, Timestamp, updateDoc 
} from 'firebase/firestore';
import { 
  Container, Typography, Box, Button, Grid, Paper, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, FormControl, InputLabel, Select, Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { it } from 'date-fns/locale';

const VotiPage = () => {
  const { currentUser, userProfile } = useAuth();
  const [voti, setVoti] = useState([]);
  const [materie, setMaterie] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openFilterDialog, setOpenFilterDialog] = useState(false);
  const [currentVoto, setCurrentVoto] = useState(null);
  const [filtri, setFiltri] = useState({
    materiaId: '',
    quadrimestre: '',
    tipo: '',
    dataInizio: null,
    dataFine: null
  });
  
  // Form state
  const [formData, setFormData] = useState({
    materiaId: '',
    valore: '',
    data: new Date(),
    descrizione: '',
    tipo: 'Scritto',
    peso: 1,
    quadrimestre: 1
  });
  
  const annoCorrente = userProfile?.annoScolasticoCorrente || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
  
  // Carica materie e voti
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
        
        // Carica i voti con filtri
        await loadVoti();
        
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
  
  // Carica i voti applicando i filtri
  const loadVoti = async () => {
    try {
      const votiRef = collection(db, `voti/${currentUser.uid}/anni/${annoCorrente}/voti`);
      let votiQuery = query(votiRef, orderBy('data', 'desc'));
      
      // Applica i filtri
      const constraints = [];
      
      if (filtri.materiaId) {
        constraints.push(where('materiaId', '==', filtri.materiaId));
      }
      
      if (filtri.quadrimestre) {
        constraints.push(where('quadrimestre', '==', parseInt(filtri.quadrimestre)));
      }
      
      if (filtri.tipo) {
        constraints.push(where('tipo', '==', filtri.tipo));
      }
      
      if (filtri.dataInizio) {
        const startDate = new Date(filtri.dataInizio);
        startDate.setHours(0, 0, 0, 0);
        constraints.push(where('data', '>=', Timestamp.fromDate(startDate)));
      }
      
      if (filtri.dataFine) {
        const endDate = new Date(filtri.dataFine);
        endDate.setHours(23, 59, 59, 999);
        constraints.push(where('data', '<=', Timestamp.fromDate(endDate)));
      }
      
      // Se ci sono filtri, crea una nuova query
      if (constraints.length > 0) {
        votiQuery = query(votiRef, ...constraints, orderBy('data', 'desc'));
      }
      
      const votiSnapshot = await getDocs(votiQuery);
      const votiList = votiSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        data: doc.data().data.toDate()
      }));
      
      setVoti(votiList);
    } catch (error) {
      console.error("Errore nel caricamento dei voti:", error);
    }
  };
  
  // Gestione form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'valore' || name === 'peso' ? parseFloat(value) : value
    });
  };
  
  const handleDateChange = (newDate) => {
    setFormData({
      ...formData,
      data: newDate
    });
  };
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFiltri({
      ...filtri,
      [name]: value
    });
  };
  
  const handleFilterDateChange = (name, newDate) => {
    setFiltri({
      ...filtri,
      [name]: newDate
    });
  };
  
  // Apertura dialog per nuovo voto
  const handleOpenDialog = () => {
    setCurrentVoto(null);
    setFormData({
      materiaId: '',
      valore: '',
      data: new Date(),
      descrizione: '',
      tipo: 'Scritto',
      peso: 1,
      quadrimestre: 1
    });
    setOpenDialog(true);
  };
  
  // Apertura dialog per modifica voto
  const handleEditVoto = (voto) => {
    setCurrentVoto(voto);
    setFormData({
      materiaId: voto.materiaId,
      valore: voto.valore,
      data: voto.data,
      descrizione: voto.descrizione || '',
      tipo: voto.tipo,
      peso: voto.peso || 1,
      quadrimestre: voto.quadrimestre
    });
    setOpenDialog(true);
  };
  
  // Salvataggio voto (nuovo o modifica)
  const handleSaveVoto = async () => {
    try {
      // Validazione
      if (!formData.materiaId || !formData.valore || !formData.data || !formData.tipo) {
        alert('Compila tutti i campi obbligatori');
        return;
      }
      
      const votoData = {
        materiaId: formData.materiaId,
        valore: parseFloat(formData.valore),
        data: Timestamp.fromDate(formData.data),
        descrizione: formData.descrizione,
        tipo: formData.tipo,
        peso: parseFloat(formData.peso) || 1,
        quadrimestre: parseInt(formData.quadrimestre)
      };
      
      if (currentVoto) {
        // Aggiorna voto esistente
        const votoRef = doc(db, `voti/${currentUser.uid}/anni/${annoCorrente}/voti/${currentVoto.id}`);
        await updateDoc(votoRef, votoData);
      } else {
        // Crea nuovo voto
        const votiRef = collection(db, `voti/${currentUser.uid}/anni/${annoCorrente}/voti`);
        await addDoc(votiRef, votoData);
      }
      
      // Ricarica i voti
      await loadVoti();
      setOpenDialog(false);
    } catch (error) {
      console.error("Errore nel salvataggio del voto:", error);
      alert("Si è verificato un errore durante il salvataggio");
    }
  };
  
  // Eliminazione voto
  const handleDeleteVoto = async (votoId) => {
    if (window.confirm("Sei sicuro di voler eliminare questo voto?")) {
      try {
        const votoRef = doc(db, `voti/${currentUser.uid}/anni/${annoCorrente}/voti/${votoId}`);
        await deleteDoc(votoRef);
        await loadVoti();
      } catch (error) {
        console.error("Errore nell'eliminazione del voto:", error);
        alert("Si è verificato un errore durante l'eliminazione");
      }
    }
  };
  
  // Applicazione filtri
  const handleApplyFilters = async () => {
    await loadVoti();
    setOpenFilterDialog(false);
  };
  
  // Reset filtri
  const handleResetFilters = () => {
    setFiltri({
      materiaId: '',
      quadrimestre: '',
      tipo: '',
      dataInizio: null,
      dataFine: null
    });
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
    return materia ? materia.nome : 'N/D';
  };
  
  // Calcola la media dei voti visualizzati
  const mediaVotiVisualizzati = () => {
    if (voti.length === 0) return 0;
    
    const sommaVoti = voti.reduce((acc, voto) => acc + (voto.valore * (voto.peso || 1)), 0);
    const sommaPesi = voti.reduce((acc, voto) => acc + (voto.peso || 1), 0);
    return sommaVoti / sommaPesi;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Gestione Voti</Typography>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<FilterListIcon />} 
            onClick={() => setOpenFilterDialog(true)}
            sx={{ mr: 1 }}
          >
            Filtri
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={handleOpenDialog}
          >
            Nuovo Voto
          </Button>
        </Box>
      </Box>
      
      {/* Statistiche */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6">Media: {mediaVotiVisualizzati().toFixed(2)}</Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="h6">Voti totali: {voti.length}</Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="h6">
              Filtri attivi: {Object.values(filtri).filter(v => v !== '' && v !== null).length}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Tabella voti */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Data</TableCell>
              <TableCell>Materia</TableCell>
              <TableCell>Voto</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Peso</TableCell>
              <TableCell>Quadrimestre</TableCell>
              <TableCell>Descrizione</TableCell>
              <TableCell>Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {voti.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Nessun voto trovato
                </TableCell>
              </TableRow>
            ) : (
              voti.map((voto) => (
                <TableRow key={voto.id}>
                  <TableCell>{formatDate(voto.data)}</TableCell>
                  <TableCell>{getNomeMateria(voto.materiaId)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={voto.valore} 
                      color={
                        voto.valore >= 6 ? 'success' : 
                        voto.valore >= 5 ? 'warning' : 'error'
                      } 
                    />
                  </TableCell>
                  <TableCell>{voto.tipo}</TableCell>
                  <TableCell>{voto.peso || 1}</TableCell>
                  <TableCell>{voto.quadrimestre}</TableCell>
                  <TableCell>{voto.descrizione || '-'}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleEditVoto(voto)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteVoto(voto.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Dialog per aggiunta/modifica voto */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {currentVoto ? 'Modifica Voto' : 'Nuovo Voto'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Materia</InputLabel>
              <Select
                name="materiaId"
                value={formData.materiaId}
                onChange={handleInputChange}
                required
              >
{materie.map((materia) => (
                  <MenuItem key={materia.id} value={materia.id}>
                    {materia.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Voto"
                  name="valore"
                  type="number"
                  inputProps={{ min: 1, max: 10, step: 0.25 }}
                  value={formData.valore}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={it}>
                  <DatePicker
                    label="Data"
                    value={formData.data}
                    onChange={handleDateChange}
                    renderInput={(params) => <TextField {...params} fullWidth margin="normal" required />}
                  />
                </LocalizationProvider>
              </Grid>
            </Grid>
            
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    name="tipo"
                    value={formData.tipo}
                    onChange={handleInputChange}
                    required
                  >
                    <MenuItem value="Scritto">Scritto</MenuItem>
                    <MenuItem value="Orale">Orale</MenuItem>
                    <MenuItem value="Pratico">Pratico</MenuItem>
                    <MenuItem value="Altro">Altro</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Peso"
                  name="peso"
                  type="number"
                  inputProps={{ min: 0.5, max: 3, step: 0.5 }}
                  value={formData.peso}
                  onChange={handleInputChange}
                  helperText="Importanza del voto"
                />
              </Grid>
              <Grid item xs={4}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Quadrimestre</InputLabel>
                  <Select
                    name="quadrimestre"
                    value={formData.quadrimestre}
                    onChange={handleInputChange}
                    required
                  >
                    <MenuItem value={1}>Primo</MenuItem>
                    <MenuItem value={2}>Secondo</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            
            <TextField
              fullWidth
              margin="normal"
              label="Descrizione"
              name="descrizione"
              multiline
              rows={2}
              value={formData.descrizione}
              onChange={handleInputChange}
              placeholder="Argomento, capitolo, ecc."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Annulla</Button>
          <Button onClick={handleSaveVoto} variant="contained">Salva</Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog per filtri */}
      <Dialog open={openFilterDialog} onClose={() => setOpenFilterDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Filtra Voti</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Materia</InputLabel>
              <Select
                name="materiaId"
                value={filtri.materiaId}
                onChange={handleFilterChange}
              >
                <MenuItem value="">Tutte</MenuItem>
                {materie.map((materia) => (
                  <MenuItem key={materia.id} value={materia.id}>
                    {materia.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Quadrimestre</InputLabel>
                  <Select
                    name="quadrimestre"
                    value={filtri.quadrimestre}
                    onChange={handleFilterChange}
                  >
                    <MenuItem value="">Entrambi</MenuItem>
                    <MenuItem value="1">Primo</MenuItem>
                    <MenuItem value="2">Secondo</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    name="tipo"
                    value={filtri.tipo}
                    onChange={handleFilterChange}
                  >
                    <MenuItem value="">Tutti</MenuItem>
                    <MenuItem value="Scritto">Scritto</MenuItem>
                    <MenuItem value="Orale">Orale</MenuItem>
                    <MenuItem value="Pratico">Pratico</MenuItem>
                    <MenuItem value="Altro">Altro</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={it}>
                  <DatePicker
                    label="Data inizio"
                    value={filtri.dataInizio}
                    onChange={(newDate) => handleFilterDateChange('dataInizio', newDate)}
                    renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={it}>
                  <DatePicker
                    label="Data fine"
                    value={filtri.dataFine}
                    onChange={(newDate) => handleFilterDateChange('dataFine', newDate)}
                    renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
                  />
                </LocalizationProvider>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleResetFilters}>Reset</Button>
          <Button onClick={() => setOpenFilterDialog(false)}>Annulla</Button>
          <Button onClick={handleApplyFilters} variant="contained">Applica</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default VotiPage;