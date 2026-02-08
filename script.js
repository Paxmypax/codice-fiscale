// Dati comuni - caricati dal file JSON
let comuniData = [];

// Tabelle per il calcolo del codice fiscale
const MESI = {
    1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'E', 6: 'H',
    7: 'L', 8: 'M', 9: 'P', 10: 'R', 11: 'S', 12: 'T'
};

const VOCALI = 'AEIOU';
const CONSONANTI = 'BCDFGHJKLMNPQRSTVWXYZ';

// Tabella valori caratteri pari (posizioni 2, 4, 6, ...)
const VALORI_PARI = {
    '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
    'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5, 'G': 6, 'H': 7, 'I': 8, 'J': 9,
    'K': 10, 'L': 11, 'M': 12, 'N': 13, 'O': 14, 'P': 15, 'Q': 16, 'R': 17, 'S': 18,
    'T': 19, 'U': 20, 'V': 21, 'W': 22, 'X': 23, 'Y': 24, 'Z': 25
};

// Tabella valori caratteri dispari (posizioni 1, 3, 5, ...)
const VALORI_DISPARI = {
    '0': 1, '1': 0, '2': 5, '3': 7, '4': 9, '5': 13, '6': 15, '7': 17, '8': 19, '9': 21,
    'A': 1, 'B': 0, 'C': 5, 'D': 7, 'E': 9, 'F': 13, 'G': 15, 'H': 17, 'I': 19, 'J': 21,
    'K': 2, 'L': 4, 'M': 18, 'N': 20, 'O': 11, 'P': 3, 'Q': 6, 'R': 8, 'S': 12,
    'T': 14, 'U': 16, 'V': 10, 'W': 22, 'X': 25, 'Y': 24, 'Z': 23
};

// Tabella resto -> carattere di controllo
const CARATTERE_CONTROLLO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Caricamento comuni dal file JSON
async function caricaComuni() {
    try {
        const response = await fetch('codici_catastali.json');
        if (!response.ok) {
            throw new Error('Impossibile caricare il file dei comuni');
        }
        comuniData = await response.json();
        console.log(`Caricati ${comuniData.length} comuni`);
    } catch (error) {
        console.error('Errore nel caricamento dei comuni:', error);
        mostraErrore('Errore nel caricamento dei comuni. Assicurati che il file codici_catastali.json sia presente.');
    }
}

// Normalizza stringa: rimuove accenti e caratteri speciali
function normalizza(str) {
    return str.toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Rimuove accenti
        .replace(/[^A-Z]/g, ''); // Mantiene solo lettere
}

// Estrae consonanti da una stringa
function estraiConsonanti(str) {
    return str.split('').filter(c => CONSONANTI.includes(c)).join('');
}

// Estrae vocali da una stringa
function estraiVocali(str) {
    return str.split('').filter(c => VOCALI.includes(c)).join('');
}

// Calcola le 3 lettere del cognome
function calcolaCognome(cognome) {
    const normalizzato = normalizza(cognome);
    const consonanti = estraiConsonanti(normalizzato);
    const vocali = estraiVocali(normalizzato);
    
    let codice = consonanti + vocali + 'XXX';
    return codice.substring(0, 3);
}

// Calcola le 3 lettere del nome
function calcolaNome(nome) {
    const normalizzato = normalizza(nome);
    const consonanti = estraiConsonanti(normalizzato);
    const vocali = estraiVocali(normalizzato);
    
    let codice;
    if (consonanti.length >= 4) {
        // Se ci sono 4 o più consonanti: prima, terza e quarta
        codice = consonanti[0] + consonanti[2] + consonanti[3];
    } else {
        // Altrimenti: consonanti + vocali + X
        codice = (consonanti + vocali + 'XXX').substring(0, 3);
    }
    
    return codice;
}

// Calcola anno, mese e giorno
function calcolaDataSesso(data, sesso) {
    const anno = data.getFullYear().toString().slice(-2);
    const mese = MESI[data.getMonth() + 1];
    let giorno = data.getDate();
    
    // Per le femmine si aggiunge 40 al giorno
    if (sesso === 'F') {
        giorno += 40;
    }
    
    // Giorno sempre a 2 cifre
    const giornoStr = giorno.toString().padStart(2, '0');
    
    return anno + mese + giornoStr;
}

// Cerca il codice catastale del comune
function cercaComune(nomeComune) {
    const normalizzato = normalizza(nomeComune);
    
    // Cerca corrispondenza esatta o parziale
    const risultato = comuniData.find(c => {
        // Estrae solo il nome del comune (senza sigla provincia)
        const nomeCompletoNorm = normalizza(c.comune.split('(')[0].trim());
        return nomeCompletoNorm === normalizzato;
    });
    
    if (risultato) {
        return risultato.codice;
    }
    
    // Ricerca più flessibile
    const risultatoFlessibile = comuniData.find(c => {
        const nomeCompletoNorm = normalizza(c.comune);
        return nomeCompletoNorm.includes(normalizzato) || normalizzato.includes(normalizza(c.comune.split('(')[0].trim()));
    });
    
    return risultatoFlessibile ? risultatoFlessibile.codice : null;
}

