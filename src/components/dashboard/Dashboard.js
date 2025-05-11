import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';
import { 
  collection, query, getDocs, where, orderBy, limit, Timestamp 
} from 'firebase/firestore';
import { 
  Container, Typography, Box, Grid, Paper, Divider,
  List, ListItem, ListItemText, ListItemIcon, Card, CardContent,
  Button, Chip, Avatar
} from '@mui/material';
import { Link } from 'react-router-dom';
import EventIcon from '@mui/icons-material/Event';
import AssignmentIcon from '@mui/icons-material/Assignment';
import QuizIcon from '@mui/icons-material/Quiz';
import GradeIcon from '@mui/icons-material/Grade';
import SchoolIcon from '@mui/icons-material/School';
import TodayIcon from '@mui/icons-material/Today';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const Dashboard = () => {
  const { currentUser, userProfile } = useAuth();
  const [voti, setVoti] = useState([]);
  const [eventi, setEventi] = useState([]);
  const [materie, setMaterie] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const annoCorrente = userProfile?.annoScolasticoCorrente || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
  
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
        
        // Carica gli ultimi voti
        const votiRef = collection(db, `voti/${currentUser.uid}/anni/${annoCorrente}/voti`);
        const votiQuery = query(votiRef, orderBy('data', 'desc'), limit(5));
        const votiSnapshot = await getDocs(votiQuery);
        const votiList = votiSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          data: doc.data().data.toDate()
        }));
        setVoti(votiList);
        
        // Carica i prossimi eventi
        const oggi = new Date();
        oggi.setHours(0, 0, 0, 0);
        
        const eventiRef = collection(db, `eventi/${currentUser.uid}/anni/${annoCorrente}/eventi`);
        const eventiQuery = query(
          eventiRef, 
          where('data', '>=', Timestamp.fromDate(oggi)),
          orderBy('data', 'asc'),
          limit(5)
        );
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
  
  // Ottieni nome materia
  const getNomeMateria = (materiaId) => {
    const materia = materie.find(m => m.id === materiaId);
    return materia ? materia.nome : 'N/D';
  };
  
  // Formattazione data
  const formatDate = (date) => {
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };
  
  // Calcola la media dei voti
  const mediaVoti = () => {
    if (voti.length === 0) return 0;
    
    const sommaVoti = voti.reduce((acc, voto) => acc + (voto.valore * (voto.peso || 1)), 0);
    const sommaPesi = voti.reduce((acc, voto) => acc + (voto.peso || 1), 0);
    return sommaVoti / sommaPesi;
  };
  
  // Ottieni giorno della settimana
  const getGiornoSettimana = () => {
    const giorni = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    return giorni[new Date().getDay()];
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Anno scolastico {annoCorrente}
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        {/* Riepilogo */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Oggi
            </Typography>
            <Typography component="p" variant="h4">
              {getGiornoSettimana()}
            </Typography>
            <Typography color="text.secondary" sx={{ flex: 1 }}>
              {new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Media Voti
            </Typography>
            <Typography component="p" variant="h4">
              {mediaVoti().toFixed(2)}
            </Typography>
            <Typography color="text.secondary" sx={{ flex: 1 }}>
              su {voti.length} voti registrati
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Materie
            </Typography>
            <Typography component="p" variant="h4">
              {materie.length}
            </Typography>
            <Typography color="text.secondary" sx={{ flex: 1 }}>
              materie registrate
            </Typography>
          </Paper>
        </Grid>
        
        {/* Ultimi voti */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography component="h2" variant="h6" color="primary">
                Ultimi Voti
              </Typography>
              <Button 
                component={Link} 
                to="/voti" 
                size="small" 
                endIcon={<ArrowForwardIcon />}
              >
                Vedi tutti
              </Button>
            </Box>
            <Divider />
            
            {voti.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                Nessun voto registrato
              </Typography>
            ) : (
              <List sx={{ width: '100%' }}>
                {voti.map((voto) => (
                  <ListItem key={voto.id} alignItems="flex-start">
                    <ListItemIcon>
                      <Avatar 
                        sx={{ 
                          bgcolor: voto.valore >= 6 ? 'success.main' : 'warning.main',
                          width: 40,
                          height: 40
                        }}
                      >
                        {voto.valore}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={getNomeMateria(voto.materiaId)}
                      secondary={
                        <React.Fragment>
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.primary"
                          >
                            {voto.tipo}
                          </Typography>
                          {` — ${formatDate(voto.data)}`}
                          {voto.descrizione && (
                            <Typography variant="body2" component="div">
                              {voto.descrizione}
                            </Typography>
                          )}
                        </React.Fragment>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
        
        {/* Prossimi eventi */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography component="h2" variant="h6" color="primary">
                Prossimi Eventi
              </Typography>
              <Button 
                component={Link} 
                to="/eventi" 
                size="small" 
                endIcon={<ArrowForwardIcon />}
              >
                Vedi tutti
              </Button>
            </Box>
            <Divider />
            
            {eventi.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                Nessun evento programmato
              </Typography>
            ) : (
              <List sx={{ width: '100%' }}>
                {eventi.map((evento) => (
                  <ListItem key={evento.id} alignItems="flex-start">
                    <ListItemIcon>
                      {getEventIcon(evento.tipo)}
                    </ListItemIcon>
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
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.primary"
                          >
                            {formatDate(evento.data)}
                          </Typography>
                          {evento.materiaId && (
                            <Typography component="span" variant="body2" sx={{ ml: 1 }}>
                              • {getNomeMateria(evento.materiaId)}
                            </Typography>
                          )}
                          {evento.descrizione && (
                            <Typography variant="body2" component="div">
                              {evento.descrizione}
                            </Typography>
                          )}
                        </React.Fragment>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
        
        {/* Orario di oggi */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography component="h2" variant="h6" color="primary">
                Orario di Oggi
              </Typography>
              <Button 
                component={Link} 
                to="/orario" 
                size="small" 
                endIcon={<ArrowForwardIcon />}
              >
                Vedi orario completo
              </Button>
            </Box>
            <Divider />
            
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 3 }}>
              <TodayIcon sx={{ fontSize: 40, color: 'text.secondary', mr: 2 }} />
              <Typography variant="body1" color="text.secondary">
                Visualizza l'orario completo nella sezione Orario
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;

