import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';
import { 
  collection, query, getDocs, where, Timestamp 
} from 'firebase/firestore';
import { 
  Container, Typography, Box, Paper, Grid,
  Button, Chip, Card, CardContent, Divider
} from '@mui/material';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import itIT from 'date-fns/locale/it';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import EventIcon from '@mui/icons-material/Event';
import AssignmentIcon from '@mui/icons-material/Assignment';
import QuizIcon from '@mui/icons-material/Quiz';
import SchoolIcon from '@mui/icons-material/School';

const locales = {
  'it': itIT,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const CalendarPage = () => {
  const { currentUser, userProfile } = useAuth();
  const [events, setEvents] = useState([]);
  const [materie, setMaterie] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEvents, setSelectedEvents] = useState([]);
  
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
        
        // Carica gli eventi
        const eventiRef = collection(db, `eventi/${currentUser.uid}/anni/${annoCorrente}/eventi`);
        const eventiSnapshot = await getDocs(eventiRef);
        const eventiList = eventiSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.titolo,
            start: data.data.toDate(),
            end: data.data.toDate(),
            allDay: true,
            tipo: data.tipo,
            materiaId: data.materiaId,
            descrizione: data.descrizione
          };
        });
        
        // Carica i voti
        const votiRef = collection(db, `voti/${currentUser.uid}/anni/${annoCorrente}/voti`);
        const votiSnapshot = await getDocs(votiRef);
        const votiList = votiSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: `Voto ${data.valore} - ${getNomeMateria(data.materiaId, materieList)}`,
            start: data.data.toDate(),
            end: data.data.toDate(),
            allDay: true,
            tipo: 'Voto',
            materiaId: data.materiaId,
            valore: data.valore,
            descrizione: data.descrizione
          };
        });
        
        // Combina tutti gli eventi
        setEvents([...eventiList, ...votiList]);
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
  const getNomeMateria = (materiaId, materieList = materie) => {
    const materia = materieList.find(m => m.id === materiaId);
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
  
  // Gestione selezione data
  const handleSelectSlot = ({ start }) => {
    setSelectedDate(start);
    const eventsForDay = events.filter(event => 
      new Date(event.start).toDateString() === new Date(start).toDateString()
    );
    setSelectedEvents(eventsForDay);
  };
  
  // Gestione selezione evento
  const handleSelectEvent = (event) => {
    setSelectedDate(event.start);
    const eventsForDay = events.filter(e => 
      new Date(e.start).toDateString() === new Date(event.start).toDateString()
    );
    setSelectedEvents(eventsForDay);
  };
  
  // Ottieni colore evento in base al tipo
  const eventStyleGetter = (event) => {
    let backgroundColor = '#3174ad';
    
    switch (event.tipo) {
      case 'Verifica':
        backgroundColor = '#f44336';
        break;
      case 'Compito':
        backgroundColor = '#2196f3';
        break;
      case 'Voto':
        backgroundColor = event.valore >= 6 ? '#4caf50' : '#ff9800';
        break;
      case 'Supplenza':
        backgroundColor = '#9c27b0';
        break;
      default:
        backgroundColor = '#757575';
    }
    
    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        color: 'white',
        border: 'none'
      }
    };
  };
  
  // Ottieni icona in base al tipo di evento
  const getEventIcon = (tipo) => {
    switch (tipo.toLowerCase()) {
      case 'verifica':
        return <QuizIcon color="error" />;
      case 'compito':
        return <AssignmentIcon color="primary" />;
      case 'voto':
        return <SchoolIcon color="success" />;
      default:
        return <EventIcon color="action" />;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Calendario
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: 600 }}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              selectable
              eventPropGetter={eventStyleGetter}
              culture="it"
              messages={{
                next: "Successivo",
                previous: "Precedente",
                today: "Oggi",
                month: "Mese",
                week: "Settimana",
                day: "Giorno",
                agenda: "Agenda",
                date: "Data",
                time: "Ora",
                event: "Evento",
                noEventsInRange: "Nessun evento in questo periodo"
              }}
            />
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Eventi del {formatDate(selectedDate)}
            </Typography>
            
            {selectedEvents.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Nessun evento per questa data
              </Typography>
            ) : (
              selectedEvents.map((event, index) => (
                <Card key={event.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      {getEventIcon(event.tipo)}
                      <Typography variant="subtitle1" sx={{ ml: 1 }}>
                        {event.title}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                      <Chip 
                        label={event.tipo} 
                        size="small" 
                        color={
                          event.tipo === 'Verifica' ? 'error' : 
                          event.tipo === 'Compito' ? 'primary' :
                          event.tipo === 'Voto' ? 'success' : 'default'
                        }
                      />
                      
                      {event.materiaId && (
                        <Chip 
                          label={getNomeMateria(event.materiaId)} 
                          size="small" 
                          variant="outlined"
                        />
                      )}
                    </Box>
                    
                    {event.descrizione && (
                      <Typography variant="body2" color="text.secondary">
                        {event.descrizione}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CalendarPage;