// Calcola il carattere di controllo
function calcolaCarattereControllo(codice15) {
    let somma = 0;
    
    for (let i = 0; i < 15; i++) {
        const carattere = codice15[i];
        if ((i + 1) % 2 === 1) {
            // Posizione dispari (1, 3, 5, ...)
            somma += VALORI_DISPARI[carattere];
        } else {
            // Posizione pari (2, 4, 6, ...)
            somma += VALORI_PARI[carattere];
        }
    }
    
    const resto = somma % 26;
    return CARATTERE_CONTROLLO[resto];
}

// Genera il codice fiscale completo
function generaCodiceFiscale(cognome, nome, data, sesso, comune) {
    // Valida input
    if (!cognome || !nome || !data || !sesso || !comune) {
        throw new Error('Tutti i campi sono obbligatori');
    }
    
    // Calcola le parti del codice
    const codiceCognome = calcolaCognome(cognome);
    const codiceNome = calcolaNome(nome);
    const codiceDataSesso = calcolaDataSesso(data, sesso);
    const codiceComune = cercaComune(comune);
    
    if (!codiceComune) {
        throw new Error(`Comune "${comune}" non trovato. Verifica il nome e riprova.`);
    }
    
    // Componi i primi 15 caratteri
    const codice15 = codiceCognome + codiceNome + codiceDataSesso + codiceComune;
    
    // Calcola e aggiungi il carattere di controllo
    const carattereControllo = calcolaCarattereControllo(codice15);
    
    return codice15 + carattereControllo;
}

// Mostra errore
function mostraErrore(messaggio) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = messaggio;
    errorDiv.classList.remove('hidden');
    
    const resultDiv = document.getElementById('result');
    resultDiv.classList.add('hidden');
}

// Nascondi errore
function nascondiErrore() {
    const errorDiv = document.getElementById('error');
    errorDiv.classList.add('hidden');
}

// Mostra risultato
function mostraRisultato(codiceFiscale) {
    const resultDiv = document.getElementById('result');
    const cfInput = document.getElementById('codiceFiscale');
    
    cfInput.value = codiceFiscale;
    resultDiv.classList.remove('hidden');
    nascondiErrore();
    
    // Nascondi messaggio copia se visibile
    document.getElementById('copyMessage').classList.add('hidden');
}

// Copia negli appunti
async function copiaNegliAppunti() {
    const cfInput = document.getElementById('codiceFiscale');
    const copyMessage = document.getElementById('copyMessage');
    
    try {
        await navigator.clipboard.writeText(cfInput.value);
        copyMessage.classList.remove('hidden');
        
        // Nascondi il messaggio dopo 2 secondi
        setTimeout(() => {
            copyMessage.classList.add('hidden');
        }, 2000);
    } catch (err) {
        // Fallback per browser che non supportano clipboard API
        cfInput.select();
        document.execCommand('copy');
        copyMessage.classList.remove('hidden');
        
        setTimeout(() => {
            copyMessage.classList.add('hidden');
        }, 2000);
    }
}

// Popola suggerimenti comuni
function aggiornaSuggerimentiComuni(input) {
    const datalist = document.getElementById('comuni-list');
    const valore = normalizza(input);
    
    // Svuota suggerimenti precedenti
    datalist.innerHTML = '';
    
    if (valore.length < 2) return;
    
    // Filtra comuni che iniziano con il valore inserito
    const suggerimenti = comuniData
        .filter(c => {
            const nomeNorm = normalizza(c.comune.split('(')[0].trim());
            return nomeNorm.startsWith(valore);
        })
        .slice(0, 10); // Limita a 10 suggerimenti
    
    suggerimenti.forEach(c => {
        const option = document.createElement('option');
        option.value = c.comune.split('(')[0].trim();
        datalist.appendChild(option);
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Carica i comuni
    caricaComuni();
    
    // Form submit
    const form = document.getElementById('cf-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const cognome = document.getElementById('cognome').value.trim();
        const nome = document.getElementById('nome').value.trim();
        const dataNascita = document.getElementById('dataNascita').value;
        const sesso = document.getElementById('sesso').value;
        const comune = document.getElementById('comune').value.trim();
        
        try {
            const data = new Date(dataNascita);
            if (isNaN(data.getTime())) {
                throw new Error('Data di nascita non valida');
            }
            
            const codiceFiscale = generaCodiceFiscale(cognome, nome, data, sesso, comune);
            mostraRisultato(codiceFiscale);
        } catch (error) {
            mostraErrore(error.message);
        }
    });
    
    // Pulsante copia
    const copyBtn = document.getElementById('copyBtn');
    copyBtn.addEventListener('click', copiaNegliAppunti);
    
    // Suggerimenti comuni
    const comuneInput = document.getElementById('comune');
    comuneInput.addEventListener('input', (e) => {
        aggiornaSuggerimentiComuni(e.target.value);
    });
});
