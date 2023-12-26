const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Sett av stemte brukere for å sikre en stemme per bruker
const votersSet = new Set();

// Opprett Express-appen
const app = express();

// Middleware for CORS og JSON parsing
app.use(cors());
app.use(express.json());

// MongoDB-tilkobling
mongoose.connect('mongodb+srv://TheodorNEngoy:Guggu123@cluster1.psfqs.mongodb.net/?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Failed to connect to MongoDB:', err));

// Suggestion Schema
const suggestionSchema = new mongoose.Schema({
  title: String,
  description: String,
  votes: { type: Number, default: 0 },
  voters: [String]
});

// Suggestion Model
const Suggestion = mongoose.model('Suggestion', suggestionSchema);

// POST-forespørsel for å legge til et forslag
app.post('/suggestions', async (req, res) => {
  try {
    const { title, description } = req.body;
    const suggestion = new Suggestion({ title, description });
    await suggestion.save();
    res.status(201).json(suggestion);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create suggestion' });
  }
});

// GET-forespørsel for å hente forslag
app.get('/suggestions', async (req, res) => {
  try {
    const suggestions = await Suggestion.find();
    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve suggestions' });
  }
});

// POST-forespørsel for å stemme på et forslag
app.post('/suggestions/:id/vote', async (req, res) => {
  const { id } = req.params;
  const { voterId } = req.body;

  if (votersSet.has(voterId)) {
    return res.status(403).json({ error: 'You have already voted' });
  }

  try {
    const suggestion = await Suggestion.findById(id);
    if (!suggestion) {
      return res.status(404).json({ error: 'Suggestion not found' });
    }

    suggestion.votes++;
    suggestion.voters.push(voterId);
    await suggestion.save();

    votersSet.add(voterId); // Legg til stemmen i settet for å forhindre fremtidige stemmer
    res.json(suggestion);
  } catch (err) {
    res.status(500).json({ error: 'Failed to vote on suggestion' });
  }
});

// Start serveren
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
