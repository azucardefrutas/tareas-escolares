const express = require('express');
const router = express.Router();


// rutas se agregarán después

module.exports = router;


const pool = require('../config/db');
exports.register = async (req, res) => {

  const { nombre, correo, password } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO usuarios (nombre, correo, password) VALUES ($1, $2, $3) RETURNING *',
      [nombre, correo, password]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



exports.login = async (req, res) => {
  res.json({ message: 'Login pendiente (se implementa después)' });
};
